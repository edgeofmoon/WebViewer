
var three_dataLoader = function () {
}

three_dataLoader.loadVolumeFromFile = function (file, callback) {
    var r = new FileReader();
    var extension = file.name.split('.').pop();
    var vol;
    r.onload = function (e) {
        if (extension === 'gz') {
            var contents = new Uint8Array(e.target.result);
            var gunzip = new Zlib.Gunzip(contents);
            var plain = gunzip.decompress();
            vol = nifti_parse(plain);
            //console.log(vol);
            callback(vol);
        }
        else if (extension === 'nii') {
            var contents = new Uint8Array(e.target.result);
            vol = nifti_parse(contents);
            //console.log(vol);
            callback(vol);
        }
        else {
            alert("Only accept nifti file");
        }
    }
    r.readAsArrayBuffer(file);
}

three_dataLoader.loadRoisFromVolume = function (volume) {
    var rois = [];
    for (var i = 3; i < 40; i++) {
        //console.log(i);
        var roi = new three_roi(volume.sizes);
        roi.buildFromVolume(volume, i);
        rois.push(roi);
        //spatialView.addMarchingCubesMesh(roi, 0.5);
    }
    var subView = roiView.addSubView(rois);
    roiView.activeSubView = subView;
    roiView.update();
}

// event handlers
three_dataLoader.loadRoisFileEventHandler = function (evt) {
    var f = evt.target.files[0];
    //console.log('roi loading');
    if (f) {
        three_dataLoader.loadVolumeFromFile(f, three_dataLoader.loadRoisFromVolume);
    } else {
        alert("Failed to load file");
    }
    evt.target.value = null;
}

three_dataLoader.buildTractVol = function(roiIdxArray, callback) {
    function mergeVolume(tractVols) {
        var n = tractVols[0].data.length;
        var data = new Float32Array(n);
        for (var iv = 0; iv < tractVols.length; iv++) {
            var vol = tractVols[iv];
            for (var i = 0; i < n; i++) {
                data[i] = Math.max(data[i], vol.data[i]);
            }

            // progress bar
            app.callbackProgress(0.8 + 0.2 * ((iv+1) / tractVols.length));
        }
        var vol;
        vol.sizes = tractVols[0].sizes.slice(0);
        vol.data = data;
        callback(vol);
    }
    // load volume file
    var tractVols = [];
    function loadDataFromEvent(event) {

        var extension = event.target.responseURL.split('.').pop();
        //console.log(event.target.responseURL);
        var fileContent = new Uint8Array(event.target.response);
        //console.log(fileContent);
        if (extension === 'gz') {
            var gunzip = new Zlib.Gunzip(fileContent);
            var plain = gunzip.decompress();
            vol = nifti_parse(plain);
        }
        else if (extension === 'nii') {
            vol = nifti_parse(fileContent);
        }
        else {
            alert("Only accept nifti file");
        }
        tractVols.push(vol);

        // progress bar
        app.callbackProgress(0.1 + 0.7 * (tractVols.length / roiIdxArray.length));

        if (tractVols.length === roiIdxArray.length) {
            mergeVolume(tractVols);
        }
    }
    var clients = [];
    for (var i = 0; i < roiIdxArray.length; i++) {
        (function(i) {
            var volfn = 'data/roiTracts/' + roiIdxArray[i] + '.nii.gz';
            clients[i] = new XMLHttpRequest();
            clients[i].open('GET', volfn, true);
            clients[i].responseType = "arraybuffer";
            clients[i].onreadystatechange = function (aEvt) {
                if (clients[i].readyState == 4) {
                    if (clients[i].status == 200) {
                        loadDataFromEvent(aEvt);
                    }
                    else
                        alert("Error loading roi tracts.\n");
                }
            };
            clients[i].send();

            // progress bar
            app.callbackProgress((i + 1) / roiIdxArray.length * 0.1);
        })(i);

    }
}

three_dataLoader.loadLabelFileEventHandler = function (evt) {
    var f = evt.target.files[0];
    //console.log('roi loading');
    if (f) {
        var rois = roiView.activeSubView.getRois();
        var reader = new FileReader();
        reader.onload = function (progressEvent) {
            var content = progressEvent.target.result;
            var lines = content.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var label_index = -1;
                var label_name = '';
                var remaining = lines[i];
                while (remaining.length !== 0 && label_name.length === 0) {
                    var decimerIndex = remaining.length-1;
                    var tabDecimerIndex = remaining.indexOf('\t');
                    if (tabDecimerIndex >= 0) {
                        decimerIndex = Math.min(decimerIndex, tabDecimerIndex);
                    }
                    var spaceDecimerIndex = remaining.indexOf(' ');
                    if (spaceDecimerIndex >= 0) {
                        decimerIndex = Math.min(decimerIndex, spaceDecimerIndex);
                    }
                    var lineDecimerIndex = remaining.indexOf('\n');
                    if (lineDecimerIndex >= 0) {
                        decimerIndex = Math.min(decimerIndex, lineDecimerIndex);
                    }
                    if (decimerIndex !== 0) {
                        if (label_index < 0) {
                            label_index = Number(remaining.substring(0, decimerIndex));
                        }
                        else {
                            label_name = remaining.substring(0, decimerIndex);
                        }
                    }
                    remaining = remaining.substring(decimerIndex + 1);
                }
                for (var j = 0; j < rois.length; j++) {
                    if (rois[j].maskValue == label_index) {
                        rois[j].name = label_name;
                    }
                }
            }
            roiView.update();
        }
        reader.readAsText(f);
    } else {
        alert("Failed to load file");
    }
    evt.target.value = null;
}

three_dataLoader.loadCSVDatahandler = function (evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    var leafname = file.name.split('\\').pop().split('/').pop().split('.').shift();
    reader.onload = function (e) {
        var contents = e.target.result;
        var table = CSVToArray(contents);
        // find roi row idx
        var roiNameRow = -1;
        for (var i = 0; i < table.length; i++) {
            if (table[i][0] == 'roi') {
                roiNameRow = i;
                break;
            }
        }
        if (roiNameRow == -1) {
            alert('Cannot Locate Roi Row!');
            return;
        }
        var rois = [];
        var roiCols = [];
        for (var i = 1; i < table[roiNameRow].length; i++) {
            var roiName = table[roiNameRow][i];
            var roi = getRoiByName(roiName);
            // sub-cortical roi
            if (roi){
                rois.push(roi);
                roiCols.push(i);
            }
            // cortical roi
            else {
                var clnRoiName = roiName.split('_')[0] + '_' + roiName.split('_')[1];
                var meshName = findCorticalMeshName(clnRoiName);
                var corticalRoi = new three_roi(-1);
                corticalRoi.name = roiName;
                corticalRoi.type = 'cortical';
                corticalRoi.meshFns.push(meshName);
                rois.push(corticalRoi);
                roiCols.push(i);
                globalRois.push(corticalRoi);
            }
            //else {
            //    alert('Cannot Locate Roi: ' + table[roiNameRow][i]);
            //}
        }

        // currently no stats is loaded
        var ctrlRows = [];
        var disdRows = [];
        
        // control cohort
        var ctrlCohortRoiData = new three_cohortRoiData();
        ctrlCohortRoiData.name = 'Control';
        ctrlCohortRoiData.rois = rois;
        for (var i = 0; i < rois.length; i++) {
            ctrlCohortRoiData.stats.push(new three_roiStats(rois[i]));
            for (var j = 0; j < ctrlRows.length; j++) {
                var stats = Number(table[ctrlRows[j]][roiCols[i]]);
                ctrlCohortRoiData.stats[i].subjectMeans.push(stats);
            }
            ctrlCohortRoiData.stats[i].setUpdate();
        }
        ctrlCohortRoiData.update();

        // diseased cohort
        var disdCohortRoiData = new three_cohortRoiData();
        disdCohortRoiData.name = 'SCZ';
        disdCohortRoiData.rois = rois;
        for (var i = 0; i < rois.length; i++) {
            disdCohortRoiData.stats.push(new three_roiStats(rois[i]));
            for (var j = 0; j < disdRows.length; j++) {
                var stats = Number(table[disdRows[j]][roiCols[i]]);
                disdCohortRoiData.stats[i].subjectMeans.push(stats);
            }
            disdCohortRoiData.stats[i].setUpdate();
        }
        disdCohortRoiData.update();

        // find pValue and effectSize col
        var pValueRow = -1;
        for (var i = 0; i < table.length; i++) {
            if (table[i][0] == 'meta_pval') {
                pValueRow = i;
                break;
            }
        }
        if (pValueRow == -1) {
            alert('Cannot Locate pValue!');
            return;
        }
        var effectSizeRow = -1;
        for (var i = 0; i < table.length; i++) {
            if (table[i][0] == 'meta_d') {
                effectSizeRow = i;
                break;
            }
        }
        if (effectSizeRow == -1) {
            alert('Cannot Locate effectSize!');
            return;
        }

        // load comp stats
        var cohortRoiCompStats = [];
        for (var i = 0; i < roiCols.length; i++) {
            var roiCol = roiCols[i];
            var compStats = new three_roiCompStats();
            compStats.stats[0] = ctrlCohortRoiData.stats[i];
            compStats.stats[1] = disdCohortRoiData.stats[i];
            compStats.pValue = Number(table[pValueRow][roiCol]);
            compStats.effectSize = Number(table[effectSizeRow][roiCol]);
            compStats.final = true;
            cohortRoiCompStats.push(compStats);
        }

        var cohortCompData = new three_cohortCompData();
        cohortCompData.rois = rois;
        cohortCompData.cohortRoiDataArray.push(ctrlCohortRoiData);
        cohortCompData.cohortRoiDataArray.push(disdCohortRoiData);
        cohortCompData.cohortRoiCompStats = cohortRoiCompStats;
        cohortCompData.name = leafname;
        cohortCompData.update();

        var newSubView = roiView.addSubView(cohortCompData.rois);
        newSubView.cohortCompData = cohortCompData;
        newSubView.init();
        newSubView.setStatsIndex(1);
        newSubView.name = leafname;
        //newSubView.update();
        roiView.getLegendManager().cohortCompDatasets.push(cohortCompData);
        roiView.update();

        if (spatialView.inplaceCharts) {
            if (rois[0].type == 'cortical') {
                var barLens = new three_barLens();
                barLens.cohortCompData = cohortCompData;
                barLens.update();
                barLenses.push(barLens);
            }
        }
        // update stacker
        statsStackerView.viewbox = roiView.viewbox;
        statsStackerView.cohortCompDatasets.length = 0;
        for (var i = 0; i < roiView.subViews.length; i++) {
            var cohortCompData = roiView.subViews[i].cohortCompData;
            statsStackerView.cohortCompDatasets.push(cohortCompData);
        }
        statsStackerView.update();

        // update in place chart
        //inplaceCharts.updateCompDatesets();
    }

    reader.readAsText(file);
    evt.target.value = null;
}

three_dataLoader.loadCohortEventHandler = function (evt) {
    var files = evt.target.files;
    var dirname = files[0].webkitRelativePath.match(/(.*)[\/\\]/)[1] || '';
    console.log(dirname);
    var fileUsed = 0;
    var cohortRoiData = new three_cohortRoiData();
    cohortRoiData.name = dirname;
    cohortRoiData.rois = roiView.activeSubView.getRois();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        three_dataLoader.loadVolumeFromFile(file, function (volume) {
            cohortRoiData.updateFromSubjectVolume(volume);
            fileUsed++;
            if (fileUsed === files.length) {
                cohortRoiData.update();
                roiView.activeSubView.cohortCompData.add(cohortRoiData);
                roiView.activeSubView.cohortCompData.update();
                roiView.activeSubView.update();
                evt.target.value = null;
                fileUsed = 0;
                cohortRoiData = null;
                console.log('control updated.');
            }
        })
    }
}


three_dataLoader.loadCohortEventHandler1 = function (evt) {
    var files = evt.target.files;
    var fileUsed = 0;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        three_dataLoader.loadVolumeFromFile(file, function (volume) {
            for (var j = 0; j < roiView.activeSubView.rois.length; j++) {
                roiView.activeSubView.roiCompStatsArray[j].stats[1].updateFromVolume(volume);
            }
            fileUsed++;
            if (fileUsed === files.length) {
                //console.log(roiStatsArray1);
                for (var j = 0; j < roiView.activeSubView.rois.length; j++) {
                    roiView.activeSubView.roiCompStatsArray[j].update();
                }
                console.log('diseased updated.');
                roiView.activeSubView.update();
                evt.target.value = null;
                fileUsed = 0;
            }
        })
    }
}

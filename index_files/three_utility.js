
// const definitions
// for sorting
const SORT_RAW = 0;
const SORT_INC = 1;
const SORT_DEC = 2;

function cutBox(box, didx, startRatio, endRatio) {
    var dimSize = box.size().getComponent(didx);
    var dimStart = box.min.getComponent(didx);
    var ret = box.clone();
    var newStart = dimStart + dimSize * startRatio;
    var newEnd = dimStart + dimSize * endRatio;
    ret.min.setComponent(didx, newStart);
    ret.max.setComponent(didx, newEnd);
    return ret;
}

function viewBox2viewport (viewBox) {
    var viewport = [viewbox.min.x, viewbox.min.y, viewbox.size().x, viewbox.size().y];
    return viewport;
}

function viewport2viewbox(viewport) {
    var viewbox = new THREE.Box2(new THREE.Vector2(viewport[0], viewport[1]),
        new THREE.Vector2(viewport[2], viewport[3]));
    return viewbox;
}

function normalizedCoord(box, point) {
    var diff = new THREE.Vector2();
    diff.subVectors(point, box.min);
    var ret = new THREE.Vector2(diff.x / box.size().x,
        diff.y / box.size().y);
    return ret;
}

function absoluteCoord(box, normalizedCoord) {
    var x = normalizedCoord.x * box.size().x;
    var y = normalizedCoord.y * box.size().y;
    var ret = new THREE.Vector2(x, y);
    ret.addVectors(ret, box.min);
    return ret;
}

function computeChartMax(valueMax) {
    var magnitude = Math.floor(Math.log10(valueMax));
    var unit = Math.pow(10, magnitude);
    var coef = Math.ceil(valueMax / unit);
    return coef * unit;
}

function scaleAtPoint(box, point, scale) {
    var newMin = new THREE.Vector2();
    newMin.subVectors(box.min, point);
    newMin.multiplyScalar(scale);
    newMin.addVectors(newMin, point);
    var newMax = new THREE.Vector2();
    newMax.subVectors(box.max, point);
    newMax.multiplyScalar(scale);
    newMax.addVectors(newMax, point);
    return new THREE.Box2(newMin, newMax);
}

function three_makeQuadGeometry (box, zOffset) {
    var geometry = new THREE.Geometry();
    var a = box.min;
    var b = box.max;
    zOffset = (zOffset === undefined)? 0: zOffset;
    geometry.vertices.push(new THREE.Vector3(a.x, a.y, zOffset));
    geometry.vertices.push(new THREE.Vector3(b.x, a.y, zOffset));
    geometry.vertices.push(new THREE.Vector3(b.x, b.y, zOffset));
    geometry.vertices.push(new THREE.Vector3(a.x, b.y, zOffset));

    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.faces.push(new THREE.Face3(0, 2, 3));
    return geometry;
}

function three_makeQuadWireGeometry(box, zOffset) {
    var geometry = new THREE.Geometry();
    var a = box.min;
    var b = box.max;
    zOffset = (zOffset === undefined) ? 0 : zOffset;
    geometry.vertices.push(new THREE.Vector3(a.x, a.y, zOffset));
    geometry.vertices.push(new THREE.Vector3(b.x, a.y, zOffset));
    geometry.vertices.push(new THREE.Vector3(b.x, b.y, zOffset));
    geometry.vertices.push(new THREE.Vector3(a.x, b.y, zOffset));
    geometry.vertices.push(new THREE.Vector3(a.x, a.y, zOffset));
    return geometry;
}

function three_makeQuadBoarderGeometryWidth(box, width, height, zOffset) {
    height = (height === undefined) ? width : height;
    zOffset = (zOffset === undefined) ? 0 : zOffset;
    var geometry = new THREE.Geometry();
    var hw = width / 2;
    var hh = height / 2;
    var a = new THREE.Vector3(box.min.x, box.min.y, zOffset);
    var b = new THREE.Vector3(box.max.x, box.min.y, zOffset);
    var c = new THREE.Vector3(box.max.x, box.max.y, zOffset);
    var d = new THREE.Vector3(box.min.x, box.max.y, zOffset);
    var off0 = new THREE.Vector3(-hw, -hh, 0);
    var off1 = new THREE.Vector3(hw, -hh, 0);
    var off2 = new THREE.Vector3(hw, hh, 0);
    var off3 = new THREE.Vector3(-hw, hh, 0);
    var lines = [[a, b, b, a], [b, b, c, c], [d, c, c, d], [a, a, d, d]];
    var idxOst = 0;
    for (var i = 0; i < lines.length; i++) {
        geometry.vertices.push(lines[i][0].clone().add(off0));
        geometry.vertices.push(lines[i][1].clone().add(off1));
        geometry.vertices.push(lines[i][2].clone().add(off2));
        geometry.vertices.push(lines[i][3].clone().add(off3));
        geometry.faces.push(new THREE.Face3(idxOst, idxOst + 1, idxOst + 2));
        geometry.faces.push(new THREE.Face3(idxOst, idxOst + 2, idxOst + 3));
        idxOst += 4;
    }
    return geometry;
}

function makeIntegerSequence(end, start, inc) {
    var seq = [];
    var s = (start === undefined ? 0 : start);
    var ic = (inc === undefined ? 1 : inc);
    for (var i = s; i <= end; i += ic) {
        seq.push(i);
    }
    return seq;
}

function makeSortOrderFrom(dataArray, compFunc) {
    var orderIdx = makeIntegerSequence(dataArray.length - 1);
    if (compFunc !== undefined) {
        orderIdx.sort(function (idx0, idx1) {
            return compFunc(dataArray[idx0], dataArray[idx1]);
        });
    }

    else {
        orderIdx.sort(function (idx0, idx1) {
            return dataArray[idx0] < dataArray[idx1];
        });
    }
    var sortOrder = [];
    for (var i = 0; i < orderIdx.length; i++) {
        sortOrder.push(orderIdx.indexOf(i));
    }
    //return sortOrder;
    return orderIdx;
}

function makeDataRange(dataArray, valueOf) {
    var valueOfData = function (dataEle) {
        return dataEle;
    }
    if (valueOf !== undefined) {
        valueOfData = valueOf;
    }
    var range = [valueOfData(dataArray[0]), valueOfData(dataArray[0])];
    for (var i = 1; i < dataArray.length; i++) {
        var value = valueOfData(dataArray[i]);
        if (value < range[0]) {
            range[0] = value;
        }
        else if (value > range[1]) {
            range[1] = value;
        }
    }
    return range;
}

function eventCoord(event) {
    var coord = new THREE.Vector2(event.clientX, window.innerHeight - event.clientY);
    return coord;
}

//testDiv.style.display = "none";
function getTextSize(text, font) {
    // if given, use cached canvas for better performance
    // else, create new canvas
    var canvas = getTextSize.canvas || (getTextSize.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    var txtHeight = parseInt(font);
    var size = new THREE.Vector2(metrics.width, txtHeight*1.5);
    return size;
}
function getTextBox(text, font) {
    return new THREE.Box2(new THREE.Vector2(0, 0), getTextSize(text, font));
}

function getProjection(worldCoord, worldMatrix, camera, viewbox) {
    var width = viewbox.size().x, height = viewbox.size().y;
    var widthHalf = width / 2, heightHalf = height / 2;

    /*
    var vector = new THREE.Vector3();
    var projector = new THREE.Projector();
    projector.projectVector(vector.setFromMatrixPosition(worldMatrix), camera);

    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;
    */
    var vector = worldCoord.clone();
    //var vector = new THREE.Vector3(0,0,0);
    vector.project(camera);
    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;
    var pixel = new THREE.Vector2(vector.x+viewbox.min.x, vector.y+viewbox.min.y);
    return pixel;
}

function sortObjectFacesByDepths(obj, matrix) {
    var faceDepths = new Map();
    for (var i = 0; i < obj.geometry.faces.length; i++) {
        var face = obj.geometry.faces[i];
        /*
        var v0 = obj.geometry.vertices[face.a];
        var v1 = obj.geometry.vertices[face.b];
        var v2 = obj.geometry.vertices[face.c];
        var vc = new THREE.Vector3((v0.x + v1.x + v2.x) / 3,
            (v0.y + v1.y + v2.y) / 3, (v0.z + v1.z + v2.z) / 3);
        var vcNds = vc.applyMatrix4(matrix);
        faceDepths.set(face, vcNds.x * vcNds.x + vcNds.y * vcNds.y + vcNds.z * vcNds.z);
        */
        var v0 = obj.geometry.vertices[face.a];
        var v0Proj = v0.clone().applyMatrix4(matrix);
        faceDepths.set(face, v0Proj.z);
    }
    function sortFace(face0, face1) {
        var depth0 = faceDepths.get(face0);
        var depth1 = faceDepths.get(face1);
        return depth0 - depth1;
    }
    obj.geometry.faces.sort(sortFace);
    //obj.geometry.faces.length = Math.round(obj.geometry.faces.length/2);
    obj.geometry.elementsNeedUpdate = true;
    var oldGeometry = obj.geometry;
    obj.geometry = new THREE.Geometry();
    obj.geometry.faces = oldGeometry.faces.slice();
    obj.geometry.vertices = oldGeometry.vertices.slice();
    oldGeometry.dispose();
    console.log("sorted");
    //return;
    obj.geometry.colorsNeedUpdate = true;
    for (var i = 0; i < obj.geometry.faces.length; i++) {
        var face = obj.geometry.faces[i];
        var c = three_colorTable.divergingColor(i / 2 - obj.geometry.faces.length / 2,
            -obj.geometry.faces.length / 2, obj.geometry.faces.length / 2);
        face.color.set(c);
    }
}

function sortObjectsByDepth(objs, matrix) {
    var centroidDepths = new Map();
    for (var i = 0; i < objs.length; i++) {
        var obj = objs[i];
        if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox()
        var center = obj.geometry.boundingBox.center();
        var centerProj = center.clone().applyMatrix4(matrix);
        centroidDepths.set(obj, centerProj.z);
    }
    function sortDepth(obj0, obj1) {
        var depth0 = centroidDepths.get(obj0);
        var depth1 = centroidDepths.get(obj1);
        return depth0 - depth1;
    }
    objs.sort(sortDepth);
}

function findMeshBoundary(vertices, faces) {
    var count = new Map();
    var maxIdx = 0;
    for (var i = 0; i < faces.length; i++) {
        var t0 = faces[i].a;
        var t1 = faces[i].b;
        var t2 = faces[i].c;
        var idxs = [t0, t1, t2];
        idxs.sort();
        var edges = [[idxs[0], idxs[1]], [idxs[1], idxs[2]], [idxs[0], idxs[2]]];
        for (var j = 0; j < 3; j++) {
            var edgeString = edges[j][0] + '_' + edges[j][1];
            if (!count.has(edgeString)) {
                count[edgeString] = 1;
                count.set(edgeString, 1);
            }
            else {
                count.set(edgeString, 2);
            }
        }
    }
    var rst = [];
    count.forEach(function (value, key, map) {
        if (value == 1) {
            var sptStr = key.split('_');
            var edge = [Number(sptStr[0]), Number(sptStr[1])];
            rst.push(edge);
        }
    });
    return rst;
}

function makeBoundaryLineSegmentsGeometry(vertices, faces) {
    var edges = findMeshBoundary(vertices, faces);
    var geometry = new THREE.Geometry();
    for (var i = 0; i < edges.length; i++) {
        geometry.vertices.push(vertices[edges[i][0]].clone());
        geometry.vertices.push(vertices[edges[i][1]].clone());
    }
    return geometry;
}

function clearScene(scene) {
    for (var i = scene.children.length - 1; i >= 0 ; i--) {
        var obj = scene.children[i];
        destoryThreeJsObjectFromScene(scene, obj);
    }
}

function emptyScene(scene) {
    for (var i = scene.children.length - 1; i >= 0 ; i--) {
        var obj = scene.children[i];
        scene.remove(obj);
    }
}

function destoryThreeJsObjectFromScene(scene, obj) {
    /*
    obj.geometry.dispose();
    obj.geometry = null;
    obj.material.dispose();
    obj.material = null;
    scene.remove(obj);
    //obj.dispose();
    obj = null;
    */
    scene.remove(obj);
    disposeHierarchy(obj);
}

// source: http://stackoverflow.com/questions/33152132/three-js-collada-whats-the-proper-way-to-dispose-and-release-memory-garbag
function disposeNode(node) {
    if (node instanceof THREE.Camera) {
        node = undefined;
    }
    else if (node instanceof THREE.Light) {
        node.dispose();
        node = undefined;
    }
    else if (node instanceof THREE.Mesh
        || node instanceof THREE.Line) {
        if (node.geometry) {
            node.geometry.dispose();
            node.geometry = undefined;
        }

        if (node.material) {
            if (node.material instanceof THREE.MeshFaceMaterial) {
                $.each(node.material.materials, function (idx, mtrl) {
                    if (mtrl.map) mtrl.map.dispose();
                    if (mtrl.lightMap) mtrl.lightMap.dispose();
                    if (mtrl.bumpMap) mtrl.bumpMap.dispose();
                    if (mtrl.normalMap) mtrl.normalMap.dispose();
                    if (mtrl.specularMap) mtrl.specularMap.dispose();
                    if (mtrl.envMap) mtrl.envMap.dispose();

                    mtrl.dispose();    // disposes any programs associated with the material
                    mtrl = undefined;
                });
            }
            else {
                if (node.material.map) node.material.map.dispose();
                if (node.material.lightMap) node.material.lightMap.dispose();
                if (node.material.bumpMap) node.material.bumpMap.dispose();
                if (node.material.normalMap) node.material.normalMap.dispose();
                if (node.material.specularMap) node.material.specularMap.dispose();
                if (node.material.envMap) node.material.envMap.dispose();

                node.material.dispose();   // disposes any programs associated with the material
                node.material = undefined;
            }
        }

        node = undefined;
    }
    else if (node instanceof THREE.Object3D) {
        node = undefined;
    }
}   // disposeNode

function disposeHierarchy(node) {
    for (var i = node.children.length - 1; i >= 0; i--) {
        var child = node.children[i];
        disposeHierarchy(child);
        disposeNode(child);
    }
    node.children.length = 0;
    disposeNode(node);
}

var getRoiByName = function (rn) {
    for (var r = globalRois.length-1; r >=0; r--) {
        if (!globalRois[r]) {
            globalRois.splice(r, 1);
        }
    }
    
    for (var r = 0; r < globalRois.length; r++) {
        if (globalRois[r].name == rn || globalRois[r].fullname == rn) {
            return globalRois[r];
        }
    }
    return undefined;
}

// source: http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
function CSVToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}

function ArrayToCohortCompData(table) {
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
    // skip the first column
    for (var i = 4; i < table[roiNameRow].length; i++) {
        var str = table[roiNameRow][i];
        var roi = getRoiByName(str);
        if (roi) {
            rois.push(roi);
            roiCols.push(i);
        }
    }
    if (roiCols.length === 0) {
        alert('Cannot Locate Rois!');
        return;
    }

    // load subject values
    var dxRow = -1;
    for (var i = 0; i < table[0].length; i++) {
        if (table[0][i] == 'Diagnosis') {
            dxRow = i;
            break;
        }
    }
    if (dxRow == -1) {
        alert('Cannot Locate Diagnosis!');
        return;
    }

    var ctrlRows = [];
    var disdRows = [];
    for (var i = 0; i < table.length; i++) {
        if (table[i][dxRow] == 'Control') {
            ctrlRows.push(i);
        }
        else if (table[i][dxRow] == 'SCZ') {
            disdRows.push(i);
        }
    }
    if (ctrlRows.length <= 0 || disdRows.length <= 0) {
        alert('Both Control and Diseased Must Have Subjects!');
        return;
    }

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
        if (table[i][0] == 'pValue') {
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
        if (table[i][0] == 'effectSize') {
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
    cohortCompData.update();
    return cohortCompData;
}

function loadPreviewCVSData(fn) {
    var client = new XMLHttpRequest();
    client.open('GET', fn, true);
    var leafname = fn.split('\\').pop().split('/').pop().split('.').shift();
    client.addEventListener('load', function (event) {
        var response = event.target.response;
        var table = CSVToArray(response);
        var cohortCompData = ArrayToCohortCompData(table);
        cohortCompData.name = leafname;
        var newSubView = roiView.addSubView(cohortCompData.rois);
        newSubView.cohortCompData = cohortCompData;
        newSubView.init();
        newSubView.setStatsIndex(1);
        newSubView.name = leafname;
        roiView.getLegendManager().cohortCompDatasets.push(cohortCompData);
        //newSubView.update();
        roiView.update();
        //inplaceCharts.updateCompDatesets();

    }, false);

    /*
    client.onreadystatechange = function () {
        var table = CSVToArray(client.responseText);
        console.log(table);
    }
    */
    client.send();
}


function getNextCharIndex(line, charList) {
    if (charList.length>0) {
        var decimerIndex = line.length - 1;
        for (var i = 0; i < line.length; i++) {
            var c = line[i];
            for (var j = 0; j < charList.length; j++) {
                var char = charList[j];
                if (c == char) {
                    return i;
                }
            }
        }
    }
    return line.length;
}

function findCorticalMeshName(roiName) {
    roiName.split('\\').pop().split('/').pop().split('.');
    var sptName = roiName.split('_');
    var side = sptName[0];
    var cName = sptName[1];
    var meshName = 'data/pial_DK_trans/' + (side == 'L' ? 'lh' : 'rh') + '.pial.DK.' + cName + '_trans.obj';
    return meshName;

}

function loadRoiSpec(volfn, specfn, callback) {
    function makeRois(vol, roiSpecs) {
        var rois = [];
        roiSpecs.forEach(function (value, key, map) {
            var roi = new three_roi(vol.sizes);
            roi.name = key;
            roi.fullname = value[0];
            //roi.buildFromVolume(vol, value);
            roi.setData(vol, value[1]);
            rois.push(roi);
        });
        return rois;
    }
    var vol = undefined;
    var roiSpecs = undefined;
    var partsLoaded = 0;

    var client = new XMLHttpRequest();
    client.open('GET', volfn, true);
    client.responseType = "arraybuffer";
    // load volume file
    client.addEventListener('load', function (event) {
        var extension = event.target.responseURL.split('.').pop();
        var fileContent = new Uint8Array(event.target.response);
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
        partsLoaded ++;
        if (partsLoaded === 2) {
            var rois = makeRois(vol, roiSpecs);
            callback(rois);
        }
    }, false);
    client.send();
    // load roispecs
    var client2 = new XMLHttpRequest();
    client2.open('GET', specfn, true);
    client2.addEventListener('load', function (event) {
        var lines = event.target.response.split('\n');
        var decimerList = ['\n', '\t', ' '];
        roiSpecs = new Map();
        for (var i = 0; i < lines.length; i++) {
            var labelName = '';
            var labelFullName = '';
            var maskValues = [];
            var remaining = lines[i];
            while (remaining.length !== 0) {
                var decimerIndex = getNextCharIndex(remaining, decimerList);
                if (decimerIndex !== 0) {
                    if (labelName === '') {
                        labelName = remaining.substring(0, decimerIndex);
                        remaining = remaining.substring(decimerIndex + 1);
                    }
                    else if (labelFullName === '') {
                        var fullNameEnd = getNextCharIndex(remaining, [':']);
                        labelFullName = remaining.substring(0, fullNameEnd - 1);
                        remaining = remaining.substring(fullNameEnd + 1);
                    }
                    else {
                        var numStr = remaining.substring(0, decimerIndex);
                        if (parseInt(numStr)) {
                            var maskValue = Number(numStr);
                            maskValues.push(maskValue);
                        }
                        remaining = remaining.substring(decimerIndex + 1);
                    }
                }
                else {
                    remaining = remaining.substring(decimerIndex + 1);
                }
            }
            if (labelName !== '' && maskValues.length !== 0) {
                roiSpecs.set(labelName, [labelFullName, maskValues]);
            }
        }
        partsLoaded++;
        if (partsLoaded === 2) {
            var rois = makeRois(vol, roiSpecs);
            callback(rois);
        }
    }, false);
    client2.send();
}

function loadMeshRoiSpecs(meshSpecsFile, roiSpecFile, callback) {
    var partsLoaded = 0;
    var meshSpecs = new Map();
    var roiSpecs = new Map();

    function makeRois() {
        var rois = [];
        roiSpecs.forEach(function (value, key, map) {
            var roi = new three_roi();
            roi.name = key;
            roi.fullname = value[0];
            var meshIdxs = value[1];
            for (var im = 0; im < meshIdxs.length; im++) {
                var meshIdx = meshIdxs[im];
                var meshFn = meshSpecs.get(meshIdx);
                roi.meshFns.push(meshFn);
            }
            rois.push(roi);
        });
        if (callback) {
            callback(rois);
        }
    }

    // load mesh specs file
    var client = new XMLHttpRequest();
    client.open('GET', meshSpecsFile, true);
    client.addEventListener('load', function (event) {
        var lines = event.target.response.split('\n');
        var decimerList = ['\n', '\t', ' '];
        var firstLine = lines[0].split('\t');
        var meshDir = firstLine[1];
        for (var i = 1; i < lines.length; i++) {
            var meshIndex = -1;
            var fileName = '';
            var remaining = lines[i];
            while (remaining.length !== 0) {
                var decimerIndex = getNextCharIndex(remaining, decimerList);
                if (decimerIndex !== 0) {
                    if (meshIndex === -1) {
                        meshIndex = Number(remaining.substring(0, decimerIndex));
                        remaining = remaining.substring(decimerIndex + 1);
                    }
                    else if (fileName === '') {
                        var fullNameEnd = getNextCharIndex(remaining, [':']);
                        fileName = remaining.substring(0, fullNameEnd - 1);
                        remaining = remaining.substring(fullNameEnd + 1);
                    }
                }
                else {
                    remaining = remaining.substring(decimerIndex + 1);
                }
            }
            if (meshIndex >= 0 && fileName.length !== 0) {
                meshSpecs.set(meshIndex, meshDir+fileName);
            }
        }
        partsLoaded++;
        if (partsLoaded === 2) {
            var rois = makeRois();
            callback(rois);
        }
    }, false);
    client.send();

    // load roi specs file
    var client2 = new XMLHttpRequest();
    client2.open('GET', roiSpecFile, true);
    client2.addEventListener('load', function (event) {
        var lines = event.target.response.split('\n');
        var decimerList = ['\n', '\t', ' '];
        roiSpecs = new Map();
        for (var i = 0; i < lines.length; i++) {
            var labelName = '';
            var labelFullName = '';
            var maskValues = [];
            var remaining = lines[i];
            while (remaining.length !== 0) {
                var decimerIndex = getNextCharIndex(remaining, decimerList);
                if (decimerIndex !== 0) {
                    if (labelName === '') {
                        labelName = remaining.substring(0, decimerIndex);
                        remaining = remaining.substring(decimerIndex + 1);
                    }
                    else if (labelFullName === '') {
                        var fullNameEnd = getNextCharIndex(remaining, [':']);
                        labelFullName = remaining.substring(0, fullNameEnd - 1);
                        remaining = remaining.substring(fullNameEnd + 1);
                    }
                    else {
                        var numStr = remaining.substring(0, decimerIndex);
                        if (parseInt(numStr)) {
                            var maskValue = Number(numStr);
                            maskValues.push(maskValue);
                        }
                        remaining = remaining.substring(decimerIndex + 1);
                    }
                }
                else {
                    remaining = remaining.substring(decimerIndex + 1);
                }
            }
            if (labelName !== '' && maskValues.length !== 0) {
                roiSpecs.set(labelName, [labelFullName, maskValues]);
            }
        }
        partsLoaded++;
        if (partsLoaded === 2) {
            var rois = makeRois();
            callback(rois);
        }
    }, false);
    client2.send();
}

function mergeVols(vols) {
    var size = vols.data.length;
    var rst = new Float32Array(size);
    for (var i = 0; i < vols.length; i++) {
        for (var j = 0; j < size; j++) {
            rst[j] = max(rst[j], vols[i].data[j]);
        }
    }
    rst.sizes = [];
    rst.sizes[0] = vols[0].sizes[0];
    rst.sizes[1] = vols[0].sizes[1];
    rst.sizes[2] = vols[0].sizes[2];
    return rst;
}


function genTextTexture(text, size, boarder, font) {
    // if given, use cached canvas for better performance
    // else, create new canvas
    //var canvas = genTextTexture.canvas || (genTextTexture.canvas = document.createElement("canvas"));
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var textHeight = 20;
    context.textAlign = "left";
    context.textBaseline = "top";
    if (font) {
        context.font = font;
        //var matches = font.match(/(\d+)sl(\d+)/);
        var matches = [parseInt(font)];
        textHeight = Number(matches[0]);
    }
    else {
        context.font = "15px Arial";
    }
    var lines = text.split('\n');
    var width = 0;
    var lineWidths = [];
    for (var i = 0; i < lines.length; i++) {
        var metrics = context.measureText(lines[i]);
        lineWidths.push(metrics.width);
        width = Math.max(metrics.width, width);
    }
    var height = textHeight * lines.length;
    boarder = boarder ? boarder : 0;
    var tw = 2;
    var th = 2;
    while (tw < width + boarder * 2) tw *= 2;
    while (th < height + boarder * 2) th *= 2;
    canvas.width = tw;
    canvas.height = th;
    size.push(width + boarder * 2, height + boarder * 2);
    // !!! context.measureText will eliminate 
    // !!! the attributes previously assigned
    // !!! need to assign agian
    context.textAlign = "left";
    context.textBaseline = "top";
    if (font) {
        context.font = font;
    }
    else {
        context.font = "15px Arial";
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(0,0,0,0.95)"; // black border
    //context.fillRect(0, 0, width + boarder * 2, height + boarder * 2);
    //context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255,255,255,1)"; // white filler
    //context.fillRect(boarder, boarder, width, height);
    context.fillStyle = "rgba(0,0,0,1)"; // text color
    //context.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < lines.length; i++) {
        context.fillText(lines[i], boarder, i * textHeight + boarder);
    }
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;


    var tex_u = size[0] / tw;
    var tex_v = size[1] / th;
    size.push(tex_u, tex_v);

    return texture;
}

function genTextQuad(text, boarder, font, pixelSize, alignHorizontal, alignVertical, rotation) {
    // if given, use cached canvas for better performance
    // else, create new canvas
    //var canvas = genTextTexture.canvas || (genTextTexture.canvas = document.createElement("canvas"));
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var textHeight = 20;
    rotation = rotation ? rotation : 0;
    if (font) {
        context.font = font;
        //var matches = font.match(/(\d+)sl(\d+)/);
        var matches = [parseInt(font)];
        textHeight = Number(matches[0]);
    }
    else {
        context.font = "Bold 20px Arial";
    }
    var lines = text.split('\n');
    var width = 0;
    var lineWidths = [];
    for (var i = 0; i < lines.length; i++) {
        var metrics = context.measureText(lines[i]);
        lineWidths.push(metrics.width);
        width = Math.max(metrics.width, width);
    }
    var height = textHeight * lines.length;
    boarder = boarder ? boarder : 0;
    var tw = 2;
    var th = 2;
    while (tw < width + boarder * 2) tw *= 2;
    while (th < height + boarder * 2) th *= 2;
    canvas.width = tw;
    canvas.height = th;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(0,0,0,1)"; // text color
    context.font = font ? font : "Bold 20px Arial";
    //context.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < lines.length; i++) {
        context.fillText(lines[i], boarder, i * textHeight + boarder);
    }
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    var size = [width + boarder * 2, height + boarder * 2];
    var tex_u = size[0]/tw;
    var tex_v = size[1] / th;
    pixelSize = pixelSize ? pixelSize : [1, 1];
    //size[0] *= pixelSize[0];
    //size[1] *= pixelSize[1];

    var vScale = new THREE.Vector3(pixelSize[0], pixelSize[1], 1);
    //var v0 = new THREE.Vector3(-size[0] / 2, -size[1] / 2, 0).multiply(vScale);
    var v0 = new THREE.Vector3(0, 0, 0);
    var v1 = new THREE.Vector3(v0.x + size[0] * Math.cos(rotation), v0.y + size[0] * Math.sin(rotation));
    var v2 = new THREE.Vector3(v1.x - size[1] * Math.sin(rotation), v1.y + size[1] * Math.cos(rotation));
    var v3 = new THREE.Vector3(v0.x - size[1] * Math.sin(rotation), v0.y + size[1] * Math.cos(rotation));
    v0.multiply(vScale);
    v1.multiply(vScale);
    v2.multiply(vScale);
    v3.multiply(vScale);
    var minX = Math.min(v0.x, v1.x, v2.x, v3.x);
    var maxX = Math.max(v0.x, v1.x, v2.x, v3.x);
    var minY = Math.min(v0.y, v1.y, v2.y, v3.y);
    var maxY = Math.max(v0.y, v1.y, v2.y, v3.y);

    //var v1 = new THREE.Vector3(size[0], 0, 0);
    //var v2 = new THREE.Vector3(size[0], size[1], 0);
    //var v3 = new THREE.Vector3(0, size[1], 0);
    //var axis = new THREE.Vector3(0, 0, 1);
    //v1.applyAxisAngle(axis, rotation).add(v0);
    //v2.applyAxisAngle(axis, rotation).add(v0);
    //v3.applyAxisAngle(axis, rotation).add(v0);

    var quad_geo = new THREE.PlaneGeometry(1, 1);
    quad_geo.vertices[0] = v3;
    quad_geo.vertices[1] = v2;
    quad_geo.vertices[2] = v0;
    quad_geo.vertices[3] = v1;
    quad_geo.faceVertexUvs[0][0][0].set(0, 1);
    quad_geo.faceVertexUvs[0][0][1].set(0, 1 - tex_v);
    quad_geo.faceVertexUvs[0][0][2].set(tex_u, 1);
    quad_geo.faceVertexUvs[0][1][0].set(0, 1 - tex_v);
    quad_geo.faceVertexUvs[0][1][1].set(tex_u, 1 - tex_v);
    quad_geo.faceVertexUvs[0][1][2].set(tex_u, 1);
    quad_geo.uvsNeedUpdate = true;
    var alignTranslation = new THREE.Vector3(0, 0, 0.99);
    if (alignHorizontal == 'left') {
        alignTranslation.x = -minX;
    }
    else if (alignHorizontal == 'right') {
        alignTranslation.x = -maxX;
    }
    else {
        alignTranslation.x = -(maxX+minX)/2;
    }
    if (alignVertical == 'bottom') {
        alignTranslation.y = -minY;
    }
    else if (alignVertical == 'top') {
        alignTranslation.y = -maxY;
    }
    else {
        alignTranslation.y = -(maxY+minY)/2;
    }
    quad_geo.translate(alignTranslation.x, alignTranslation.y, alignTranslation.z);
    var quad_mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        color: 0xffffff,
        //color: 0x000000,
    });
    var mesh = new THREE.Mesh(quad_geo, quad_mat);
    return mesh;
}
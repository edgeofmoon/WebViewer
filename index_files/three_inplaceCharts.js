
var three_inplaceCharts = function () {
    this.viewbox = new THREE.Box2(new THREE.Vector2(0, 0),
     new THREE.Vector2(window.innerWidth, window.innerHeight));
    this.cohortCompDatasets = [];
    this.roiInfos = new Map;

    this.blockUnit = 1;
    this.blockSize = 0.05;
    this.barHeightMax = 0.15;
    this.lensPanelDistance = [0.8, 0.8];
    this.lensPanelBoarder = [0.05, 0];
    this.barInterval = [0.02, 0.045];

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 20000);


    this.roiStatsInfos = new Map();
    this.roiLayoutInfos = new Map();
    this.roiRenderables = new Map();

    this.statsIndex = 1;
    this.statsName = "Effect size";
    this.statsRange = [0, 1];

    this.enabled = true;

    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
        this.blockSize = 25 / (this.viewbox.size().x*this.lensPanelDistance[0]);
    }
    this.updateCompDatesets = function () {
        for (var ir = 0; ir < roiView.subViews.length; ir++) {
            var compData = roiView.subViews[ir].cohortCompData;
            if (this.cohortCompDatasets.indexOf(compData) < 0) {
                this.cohortCompDatasets.push(compData);
            }
        }
    }
    this.updateRoiStatsInfos = function () {
        this.roiStatsInfos.clear();
        this.statsRange = roiView.getLegendManager().legendRanges.get(this.statsName);
        for (var ic = 0; ic < this.cohortCompDatasets.length; ic++) {
            var compData = this.cohortCompDatasets[ic];
            //this.statsRange = compData.computeStatsRange(this.statsIndex);
            var rois = compData.rois;
            for (var ir = 0; ir < rois.length; ir++) {
                var roi = rois[ir];
                var stats = compData.cohortRoiCompStats[ir].getStats(this.statsIndex);
                var roiColor = this.statsToColor(stats);
                // tmp
                if (spatialView.getRoiMesh(roi) == undefined) {
                    spatialView.addRoi(roi, roiColor);
                    continue;
                }
                if (this.roiStatsInfos.has(roi)) {
                    this.roiStatsInfos.get(roi).push([ic, stats]);
                }
                else {
                    this.roiStatsInfos.set(roi, [[ic, stats]]);
                }
            }
        }

    }
    this.computeViewSize = function (roi) {
        // fixed for now
        var aspect = this.viewbox.size().x / this.viewbox.size().y;
        //var width = this.roiStatsInfos.get(roi).length * this.blockSize;
        var width = this.cohortCompDatasets.length * this.blockSize;
        var height = this.barHeightMax;
        return [width, height];

    }
    this.updateRoiLayoutInfos = function () {
        var viewbox = this.viewbox;
        this.roiLayoutInfos.clear();
        // phase 1: compute shifted angle
        // shifted angle starts with -45 degree
        // output: roi angles
        var roiShiftedAngles = [];
        var scope = this;
        var roiMesh = spatialView.roiMesh;
        var camera = spatialView.camera;
        function shiftAngle(angle) {
            var shiftedAngle;
            if (angle >= -Math.PI / 4) shiftedAngle = angle + Math.PI / 4;
            else {
                shiftedAngle = angle + 2 * Math.PI + Math.PI / 4;
            }
            return shiftedAngle;
        }
        this.roiStatsInfos.forEach(function (value, key, map) {
            var roi = key;
            var object = roiMesh.get(roi);
            var shiftedAngle = 0;
            var ndcCenter = new THREE.Vector3(0, 0, 0);
            if (object) {
                var geometry = object.geometry;
                var geoAnchorFaceIndex = Math.floor(geometry.faces.length / 2);
                var geoAnchorVertexIndex = geometry.faces[geoAnchorFaceIndex].a;
                var geoAnchor = geometry.vertices[geoAnchorVertexIndex].clone();
                geoAnchor.applyMatrix4(object.matrixWorld);
                //if (geometry.boundingBox == undefined) {
                //    geometry.computeBoundingBox();
                //}
                //var geoAnchor = geometry.boundingBox.center();
                ndcCenter = geoAnchor.clone().project(camera);
                var angle = Math.atan2(ndcCenter.y, ndcCenter.x);
                shiftedAngle = shiftAngle(angle);
            }
            roiShiftedAngles.push([roi, shiftedAngle]);
            scope.roiLayoutInfos.set(roi, [ndcCenter]);
        })

        // phase 2: sort
        function sortAngle(obj0, obj1) {
            if (obj0[1] < obj1[1]) return -1;
            if (obj0[1] > obj1[1]) return 1;
            return 0;
        }
        roiShiftedAngles.sort(sortAngle);

        // phase 3: assign zone
        function shiftedAngleToZone(shiftedAngle){
            return Math.floor(shiftedAngle/(Math.PI/2));
        }
        var zoneRois = [[],[],[],[]];
        for (var ir = 0; ir < roiShiftedAngles.length; ir++) {
            var roi = roiShiftedAngles[ir][0];
            var shiftedAngle = roiShiftedAngles[ir][1];
            var zone = shiftedAngleToZone(shiftedAngle);
            if (zone > 3) zone = 3;
            if (zone < 0) zone = 0;
            zoneRois[zone].push(roi);
        }

        // phase 4: layout within zone
        // reverse some zones
        zoneRois[0].reverse();
        zoneRois[1].reverse();
        var zoneLensStartNlc = [[1,1],[-1,1],[-1,1],[-1,-1]];
        var zoneOffsetNlc = [[0, -1], [1, 0], [0, -1], [1, 0]];
        var zoneAnchorToBottomLeft = [[0, -1], [0, 0], [-1, -1], [0, -1]];
        var zoneLabelTilt = [0, -Math.PI / 8, 0, -Math.PI / 8];
        for (var iz = 0; iz < 4; iz++) {
            var rois = zoneRois[iz];
            var zoneOffset = [zoneLensStartNlc[iz][0] * this.lensPanelDistance[0]
                + Math.abs(zoneOffsetNlc[iz][0]) * this.lensPanelBoarder[0],
                zoneLensStartNlc[iz][1] * this.lensPanelDistance[1]
                + Math.abs(zoneOffsetNlc[iz][1]) * this.lensPanelBoarder[1]];
            for (ir = 0; ir < rois.length; ir++) {
                var roi = rois[ir];
                var geoAnchor = this.roiLayoutInfos.get(roi)[0];
                var size = this.computeViewSize(roi);
                var lensAnchor = zoneOffset.slice();
                var lensBottomLeft = [lensAnchor[0] + zoneAnchorToBottomLeft[iz][0] * size[0],
                    lensAnchor[1] + zoneAnchorToBottomLeft[iz][1] * size[1]];
                var lensTopRight = [lensBottomLeft[0] + size[0], lensBottomLeft[1] + size[1]];
                var roiBox = new THREE.Box3(new THREE.Vector3(lensBottomLeft[0], lensBottomLeft[1], geoAnchor[2]),
                    new THREE.Vector3(lensTopRight[0], lensTopRight[1], 0.9));
                zoneOffset[0] += zoneOffsetNlc[iz][0] * (size[0] + this.barInterval[0]);
                zoneOffset[1] += zoneOffsetNlc[iz][1] * (size[1] + this.barInterval[1]);

                this.roiLayoutInfos.get(roi).push(new THREE.Vector3(lensAnchor[0], lensAnchor[1], geoAnchor.z));
                this.roiLayoutInfos.get(roi).push(roiBox);
                this.roiLayoutInfos.get(roi).push(zoneLabelTilt[iz]);
            }
        }
    }
    this.statsToColor = function (stats) {
        var color = three_colorTable.divergingColor(stats, this.statsRange[0],
            this.statsRange[1]);
        return color;
    }
    this.statsToHeight = function (stats) {
        var norHeight = three_legendManager.nomalizeValueInRange(stats, this.statsRange, "linear");
        var height = norHeight * this.barHeightMax;
        return height;
    }
    this.updateBarMesh = function (roi, dataIndex, dataStats, oldMesh) {
        var mesh = oldMesh;
        var width = this.blockSize;
        var height = this.statsToHeight(dataStats);
        var x0 = dataIndex * width;
        var y0 = 0;
        if (oldMesh == undefined) {
            var geometry = new THREE.Geometry();
            geometry.vertices.length = 4;
            geometry.vertices[0] = new THREE.Vector3(0, 0, 0);
            geometry.vertices[1] = new THREE.Vector3(width, 0, 0);
            geometry.vertices[2] = new THREE.Vector3(width, height, 0);
            geometry.vertices[3] = new THREE.Vector3(0, height, 0);
            geometry.faces.push(new THREE.Face3(0, 1, 2),
                new THREE.Face3(0, 2, 3));
            var material = new THREE.MeshBasicMaterial({
                color: 0xff0000
            });
            mesh = new THREE.Mesh(geometry, material);
        }
        var geometry = mesh.geometry;
        geometry.vertices[0].set(0, 0, 0);
        geometry.vertices[1].set(width, 0, 0);
        geometry.vertices[2].set(width, height, 0);
        geometry.vertices[3].set(0, height, 0);
        mesh.position.set(x0, y0, 0);
        mesh.material.color = this.statsToColor(dataStats);
        return mesh;
    }
    this.updateRoiRenderables = function () {
        emptyScene(this.scene);
        scope = this;
        // offset bar index by 4:
        // label, lines, sphere, bounding box, 
        var barInRenderGroupOffset = 4;
        //this.roiRenderables = new Map();
        this.roiLayoutInfos.forEach(function(value, key, map){
            var roi = key;
            var geoAnchor = value[0];
            var viewAnchor = value[1];
            var roiBox = value[2];
            var labelTilt = value[3];
            var roiStatsInfos = scope.roiStatsInfos.get(roi);
            // renderables
            var renderableGroup;
            var roiViewBoxMesh;
            var textMesh;
            var lineMesh;
            var sphereMesh;
            var viewBoxGeometry;
            if (scope.roiRenderables.has(roi)) {
                renderableGroup = scope.roiRenderables.get(roi);
                textMesh = renderableGroup.children[0];
                lineMesh = renderableGroup.children[1];
                sphereMesh = renderableGroup.children[2];
                roiViewBoxMesh = renderableGroup.children[3];
                viewBoxGeometry = roiViewBoxMesh.geometry;
            }
            else {
                renderableGroup = new THREE.Object3D();
                // label
                var pixelSize = [2 / scope.viewbox.size().x, 2 / scope.viewbox.size().y];
                textMesh = genTextQuad(roi.name, 0, "12px Arial", pixelSize, 'left', 'top', labelTilt);
                textMesh.frustumCulled = false;
                textMesh.tilt = labelTilt;
                renderableGroup.add(textMesh);

                // line
                var linegeometry = new THREE.Geometry();
                linegeometry.vertices.push(new THREE.Vector3());
                linegeometry.vertices.push(new THREE.Vector3());
                linegeometry.dynamic = true;
                var linematerial = new THREE.LineBasicMaterial({
                    color: 0x999999
                });
                lineMesh = new THREE.Line(linegeometry, linematerial);
                renderableGroup.add(lineMesh);

                // sphere
                var sphereGeometry = new THREE.SphereGeometry(0.01, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
                var sphereMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff
                });
                sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                var aspect = scope.viewbox.size().x / scope.viewbox.size().y;
                sphereMesh.scale.set(1, aspect, 1);
                renderableGroup.add(sphereMesh);

                // box
                viewBoxGeometry = new THREE.Geometry();
                viewBoxGeometry.vertices.length = 4;
                viewBoxGeometry.vertices[0] = new THREE.Vector3();
                viewBoxGeometry.vertices[1] = new THREE.Vector3();
                viewBoxGeometry.vertices[2] = new THREE.Vector3();
                viewBoxGeometry.vertices[3] = new THREE.Vector3();
                viewBoxGeometry.faces.push(new THREE.Face3(0, 1, 2),
                    new THREE.Face3(0, 2, 3));
                var boxMaterial = new THREE.MeshBasicMaterial({
                    color: 0xbbbbbb
                });
                roiViewBoxMesh = new THREE.Mesh(viewBoxGeometry, boxMaterial);
                renderableGroup.add(roiViewBoxMesh);

                scope.roiRenderables.set(roi, renderableGroup);
            }
            var width = roiBox.size().x;
            var height = scope.barHeightMax;
            var boarder = [scope.blockSize * 0.03, scope.blockSize * 0.1];
            viewBoxGeometry.vertices[0].set(-boarder[0], -boarder[1], 0);
            viewBoxGeometry.vertices[1].set(width + boarder[0], -boarder[1], 0);
            viewBoxGeometry.vertices[2].set(width + boarder[0], height + boarder[1], 0);
            viewBoxGeometry.vertices[3].set(-boarder[0], height + boarder[1], 0);
            viewBoxGeometry.verticesNeedUpdate = true;
            lineMesh.geometry.vertices[0].copy(geoAnchor.clone().sub(roiBox.min));
            lineMesh.geometry.vertices[1].copy(viewAnchor.clone().sub(roiBox.min));
            lineMesh.geometry.verticesNeedUpdate = true;

            sphereMesh.position.copy(geoAnchor.clone().sub(roiBox.min));
            if (labelTilt != textMesh.tilt) {
                textMesh.geometry.dispose();
                //textMesh.material.map.dispose();
                //textMesh.material.dispose();
                
                var pixelSize = [2 / scope.viewbox.size().x, 2 / scope.viewbox.size().y];
                var newTextMesh = genTextQuad(roi.name, 0, "12px Arial", pixelSize, 'left', 'top', labelTilt);
                textMesh.geometry = newTextMesh.geometry;
                textMesh.tilt = labelTilt;
                newTextMesh.material.map.dispose();
                newTextMesh.material.dispose();
                //textMesh.material = newTextMesh.material;
            }
            renderableGroup.position.copy(roiBox.min);

            // now update each bar
            for (var ic = 0; ic < roiStatsInfos.length; ic++) {
                var roiStatsInfo = roiStatsInfos[ic];
                var dataIndex = roiStatsInfo[0];
                var dataStats = roiStatsInfo[1];
                if (renderableGroup.children.length > ic + barInRenderGroupOffset) {
                    scope.updateBarMesh(roi, dataIndex, dataStats, renderableGroup.children[ic + barInRenderGroupOffset]);
                }
                else {
                    var barMesh = scope.updateBarMesh(roi, dataIndex, dataStats);
                    renderableGroup.add(barMesh);
                }
            }
            // get rid of additional bars
            for (var ic = roiStatsInfos.length + barInRenderGroupOffset; ic < renderableGroup.children.length; ic++) {
                renderableGroup.children[ic].geometry.dispose();
                renderableGroup.children[ic].material.dispose();
                if (renderableGroup.children[ic].material.map) {
                    renderableGroup.children[ic].material.map.dispose();
                }
            }
            renderableGroup.children.length = roiStatsInfos.length + barInRenderGroupOffset;


            scope.scene.add(renderableGroup);


        });
    }
    this.update = function () {
        this.updateRoiStatsInfos();
        this.updateRoiLayoutInfos();
        this.updateRoiRenderables();
    }
    this.updatRoiMeshColor = function (cIdx) {
        cIdx = cIdx ? cIdx : 0;
        if (cIdx >= this.cohortCompDatasets.length) return;
        var cohortCompData = this.cohortCompDatasets[cIdx];
        var rois = cohortCompData.rois;
        for (var ir = 0; ir < rois.length; ir++) {
            var roi = rois[ir];
            var stats = cohortCompData.cohortRoiCompStats[ir].getStats(this.statsIndex);
            var color = this.statsToColor(stats);
            var mesh = spatialView.getRoiMesh(roi);
            if (mesh) {
                mesh.material.effectColor = color.clone();
                mesh.material.color = color.clone();
            }
        }
    }
    this.render = function () {
        if (!this.enabled) return;
        this.update();
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.render(this.scene, this.camera);
    }
    this.getDataByCoord = function (coord) {
        var norCoord = normalizedCoord(this.viewbox, coord);
        var scope = this;
        var rst;
        this.roiLayoutInfos.forEach(function (value, key, map) {
            var roi = key;
            var roiBox = value[2];
            var norCoord3D = new THREE.Vector3(norCoord.x * 2 - 1, norCoord.y * 2 - 1, roiBox.min.z);
            if (roiBox.containsPoint(norCoord3D)) {
                var idx = Math.floor((norCoord3D.x - roiBox.min.x) / scope.blockSize);
                rst = [idx, roi];
            }
        });
        return rst;
    }

    var scope = this;
    function onMouseMove(event) {
        var coord = eventCoord(event);
        if (!scope.viewbox.containsPoint(coord)) {
            return;
        }
        var data = scope.getDataByCoord(coord);
        if (data) {
            var roi = data[1];
            var compData = scope.cohortCompDatasets[data[0]];
            var idx = compData.rois.indexOf(roi);
            var effectSize = compData.cohortRoiCompStats[idx].effectSize;
            var pValue = compData.cohortRoiCompStats[idx].pValue;
            scope.updatRoiMeshColor(data[0]);
            tooltip.setPosition(coord);
            tooltip.setText(roi.fullname +
                "\nDataset: "+compData.name +
                "\nEffect size: " + effectSize +
                "\np value: " + pValue +
                "\nClick to remove.");
        }
    }

    function onMouseWheel(event) {
        var coord = eventCoord(event);
        if (!scope.viewbox.containsPoint(coord)) {
            return;
        }
    }

    function onMouseDown(event) {
        var coord = eventCoord(event);
        if (!scope.viewbox.containsPoint(coord)) {
            return;
        }
        var data = scope.getDataByCoord(coord);
        if (data) {
            /*
            var cohortCompData = scope.cohortCompDatasets[data[0]];
            var newSubView = roiView.addSubView(cohortCompData.rois);
            newSubView.cohortCompData = cohortCompData;
            newSubView.init();
            newSubView.setStatsIndex(1);
            newSubView.name = cohortCompData.name;
            roiView.update();
            statsStackerView.cohortCompDatasets.push(cohortCompData);
            statsStackerView.update();
            */
            scope.cohortCompDatasets.splice(data[0], 1);
            scope.updatRoiMeshColor();
        }
    }

    function onMouseUp(event) {
    }

    this.disable = function () {
        this.enabled = false;
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mousedown', onMouseDown, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener('mousewheel', onMouseWheel, false);
    }

    this.enable = function () {
        this.enabled = true;
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mousewheel', onMouseWheel, false);
    };
    this.enable();
}
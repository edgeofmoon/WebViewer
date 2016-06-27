
var three_statsRiver = function () {

    this.cohortCompDatasets = [];
    this.viewbox = new THREE.Box2();
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-0.02, 1.02, 1.02, -0.02, -100, 20000);
    // sub-scene
    var subScene = new THREE.Scene();
    //var subCamera = new THREE.OrthographicCamera(0.006, 0.994, 1.02, -0.02, -100, 20000);
    var subCamera = new THREE.OrthographicCamera(0, 1, 1.02, -0.02, -100, 20000);

    // axes
    var quadAxis = new three_axisTicks();
    var barAxis = new three_axisTicks();

    // ui
    var uiPanel = undefined;

    // cohortUi
    var cohortUiPanel = undefined;

    // drag scene event
    var sceneDrag_onDrag = false;
    var sceneDrag_startPixel = new THREE.Vector2();
    var sceneDrag_currentPixel = new THREE.Vector2();
    var sceneDrag_accOffset = new THREE.Vector2(0, 0);
    var sceneDrag_curOffset = new THREE.Vector2(0, 0);
    var sceneScale = [1, 1];

    this.roiInfos = new Map();
    this.statsRenderables = new Map();
    this.textMeshes = [];
    this.statsIndex = 1;

    // draw parameters
    this.barWidth = 0.05;
    this.blockInterval = 0.000;
    this.barInterval = 0.000;
    this.barHideWidth = 0.005;
    this.barYOffset = 0.2;
    this.barHeight = 0.6;
    this.unitHeight = 0.1;

    this.statsIndex = 1;
    this.statsName = "Effect size";
    this.statsRange = [0, 1];

    this.updateRoiInfos = function () {
        this.roiInfos.clear();
        for (var i = 0; i < this.cohortCompDatasets.length; i++) {
            var cohortCompData = this.cohortCompDatasets[i];
            var rois = cohortCompData.rois;
            for (var ir = 0; ir < rois.length; ir++) {
                var roi = rois[ir];
                var stats = cohortCompData.cohortRoiCompStats[ir].getStats(this.statsIndex);
                if (!this.roiInfos.has(roi)) {
                    this.roiInfos.set(roi, []);
                }
                this.roiInfos.get(roi).push([i, stats]);
            }
        }
        this.statsRange = roiView.getLegendManager().legendRanges.get(this.statsName);

    }
    this.isRoiHide = function (roi) {
        return false;
    }
    this.computeStatsHeight = function (statsValue) {
        // tmp sol
        return Math.abs(statsValue) * this.unitHeight;
    }
    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
        barAxis.viewbox = viewbox;
    }
    this.updateScene = function () {
        this.textMeshes.forEach(function (value, key, map) {
            value.material.map.dispose();
        })
        clearScene(scene);
        // sort roiInfos
        var sortIndex = 0;
        var sortedRois = [];
        this.statsRenderables.clear();
        this.roiInfos.forEach(function (value, key, map) {
            var roi = key;
            var infos = value;
            var hasValue = false;
            for (var ii = 0; ii < infos.length; ii++) {
                if (infos[ii][0] == sortIndex) {
                    sortedRois.push([roi, infos[ii][1]]);
                    hasValue = true;
                    break;
                }
            }
            if (!hasValue) {
                sortedRois.push([roi, -99999999.9]);
            }
        });
        function sortRois(roiV0, roiV1) {
            if (roiV0[1] < roiV1[1]) return 1;
            if (roiV0[1] > roiV1[1]) return -1;
            return 0;
        };
        sortedRois.sort(sortRois);
        var tmpRoisInfos = new Map();
        for (var i = 0; i < sortedRois.length; i++) {
            var roi = sortedRois[i][0];
            var info = this.roiInfos.get(roi);
            tmpRoisInfos.set(roi, info.slice());
        }
        this.roiInfos = tmpRoisInfos;

        var scope = this;
        var YBase = this.barYOffset;
        var barWidth = scope.barWidth;
        // draw labels
        this.textMeshes.length = 0;
        for (var ir = 0; ir < sortedRois.length; ir++) {
            var roi = sortedRois[ir][0];
            var pixelSize = [1 / this.viewbox.size().x, 1 / this.viewbox.size().y];
            var textMesh = genTextQuad(roi.name, 0, "12px Arial", pixelSize, 'left', 'top', -3.14 / 4);
            textMesh.geometry.translate(ir * barWidth, YBase, 0);
            textMesh.frustumCulled = false;
            textMesh.name = 'text';
            this.textMeshes.push(textMesh);
            scene.add(textMesh);
        }

        // draw streams
        var dataOrder = [];
        for (var i = 0; i < this.cohortCompDatasets.length; i++) {
            dataOrder.push(i);
        }
        var roiAccHeight = new Map();
        var withinBarOffsets = [0.2, 0.8];
        for (var ic = 0; ic < this.cohortCompDatasets.length; ic++) {
            var ccdsIdx = dataOrder[ic];
            var xOffset = 0;

            // renderables
            var meshGeometry = new THREE.Geometry();
            var lineGeometry = new THREE.Geometry();
            var lastColor;
            for (var ir = 0; ir < sortedRois.length; ir++) {
                var roi = sortedRois[ir][0];
                var value = 0;
                var infos = this.roiInfos.get(roi);
                for (var ii = 0; ii < infos.length; ii++) {
                    var info = infos[ii];
                    var dataIndex = info[0];
                    if (dataIndex == ccdsIdx) {
                        value = info[1];
                        break;
                    }
                }
                var xPos0 = xOffset + barWidth * withinBarOffsets[0];
                var xPos1 = xOffset + barWidth * withinBarOffsets[1];
                var yPos0, yPos1;
                var statsHeight = scope.computeStatsHeight(value);
                var thisColor = three_colorTable.divergingColor(value,
                    scope.statsRange[0], scope.statsRange[1]);
                if(roiAccHeight.has(roi)){
                    yPos0 = roiAccHeight.get(roi);
                }
                else{
                    yPos0 = YBase;
                }
                yPos1 = yPos0 + statsHeight;
                roiAccHeight.set(roi, yPos1);
                xOffset += barWidth;
                var curGeoIdx = meshGeometry.vertices.length;
                meshGeometry.vertices.push(new THREE.Vector3(xPos0, yPos0, 0));
                meshGeometry.vertices.push(new THREE.Vector3(xPos0, yPos1, 0));
                meshGeometry.vertices.push(new THREE.Vector3(xPos1, yPos0, 0));
                meshGeometry.vertices.push(new THREE.Vector3(xPos1, yPos1, 0));
                if (curGeoIdx > 2) {
                    var face0 = new THREE.Face3(curGeoIdx - 2, curGeoIdx, curGeoIdx + 1);
                    face0.vertexColors[0] = lastColor;
                    face0.vertexColors[1] = thisColor;
                    face0.vertexColors[2] = thisColor;
                    var face1 = new THREE.Face3(curGeoIdx - 2, curGeoIdx + 1, curGeoIdx - 1);
                    face1.vertexColors[0] = lastColor;
                    face1.vertexColors[1] = thisColor;
                    face1.vertexColors[2] = lastColor;
                    meshGeometry.faces.push(face0);
                    meshGeometry.faces.push(face1);

                    lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx - 2]);
                    lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx]);
                    lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx - 1]);
                    lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx + 1]);
                }
                var face2 = new THREE.Face3(curGeoIdx, curGeoIdx + 2, curGeoIdx + 3);
                face2.vertexColors[0] = thisColor;
                face2.vertexColors[1] = thisColor;
                face2.vertexColors[2] = thisColor;
                var face3 = new THREE.Face3(curGeoIdx, curGeoIdx + 3, curGeoIdx + 1);
                face3.vertexColors[0] = thisColor;
                face3.vertexColors[1] = thisColor;
                face3.vertexColors[2] = thisColor;
                meshGeometry.faces.push(face2);
                meshGeometry.faces.push(face3);

                lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx]);
                lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx + 2]);
                lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx + 1]);
                lineGeometry.vertices.push(meshGeometry.vertices[curGeoIdx + 3]);

                lastColor = thisColor;
            }
            var vertexColorMaterial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
            var ccdsMesh = new THREE.Mesh(meshGeometry, vertexColorMaterial);

            var lineMaterial = new THREE.LineBasicMaterial({
                color: 0xff0000
            });
            var lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);

            var roiObject = new THREE.Object3D();
            roiObject.add(ccdsMesh);
            roiObject.add(lineSegments);

            this.statsRenderables.set(ic, roiObject);
            scene.add(roiObject);
            //break;
        }
    }
    this.computeStackValueRange = function () {
        var stackValueRange = undefined;
        this.roiInfos.forEach(function (value, key, map) {
            var roi = key;
            var infos = value;
            var stackValue = 0;
            for (var i = 0; i < infos.length; i++) {
                var info = infos[i];
                var dataIndex = info[0];
                var statsValue = info[1];
                if (statsValue) {
                    stackValue += statsValue;
                }
            }
            if (stackValueRange == undefined) {
                stackValueRange = [stackValue, stackValue];
            }
            else {
                stackValueRange[0] = Math.min(stackValueRange[0], stackValue);
                stackValueRange[1] = Math.max(stackValueRange[1], stackValue);
            }
        });
        return stackValueRange;
    }
    this.updateBarAxis = function () {
        barAxis.viewbox = this.viewbox;
        barAxis.low = this.barYOffset;
        barAxis.high = this.barYOffset + this.barHeight;
        var range = this.computeStackValueRange();
        axisMax = computeChartMax(range[1]);
        this.unitHeight = this.barHeight / axisMax;
        barAxis.valueRange = [0, axisMax];
        barAxis.update();
    }
    this.update = function () {
        this.updateRoiInfos();
        // axis first to update mapping unit
        this.updateBarAxis();
        this.updateScene();
    }
    this.render = function () {
        var theViewBox = this.viewbox;
        renderer.setViewport(theViewBox.min.x, theViewBox.min.y, theViewBox.size().x, theViewBox.size().y);
        renderer.setScissor(theViewBox.min.x, theViewBox.min.y, theViewBox.size().x, theViewBox.size().y);
        //renderer.clear();
        barAxis.render();
        var subViewbox = cutBox(theViewBox, 0, 1 - 1 / 1.02, 1 / 1.02);
        renderer.setViewport(subViewbox.min.x, subViewbox.min.y, subViewbox.size().x, subViewbox.size().y);
        renderer.setScissor(subViewbox.min.x, subViewbox.min.y, subViewbox.size().x, subViewbox.size().y);
        renderer.render(scene, camera);
    }
    this.setCameraOffset = function (offset) {
        this.statsRenderables.forEach(function (value, key, map) {
            value.position.x = offset.x;
            value.position.y = offset.y;
        })
        this.textMeshes.forEach(function (value, key, map) {
            value.position.x = offset.x;
            value.position.y = offset.y;
        })
    }
    this.setCameraScale = function (scale) {
        this.statsRenderables.forEach(function (value, key, map) {
            value.scale.x = scale[0];
            value.scale.y = scale[1];
        })
        this.textMeshes.forEach(function (value, key, map) {
            value.scale.x = scale[0];
            value.scale.y = scale[1];
        })
    }
    this.getRoiByCoord = function (roi) {
    }
    var scope = this;
    function onMouseMove(event) {

        if (sceneDrag_onDrag) {
            sceneDrag_currentPixel = eventCoord(event);
            sceneDrag_curOffset.subVectors(sceneDrag_currentPixel, sceneDrag_startPixel);
            sceneDrag_curOffset.x /= scope.viewbox.size().x;
            // offset.y /= this.viewbox.size().y;
            sceneDrag_curOffset.y = 0;
            var offset = new THREE.Vector2();
            offset.addVectors(sceneDrag_curOffset, sceneDrag_accOffset);
            scope.setCameraOffset(offset);
        }
    }

    function onMouseWheel(event) {

        var coord = eventCoord(event);
        if (!scope.viewbox.containsPoint(coord)) {
            return;
        }
        if (event.wheelDelta) {
            if (event.wheelDelta > 0) {
                sceneScale[0] *= 1.05;
                scope.setCameraScale(sceneScale);
            }
            else {
                sceneScale[0] /= 1.05;
            }
            scope.setCameraScale(sceneScale);
        }
    }

    function onMouseDown(event) {
        var coord = eventCoord(event);
        if (!scope.viewbox.containsPoint(coord)) {
            return;
        }
        else {
            sceneDrag_onDrag = true;
            sceneDrag_startPixel = coord;
            sceneDrag_currentPixel = coord;
        }
    }

    function onMouseUp(event) {
        if (sceneDrag_onDrag) {
            sceneDrag_onDrag = false;
            sceneDrag_accOffset.addVectors(sceneDrag_curOffset, sceneDrag_accOffset);
            sceneDrag_curOffset.set(0, 0);
        }
    }

    this.disable = function () {
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mousedown', onMouseDown, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener('mousewheel', onMouseWheel, false);
    }

    this.enable = function () {
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mousewheel', onMouseWheel, false);
    };
    this.enable();
}
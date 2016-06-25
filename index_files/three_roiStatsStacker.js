
var three_roiStatsStacker = function () {

    this.cohortCompDataSets = [];
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
    var sceneScale = [1.1, 1];

    this.roiInfos = new Map();
    this.roiRenderables = new Map();
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
        for (var i = 0; i < this.cohortCompDataSets.length; i++) {
            var cohortCompData = this.cohortCompDataSets[i];
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
    this.computeStatsHeight = function(statsValue){
        // tmp sol
        return Math.abs(statsValue) * this.unitHeight;
    }
    this.setViewbox = function(viewbox){
        this.viewbox = viewbox;
        barAxis.viewbox = viewbox;
    }
    this.updateScene = function () {
        clearScene(scene);
        // sort roiInfos
        var sortIndex = 0;
        var sortedRois = [];
        this.roiInfos.forEach(function (value, key, map) {
            var roi = key;
            var infos = value;
            var hasValue = false;
            for(var ii =0;ii<infos.length;ii++){
                if(infos[ii][0]==sortIndex){
                    sortedRois.push([roi, infos[ii][1]]);
                    hasValue = true;
                    break;
                }
            }
            if (!hasValue) {
                sortedRois.push([roi, -99999999.9]);
            }
        });
        function sortRois(roiV0, roiV1){
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


        var YBase = this.barYOffset;
        var xOffset = 0;
        var scope = this;
        this.roiInfos.forEach(function (value, key, map) {
            var roi = key;
            var infos = value;
            var yOffset = YBase;
            var roiObject = new THREE.Object3D();
            var barWidth = scope.isRoiHide(roi) ? scope.barHideWidth : scope.barWidth;
            for (var i = 0; i < infos.length; i++) {
                var info = infos[i];
                var dataIndex = info[0];
                var statsValue = info[1];
                if (statsValue) {
                    var statsHeight = scope.computeStatsHeight(statsValue);
                    //var dataColor = three_colorTable.categoricalColor(dataIndex);
                    var dataColor = three_colorTable.divergingColor(statsValue,
                        scope.statsRange[0], scope.statsRange[1]);
                    var blockGeometry = new THREE.PlaneGeometry(barWidth, statsHeight);
                    blockGeometry.translate(barWidth / 2 + xOffset, statsHeight / 2 + yOffset, 0);
                    var blockMaterial = new THREE.MeshBasicMaterial({
                        color: dataColor.getHex()
                    });
                    var blockMesh = new THREE.Mesh(blockGeometry, blockMaterial);
                    roiObject.add(blockMesh);
                    yOffset += statsHeight + scope.blockInterval;
                }
            }

            var pixelSize = [1.02 / scope.viewbox.size().x, 1.02 / scope.viewbox.size().y];
            var textMesh = genTextQuad(roi.name, 0, "12px Arial", pixelSize, 'left', 'top', -3.14 / 4);
            textMesh.translateX(xOffset);
            textMesh.translateY(YBase);
            textMesh.frustumCulled = false;

            roiObject.add(textMesh);

            scope.roiRenderables.set(roi, roiObject);
            scene.add(roiObject);
            xOffset += barWidth + scope.barInterval;
        });
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
        barAxis.high = this.barYOffset+this.barHeight;
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
        this.roiRenderables.forEach(function (value, key, map) {
            value.position.x = offset.x;
            value.position.y = offset.y;
        })
    }
    this.setCameraScale = function (scale) {
        this.roiRenderables.forEach(function (value, key, map) {
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
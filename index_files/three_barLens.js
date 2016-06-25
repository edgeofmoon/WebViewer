
var three_barLens = function () {
    this.viewbox = new THREE.Box2(new THREE.Vector2(0, 0),
        new THREE.Vector2(window.innerWidth, window.innerHeight));
    this.cohortCompData = new three_cohortCompData();
    this.roiInfos = new Map;

    this.lensDistance = 0.8;
    this.blockUnit = 1;
    this.blockSize = 0.05;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 20000);

    this.renderables = new Map();

    this.getRoiMesh = function (roiName) {
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj.roiName !== roiName) {
                return obj;
            }
        }
    }

    this.getRoiStats = function (roiName) {
        for (var i = this.cohortCompData.cohortRoiCompStats.length - 1; i >= 0 ; i--) {
            if (this.cohortCompData.rois[i].name == roiName) {
                var compStats = this.cohortCompData.cohortRoiCompStats[i];
                return compStats.effectSize;
            }
        }
    }

    this.updateRoiInfos = function () {
        this.roiInfos.clear();
        var bCenter = new THREE.Vector3(0, 0, 0);
        bCenter.project(spatialView.camera);

        // up, bottom, left, right
        var chartMaps = [[], [], [], []];
        for (var i = spatialView.scene.children.length - 1; i >= 0 ; i--) {
            var obj = spatialView.scene.children[i];
            if (obj.roi === undefined) continue;
            if (obj.roi.type === 'cortical') {
                var geometry = obj.geometry;
                var centerX = 0.5 * (geometry.boundingBox.max.x + geometry.boundingBox.min.x);
                var centerY = 0.5 * (geometry.boundingBox.max.y + geometry.boundingBox.min.y);
                var centerZ = 0.5 * (geometry.boundingBox.max.z + geometry.boundingBox.min.z);
                var center = new THREE.Vector3(centerX, centerY, centerZ);

                // project to screen space
                var width = spatialView.viewbox.size().x, height = spatialView.viewbox.size().y;
                var widthHalf = width / 2, heightHalf = height / 2;
                var ndcPos = center.clone();
                ndcPos.project(spatialView.camera); //-1~1
                var angle = Math.atan2(ndcPos.y, ndcPos.x);

                // unproject to 3D space
                var plotNdcPos = new THREE.Vector3();
                plotNdcPos.x = Math.cos(angle) * this.lensDistance;
                plotNdcPos.y = Math.sin(angle) * this.lensDistance;
                if (Math.abs(plotNdcPos.x) > Math.abs(plotNdcPos.y)) {
                    if (plotNdcPos.x < 0) {
                        // left
                        plotNdcPos.x = -this.lensDistance;
                        plotNdcPos.y = -this.lensDistance * Math.tan(angle);
                        // -pi sorting accomandation
                        if (angle < 0) angle += 2 * Math.PI;
                        chartMaps[2].push([angle, obj.roi.name]);
                    }
                    else {
                        // right
                        plotNdcPos.x = this.lensDistance;
                        plotNdcPos.y = this.lensDistance * Math.tan(angle);
                        chartMaps[3].push([angle, obj.roi.name]);
                    }
                }
                else {
                    if (plotNdcPos.y < 0) {
                        // bottom
                        plotNdcPos.y = -0.8;
                        plotNdcPos.x = -0.8 / Math.tan(angle);
                        chartMaps[1].push([angle, obj.roi.name]);
                    }
                    else {
                        // top
                        plotNdcPos.y = 0.8;
                        plotNdcPos.x = 0.8 / Math.tan(angle);
                        chartMaps[0].push([angle, obj.roi.name]);
                    }
                }
                plotNdcPos.z = bCenter.z + (ndcPos.z - bCenter.z) * (ndcPos.x - bCenter.x) / (ndcPos.x - bCenter.x);

                var spatialPos = plotNdcPos.clone();
                spatialPos.unproject(spatialView.camera);

                this.roiInfos.set(obj.roi.name, [this.getRoiStats(obj.roi.name),
                    center, plotNdcPos, spatialPos]);
            }
        }
        // optimize chart locations
        var sortOrder = 1;
        function sortAngle(obj0, obj1) {
            if (obj0[0] < obj1[0]) return -1 * sortOrder;
            if (obj0[0] > obj1[0]) return sortOrder;
            return 0;
        }
        chartMaps[1].sort(sortAngle);
        chartMaps[3].sort(sortAngle);
        sortOrder = -1;
        chartMaps[2].sort(sortAngle);
        chartMaps[0].sort(sortAngle);

        var yOffset = this.blockSize * 5;
        var yStart = -this.lensDistance + yOffset;
        var yEnd = this.lensDistance - yOffset;
        for (var i = 2; i <= 3; i++) {
            var currentYEnd = yStart;
            for (var j = 0; j < chartMaps[i].length; j++) {
                if (currentYEnd < yEnd) {
                    var info = this.roiInfos.get(chartMaps[i][j][1]);
                    var plotNdcPos = info[2];
                    if (plotNdcPos.y < currentYEnd) {
                        plotNdcPos.y = currentYEnd;
                    }
                    else {
                        // discritize position
                        var pIdx = Math.ceil((plotNdcPos.y - yStart) / yOffset);
                        plotNdcPos.y = yStart + pIdx * yOffset;
                    }
                    var spatialPos = plotNdcPos.clone();
                    spatialPos.unproject(spatialView.camera);
                    info[3] = spatialPos;
                    currentYEnd = plotNdcPos.y + yOffset;
                }
                else if (i == 2) {
                    // left overflow push to top front
                    for (var k = chartMaps[i].length - 1; k >= j; k--) {
                        var info = this.roiInfos.get(chartMaps[i][k][1]);
                        info[2].y = this.lensDistance;
                        chartMaps[0].unshift(chartMaps[i][k]);
                    }
                    chartMaps[i].length = j;
                    break;
                }
                else {
                    // right overflow push to top back
                    for (var k = chartMaps[i].length - 1; k >= j; k--) {
                        var info = this.roiInfos.get(chartMaps[i][k][1]);
                        info[2].y = this.lensDistance;
                        chartMaps[0].push(chartMaps[i][k]);
                    }
                    chartMaps[i].length = j;
                    break;
                }
            }
        }

        var xOffset = this.blockSize*1.2;
        var xStart = -this.lensDistance + xOffset;
        var xEnd = this.lensDistance - xOffset;
        for (var i = 0; i <= 1; i++) {
            var currentXEnd = xStart;
            for (var j = 0; j < chartMaps[i].length; j++) {
                if (currentXEnd < xEnd) {
                    var info = this.roiInfos.get(chartMaps[i][j][1]);
                    var plotNdcPos = info[2];
                    if (plotNdcPos.x < currentXEnd) {
                        plotNdcPos.x = currentXEnd;
                    }
                    else {
                        // discritize position
                        var pIdx = Math.ceil((plotNdcPos.x - xStart) / xOffset);
                        plotNdcPos.x = xStart + pIdx * xOffset;
                    }
                    var spatialPos = plotNdcPos.clone();
                    spatialPos.unproject(spatialView.camera);
                    info[3] = spatialPos;
                    currentXEnd = plotNdcPos.x + xOffset;
                }
            }
        }

        // compute block unit size
        var statsRange = this.cohortCompData.computeStatsRange(1);
        var magnitude = Math.floor(Math.log10(statsRange[1] - statsRange[0]));
        this.blockUnit = Math.pow(10, magnitude);
        if ((statsRange[1] - statsRange[0] )/ this.blockUnit > 5) this.blockUnit *= 2;
    }

    this.updateRoiBarCharts = function () {
        emptyScene(this.scene);
        var size = this.blockSize;
        for (var i = spatialView.scene.children.length - 1; i >= 0 ; i--) {
            var obj = spatialView.scene.children[i];
            if (obj.name === 'charLine') {
                spatialView.scene.remove(obj);
            }
        }
        var scope = this;
        var asptRatio = this.viewbox.size().x / this.viewbox.size().y;
        this.roiInfos.forEach(function (value, key, map) {
            if (scope.renderables.has(key)) {
                var renderObj = scope.renderables.get(key);
                renderObj[0].position.set(value[2].x, value[2].y, 1);
                scope.scene.add(renderObj[0]);

                var linegeometry = renderObj[1].geometry;
                linegeometry.vertices[0].set(value[1].x, value[1].y, value[1].z);
                linegeometry.vertices[1].set(value[3].x, value[3].y, value[3].z);
                linegeometry.verticesNeedUpdate = true;
                var linematerial = renderObj[1].material;
                linematerial.color.set(0x999999);
                linematerial.needsUpdate = true;
                if (spatialView.selectedObj) {
                    if (spatialView.selectedObj.roi) {
                        if (key == spatialView.selectedObj.roi.name) {
                            linematerial.color.set(0xff0000);
                            linematerial.needsUpdate = true;
                        }
                    }
                }
                spatialView.scene.add(renderObj[1]);

            }
            else {
                var chartObj = new THREE.Object3D();
                var stats = Math.abs(value[0]);
                var offset = 0;
                while (stats > 0) {
                    var unit = Math.min(stats, scope.blockUnit);
                    var height = unit / scope.blockUnit;
                    var geometry = new THREE.PlaneGeometry(size, size * height * asptRatio)
                        .translate(0, offset + size / 2 * height * asptRatio, 0.9);
                    var material = new THREE.MeshBasicMaterial({
                        color: 0x888888
                    });
                    /*
                    if (value[0] < 0) {
                        material = new THREE.MeshBasicMaterial({
                            color: 0x6666ee
                        });
                    }
                    */
                    var block = new THREE.Mesh(geometry, material);
                    chartObj.add(block);
                    stats -= scope.blockUnit;
                    offset += size * height * asptRatio + size / 20 * asptRatio;
                }

                var pixelSize = [2 / scope.viewbox.size().x, 2 / scope.viewbox.size().y];
                var textMesh = genTextQuad(key, 0, "12px Arial", pixelSize, 'left', 'top', -Math.PI / 4);
                textMesh.translateX(- size / 2);
                textMesh.translateY(- size / 20);
                textMesh.frustumCulled = false;
                chartObj.add(textMesh);
                chartObj.position.set(value[2].x, value[2].y, 1);
                scope.scene.add(chartObj);


                var linematerial = new THREE.LineBasicMaterial({
                    color: 0x999999
                });
                if (spatialView.selectedObj) {
                    if (spatialView.selectedObj.roi) {
                        if (key == spatialView.selectedObj.roi.name) {
                            linematerial.color.set(0xff0000);
                            linematerial.needsUpdate = true;
                        }
                    }
                }
                var linegeometry = new THREE.Geometry();
                linegeometry.vertices.push(value[1]);
                linegeometry.vertices.push(value[3]);
                linegeometry.dynamic = true;
                var line = new THREE.Line(linegeometry, linematerial);
                line.name = 'charLine';
                spatialView.scene.add(line);

                scope.renderables.set(key, [chartObj, line]);
            }

        });
    }

    this.update = function () {
        this.viewbox = spatialView.viewbox;
        this.updateRoiInfos();
        this.updateRoiBarCharts();
    }

    this.render = function () {
        this.update();
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);

        renderer.render(this.scene, this.camera);
    }
}

var three_roiSubView = function (roiView) {
    this.index = -1;
    this.roiView = roiView;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.02, 1.02, 1.02, -0.02, -100, 20000);
    //this.controls = new THREE.OrbitControls(this.camera);
    this.viewbox;// = computeViewbox(roiView.viewbox, roiView.subViews.length+1);
    this.rois = [];
    this.roiCompStatsArray = [];
    this.scene.add(this.camera);
    this.labelDivs = [];

    // drawing parameters
    this.barWidthRatio = 0.8;
    this.barWidthOffsetX = (1 - this.barWidthRatio) / 2;
    this.quadBottom = 0.2;
    this.quadTop = 0.5;
    this.barHeight = 0.3;
    this.maxTScoreAbs = 0;
    this.maxEffectSizeAbs = 0;

    // sorting
    this.sortOrder = [];

    // axis
    this.quadAxis = new three_axisTicks();
    this.barAxis = new three_axisTicks();

    // ui
    this.uiPanel = new three_ui_panel();
    var templateButton = new three_ui_button(this.uiPanel, three_ui_button_defaultSizeBox.clone(),
        three_ui_button_copy_icon, buttonClickHandler, 0);
    var controlButton = new three_ui_button(this.uiPanel, three_ui_button_defaultSizeBox.clone(),
        three_ui_button_ctrl_icon, buttonClickHandler, 1);
    var diseasedButton = new three_ui_button(this.uiPanel, three_ui_button_defaultSizeBox.clone(),
        three_ui_button_disd_icon, buttonClickHandler, 2);
    var deleteButton = new three_ui_button(this.uiPanel, three_ui_button_defaultSizeBox.clone(),
        three_ui_button_delt_icon, buttonClickHandler, 3);

    this.quadMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff
    });
    this.lineMaterial = new THREE.LineBasicMaterial({
        color: 0x000000
    });
    this.curveMaterials = [
        new THREE.MeshBasicMaterial({
            color: 0x33ff33,
            transparent: true,
            opacity: 0.5
        }),
        new THREE.MeshBasicMaterial({
            color: 0x3333ff,
            transparent: true,
            opacity: 0.5
        })
    ]
    this.barMaterial = new THREE.MeshBasicMaterial({
        color: 0x994422
    });
    this.globalPixelCoord = function (geoCoord) {
        var viewboxAdj = scaleAtPoint(this.viewbox, this.viewbox.center(), 1 / 1.04);
        var gCoord = absoluteCoord(viewboxAdj, geoCoord);
        return gCoord;
    }
    this.sortByTScore = function () {
        this.sortOrder.length = 0;
        for (var i = 0; i < this.roiCompStatsArray.length; i++) {
            this.sortOrder.push(i);
        }
        var scope = this;
        this.sortOrder.sort(function (idx0, idx1) {
            // '<' means larger is in front
            return scope.roiCompStatsArray[idx0].tScore < scope.roiCompStatsArray[idx1].tScore;
        });
        //console.log(this.sortOrder);
    }
    this.quadAt = function (idx) {
        var numRois = (this.rois.length !== 0 ? this.rois.length : 5);
        var perSpaceX = 1 / numRois;
        var order = idx;
        if (this.sortOrder.length === this.rois.length) {
            //order = this.sortOrder[idx];
            order = this.sortOrder.indexOf(idx);
        }
        var lowEnd = new THREE.Vector2(perSpaceX * (order + this.barWidthOffsetX), this.quadBottom);
        var highEnd = new THREE.Vector2(perSpaceX * order + perSpaceX *
            (this.barWidthRatio + this.barWidthOffsetX), this.quadTop);
        var box = new THREE.Box2(lowEnd, highEnd);
        return box;
    }
    this.boxAt = function (idx) {
        var barheight;
        if (this.maxTScoreAbs === 0) {
            height = 0;
        }
        else {
            height = Math.abs(this.roiCompStatsArray[idx].tScore) / this.maxTScoreAbs * this.barHeight;
        }
        var box = this.quadAt(idx);
        box.max.y += height;
        return box;
    }
    this.barAt = function (idx) {
        var height = Math.abs(this.roiCompStatsArray[idx].tScore) / this.maxTScoreAbs * this.barHeight;
        var box = this.quadAt(idx);
        box.min.y = box.max.y;
        box.max.y += height;
        return box;
    }
    this.init = function (rois) {
        if (rois !== undefined) {
            this.rois = rois;
            this.clearScene();
            this.roiCompStatsArray.length = 0;
            for (var i = 0; i < rois.length; i++) {
                this.roiCompStatsArray.push(new three_roiCompStats());
                this.roiCompStatsArray[i].stats[0] = new three_roiStats(rois[i]);
                this.roiCompStatsArray[i].stats[1] = new three_roiStats(rois[i]);
            }
            this.update();
        }
    }
    this.containsPixel = function (pixCoord) {
        return this.roiView.containsPoint(pixCoord);
    }
    this.updateViewbox = function (idx, totalInView) {
        this.index = idx;
        //var startRatio = idx / totalInView;
        //var endRatio = (idx + 1) / totalInView;
        var verticalRatio = Math.min(0.3, 1 / totalInView);
        var endRatio = 1 - (totalInView - 1 - idx) * verticalRatio;
        var startRatio = 1 - (totalInView - idx) * verticalRatio;
        var newViewbox = cutBox(this.roiView.viewbox, 1, startRatio, endRatio);
        this.setViewbox(newViewbox);
    }
    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
        this.update();
    }
    this.setViewport = function (viewport) {
        var viewbox = viewport2viewbox(viewport);
        this.setViewbox(viewbox);
    }
    this.renderHighlight = function () {
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj.name == 'highlight') {
                destoryThreeJsObjectFromScene(this.scene, obj);
            }
        }
        if (spatialView.selectedObj !== null) {
            var hl_name = spatialView.selectedObj.name;
            for (var i = 0; i < this.rois.length; i++) {
                if (this.rois[i].name == hl_name) {
                    var wholeBox = this.boxAt(i);
                    var highlightBox = scaleAtPoint(wholeBox, wholeBox.center(), 1.1);
                    // add line
                    var hlBoxLineGeo = three_makeQuadWireGeometry(highlightBox);
                    var material = new THREE.LineBasicMaterial({
                        color: 0xff0000
                    });
                    var line = new THREE.Line(hlBoxLineGeo, material);
                    line.name = 'highlight';
                    this.scene.add(line);
                }
            }
        }
    }
    this.render = function () {
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        this.renderHighlight();
        this.renderLabels();
        //renderer.clearDepth();
        this.quadAxis.render();
        //renderer.clearDepth();
        this.barAxis.render();
        if (this.rois.length !== 0) {
            renderer.clearDepth();
            this.uiPanel.render();
        }
    }

    this.clearScene = function () {
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj !== this.camera) {
                this.scene.remove(obj);
            }
        }
    }
    this.clear = function () {
        for (var i = this.labelDivs.length - 1; i >= 0 ; i--) {
            var div = this.labelDivs[i];
            document.body.removeChild(div);
        }
        this.labelDivs.length = 0;
        this.quadAxis.clear();
        this.barAxis.clear();
    }
    this.renderLabels = function () {
        if (this.labelDivs.length !== this.rois.length) {
            for (var i = 0; i < this.labelDivs.length; i++) {
                document.body.removeChild(this.labelDivs[i]);
            }
            this.labelDivs.length = 0;
            for (var i = 0; i < this.rois.length; i++) {
                var text = document.createElement('div');
                document.body.appendChild(text);
                this.labelDivs.push(text);
            }
        }
        else {
            for (var i = 0; i < this.rois.length; i++) {
                var box = this.boxAt(i);
                var text = this.labelDivs[i];
                var gCoord = this.globalPixelCoord(box.min);
                text.innerHTML = "R_" + i;
                //text.style.width = 100;
                //text.style.height = 20;
                // remember to reverse Y
                text.style.top = window.innerHeight - gCoord.y + 'px';
                text.style.left = gCoord.x + 'px';
                //text.style.top = 200 + 'px';
                //text.style.left = 200 + 'px';
                text.style.position = 'absolute';
                text.style.zIndex = 1;
                text.style.backgroundColor = "transparent";
            }
        }
    }
    this.drawDummy = function (numRois) {
        /*
        numRois = (numRois !== undefined) ? numRois : 5;
        var perSpaceX = 1 / numRois;
        var dummyQuadMaterial = this.quadMaterial.clone();
        dummyQuadMaterial.opacity = 0.25;
        dummyQuadMaterial.transparent = true;
        var dummyLineMaterial = this.lineMaterial.clone();
        dummyLineMaterial.opacity = 0.25;
        dummyLineMaterial.transparent = true;
        for (var i = 0; i < numRois; i++) {
            var height = 0.25;
            var box = this.boxAt(i, height);
            var geometry = three_makeQuadGeometry(box);
            var cube = new THREE.Mesh(geometry, dummyQuadMaterial);
            this.scene.add(cube);

            var lineGeo = three_makeQuadWireGeometry(box);
            var line = new THREE.Line(lineGeo, dummyLineMaterial);
            this.scene.add(line);
        }
        */

        var loader = new THREE.TextureLoader();
        var theScope = this;
        loader.load('images/dummy.png', function (texture) {
            // asyc functions, so when images are loaded
            // status may have changed already
            if (theScope.rois.length !== 0) return;
            var img = new THREE.MeshBasicMaterial({
                map: texture,
                opacity: 0.25,
                transparent: true,
                color: 0xFFFFFF
            });
            var plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0.5), img);
            theScope.scene.add(plane);
        });
        loader.load('images/add.png', function (texture) {
            // asyc functions, so when images are loaded
            // status may have changed already
            if (theScope.rois.length !== 0) return;
            var img2 = new THREE.MeshBasicMaterial({
                map: texture,
                opacity: 0.25,
                transparent: true,
                color: 0xFFFFFF
            });
            var aspectRatio = theScope.viewbox.size().x / theScope.viewbox.size().y;
            var plane2;
            if (aspectRatio < 1) {
                plane2 = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45 * aspectRatio).translate(0.5, 0.5, 0.6), img2);
            }
            else plane2 = new THREE.Mesh(new THREE.PlaneGeometry(0.45 / aspectRatio, 0.45).translate(0.5, 0.5, 0.6), img2);
            theScope.scene.add(plane2);
        });
        
        /*
        var img = new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('images/dummy.png'),
            opacity: 0.25,
            transparent: true,
            color: 0xFFFFFF
        });
        var plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0.5), img);
        this.scene.add(plane);
        var img2 = new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('images/add.png'),
            opacity: 0.25,
            transparent: true,
            color: 0xFFFFFF
        });
        var aspectRatio = this.viewbox.size().x / this.viewbox.size().y;
        var plane2;
        if (aspectRatio < 1) {
            plane2 = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45*aspectRatio).translate(0.5, 0.5, 0.6), img2);
        }
        else plane2 = new THREE.Mesh(new THREE.PlaneGeometry(0.45/aspectRatio, 0.45).translate(0.5, 0.5, 0.6), img2);
        this.scene.add(plane2);
        
        */
    }
    this.highlight = function () {
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj instanceof THREE.Mesh) {
                if (obj.geometry instanceof THREE.PlaneGeometry) {
                    obj.material.opacity = 1;
                }
            }
        }
    }
    this.deHighlight = function () {
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj instanceof THREE.Mesh) {
                if (obj.geometry instanceof THREE.PlaneGeometry) {
                    obj.material.opacity = 0.25;
                }
            }
        }
    }
    this.drawBoundingBox = function () {
        var box = new THREE.Box2(new THREE.Vector3(-0.019, -0.019, 0),
            new THREE.Vector3(1.02, 1.02, 0));
        var material = this.lineMaterial;
        var geometry = three_makeQuadWireGeometry(box);
        var line = new THREE.Line(geometry, material);
        this.scene.add(line);
    }
    this.drawQuads = function () {
        if (this.rois.length == 0) return;
        var material = this.quadMaterial;
        var lineMaterial = this.lineMaterial;
        for (var i = 0; i < this.rois.length; i++) {
            var box = this.quadAt(i);
            var geometry = three_makeQuadGeometry(box);
            var cube = new THREE.Mesh(geometry, material);
            this.scene.add(cube);
            
            // add line
            var lineGeo = three_makeQuadWireGeometry(box);
            var line = new THREE.Line(lineGeo, lineMaterial);
            this.scene.add(line);

            // check if selected
            var object = spatialView.scene.getObjectByName(this.rois[i].name);
            if (object !== null && object !== undefined) {
                var wholeBox = this.boxAt(i);
                var highlightBox = scaleAtPoint(wholeBox, wholeBox.center(), 1.1);
                // add line
                var hlBoxLineGeo = three_makeQuadWireGeometry(highlightBox);
                var line = new THREE.Line(hlBoxLineGeo, lineMaterial);
                this.scene.add(line);
            }
        }
    }
    this.drawCurves = function (idx) {
        var means0 = [];
        var stdevs0 = [];
        var minStdev = 999999;
        for (var i = 0; i < this.roiCompStatsArray.length; i++) {
            var mean = this.roiCompStatsArray[i].stats[idx].mean();
            means0.push(mean);
            var stdev = this.roiCompStatsArray[i].stats[idx].stdev();
            stdevs0.push(stdev);
            if (stdev < minStdev) {
                minStdev = stdev;
            }
        }
        var perSpaceX = 1 / this.roiCompStatsArray.length;
        var box = this.quadAt(i);

        var material = this.curveMaterials[idx];
        var lineMaterial = this.lineMaterial;
        for (var i = 0; i < this.roiCompStatsArray.length; i++) {
            if (this.roiCompStatsArray[i].loaded) {
                minStdev = this.roiCompStatsArray[i].minStdev;
            }
            var box = this.quadAt(i);

            var geometry = getGaussianCurveGeometry(means0[i], stdevs0[i], box, 0, 1, minStdev);
            var mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);

            var lineGeo = getGaussianCurveLineGeometry(means0[i], stdevs0[i], box, 0, 1, minStdev);
            var line = new THREE.Line(lineGeo, lineMaterial);
            this.scene.add(line);
        }
    }
    this.drawBars = function () {
        var perSpaceX = 1 / this.roiCompStatsArray.length;
        var roiMaterial = this.barMaterial;
        var lineMaterial = this.lineMaterial;
        this.maxTScoreAbs = 0;
        this.maxEffectSizeAbs = 0;
        for (var i = 0; i < this.roiCompStatsArray.length; i++) {
            var tScoreAbs = Math.abs(this.roiCompStatsArray[i].tScore);
            if (tScoreAbs > this.maxTScoreAbs) {
                this.maxTScoreAbs = tScoreAbs;
            }
            var effectSizeAbs = Math.abs(this.roiCompStatsArray[i].effectSize);
            if (effectSizeAbs > this.maxEffectSizeAbs) {
                this.maxEffectSizeAbs = effectSizeAbs;
            }
        }
        for (var i = 0; i < this.roiCompStatsArray.length; i++) {
            var box = this.barAt(i);
            var geometry = three_makeQuadGeometry(box);
            var color = three_colorTable.divergingColor(this.roiCompStatsArray[i].effectSize,
                -this.maxEffectSizeAbs, this.maxEffectSizeAbs);
            var material = this.barMaterial.clone();
            material.color = color;
            var cube = new THREE.Mesh(geometry, material);
            this.scene.add(cube);

            // add line
            var lineGeo = three_makeQuadWireGeometry(box, 0.7);
            var line = new THREE.Line(lineGeo, lineMaterial);
            this.scene.add(line);
        }
    }
    this.updateQuadAxis = function () {
        this.quadAxis.viewbox = this.viewbox;
        this.quadAxis.low = this.quadBottom;
        this.quadAxis.high = this.quadTop;
        this.quadAxis.lowRange = 0;
        this.quadAxis.highRange = 1;
        this.quadAxis.update();
    }
    this.updateBarAxis = function () {
        this.barAxis.viewbox = this.viewbox;
        this.barAxis.low = this.quadTop;
        this.barAxis.high = this.quadTop + this.barHeight;
        this.barAxis.lowRange = 0;
        this.barAxis.highRange = this.maxTScoreAbs;
        this.barAxis.update();
    }
    this.update = function () {
        // update ui
        if (this.viewbox !== undefined) {
            this.uiPanel.setFromViewbox(this.viewbox);
            this.uiPanel.update();
        }

        this.clearScene();
        var isActive = (this.roiView.activeSubView === this);
        var roiLoaded = (this.rois.length !== 0);
        // dummy
        //this.drawLabel();
        if (!roiLoaded) {
            this.drawDummy();
            return;
        }
        var cohortLoaded = [(this.roiCompStatsArray[0].stats[0].subjectMeans.length
            !== 0),
            (this.roiCompStatsArray[0].stats[1].subjectMeans.length
            !== 0)];
        var statsLoaded = (this.roiCompStatsArray[0].loaded);
        if (isActive) {
            this.drawBoundingBox();
        }
        // if stats loaded, sort first
        if (statsLoaded) {
            this.sortByTScore();
        }
        // add basic quads
        if (roiLoaded) {
            this.updateQuadAxis();
            this.drawQuads();
        }
        // add curves
        if (cohortLoaded[0]) {
            this.drawCurves(0);
        }
        if (cohortLoaded[1]) {
            this.drawCurves(1);
        }
        //console.log(this);
        if (statsLoaded) {
            this.drawBars();
            this.updateBarAxis();
        }
    }
    function getGaussianCurveGeometry(mean, stdev, box, min, max, minStdev) {
        var numSteps = 50;
        var maxHeight = box.size().x;
        var geometry = new THREE.Geometry();
        var range = (max - min) * box.size().y;
        var left = box.min.x + Math.exp(-9) * maxHeight * (minStdev / stdev);
        var bottom = box.min.y;
        for (var i = -numSteps / 2; i <= numSteps / 2; i++) {
            var diff = i / (numSteps / 2) * 3;
            var height = Math.exp(-diff * diff) * maxHeight * (minStdev / stdev);
            var yPos = bottom + (diff * stdev + mean - min) * range;
            var p0 = new THREE.Vector3(left, yPos, 1);
            var p1 = new THREE.Vector3(left + height, yPos, 1);
            geometry.vertices.push(p0, p1);
        }

        for (var i = 0; i<geometry.vertices.length-2;i+=2){
            geometry.faces.push(new THREE.Face3(i, i + 1, i + 3));
            geometry.faces.push(new THREE.Face3(i, i + 3, i + 2));
        }

        return geometry;
    }
    function getGaussianCurveLineGeometry(mean, stdev, box, min, max, minStdev) {
        var numSteps = 50;
        var maxHeight = box.size().x;
        var geometry = new THREE.Geometry();
        var range = (max - min) * box.size().y;
        var left = box.min.x + Math.exp(-9) * maxHeight * (minStdev / stdev);
        var bottom = box.min.y;
        for (var i = -numSteps / 2; i <= numSteps / 2; i++) {
            var diff = i / (numSteps / 2) * 3;
            var height = Math.exp(-diff * diff) * maxHeight * (minStdev / stdev);
            var yPos = bottom + (diff * stdev + mean - min) * range;
            var p = new THREE.Vector3(left + height, yPos, 1);
            geometry.vertices.push(p);
        }
        geometry.vertices.push(geometry.vertices[0]);
        return geometry;
    }
    var scope = this;
    function getRoiCompStatsByPixelCoord(coord) {
        if (scope.rois.length == 0) return null;
        var viewboxAdj = scaleAtPoint(scope.viewbox, scope.viewbox.center(), 1/1.04);
        var norCoord = normalizedCoord(viewboxAdj, coord);
        for (var i = 0; i < scope.rois.length; i++) {
            var box = scope.boxAt(i);
            if (box.containsPoint(norCoord)) {
                console.log(scope.rois[i].name + ' clicked');
                return scope.rois[i];
            }
        }
        return null;
    }
    function buttonClickHandler(arg) {
        roiView.activeSubView = scope;
        if (arg === 0) {
            //var input = document.getElementById('fileinput');
            //input.click();
            roiView.addSubView();
            roiView.update();
        }
        else if (arg === 1) {
            var input = document.getElementById('directoryinput');
            input.click();
        }
        else if (arg === 2) {
            var input = document.getElementById('directoryinput1');
            input.click();
        }
        else if (arg === 3) {
            scope.clear();
            roiView.removeSubView(scope);
        }
    }
    function onMouseDown(event) {
        if (event.button !== 0) return;
        var coord = new THREE.Vector2(event.clientX, window.innerHeight - event.clientY);
        if (scope.viewbox.containsPoint(coord) && scope.rois.length === 0) {
            scope.roiView.activeSubView = scope;
            var input = document.getElementById('fileinput');
            input.click();
            return;
        }
        if (scope.uiPanel.eventInBox(event)) {
            scope.uiPanel.onMouseDown(event);
            return;
        }
        if (scope.viewbox.containsPoint(coord)) {
            scope.roiView.activeSubView = scope;
            if (scope.rois.length !== 0) {
                var roi = getRoiCompStatsByPixelCoord(coord);
                if (roi !== null) {
                    // alraedy in spatial view, remove it
                    var object = spatialView.scene.getObjectByName(roi.name);
                    if (object !== null && object !== undefined) {
                        spatialView.scene.remove(object);
                    }
                    // not yet in spatial view, add it
                    else {
                        //spatialView.addMarchingCubesMesh(roi, 0.5, roi.name);
                        spatialView.addRoi(roi);
                    }
                }
            }
            else {
                //var fileinput = document.getElementById('fileinput');
                //fileinput.click();
            }
            scope.roiView.update();
        }
    }
    function onMouseMove(event) {
        if (event.button !== 0) return;
        scope.uiPanel.onMouseMove(event);
        if (scope.uiPanel.eventInBox(event)) {
            scope.deHighlight();
            return;
        }
        var coord = new THREE.Vector2(event.clientX, window.innerHeight - event.clientY);
        if (scope.viewbox.containsPoint(coord)) {
            scope.highlight();
        }
        else {
            scope.deHighlight();
        }
    }

    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
}

three_roiSubView.prototype = Object.create(THREE.EventDispatcher.prototype);
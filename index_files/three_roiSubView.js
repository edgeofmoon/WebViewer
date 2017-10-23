

var three_roiSubViewDummyTexture_preview = null;
var three_roiSubViewDummyTexture_icon = null;

three_roiSubViewDummyTextureLoader = new THREE.TextureLoader();
three_roiSubViewDummyTextureLoader.load('images/dummy2.png', function (texture) {
    three_roiSubViewDummyTexture_preview = texture;
    if ("roiView" in window) {
        if (roiView !== undefined) {
            roiView.update();
        }
    }
});

three_roiSubViewDummyTextureLoader.load('images/add.png', function (texture) {
    three_roiSubViewDummyTexture_icon = texture;
    if ("roiView" in window) {
        if (roiView !== undefined) {
            roiView.update();
        }
    }
});

var cohortColors = [new THREE.Color(0.2, 0.2, 0.8), new THREE.Color(0.8, 0.2, 0.2)];

var three_roiSubView = function (roiView) {
    /******************* Variable Definitions ************************/
    // public member
    // default initialization
    this.index = -1;
    this.roiView = roiView;
    this.viewbox = new THREE.Box2();
    this.cohortCompData = new three_cohortCompData();
    this.roiBoxLayout = new three_roiBoxLayout();

    this.name = "View";
    // private members
    // rendering components
    // initialize now
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-0.02, 1.02, 1.02, -0.02, -100, 20000);
    var labelDivs = [];
    var roiBoxes = [];

    // sub-scene
    var subScene = new THREE.Scene();
    //var subCamera = new THREE.OrthographicCamera(0.006, 0.994, 1.02, -0.02, -100, 20000);
    var subCamera = new THREE.OrthographicCamera(0, 1, 1.02, -0.02, -100, 20000);

    // axes
    var quadAxis = new three_axisTicks();
    var barAxis = new three_axisTicks();
    var boundingBox = null;
    var legend = new three_legend;

    // ui
    var uiPanel = undefined;

    // cohortUi
    var cohortUiPanel = undefined;
    //var cohortButton0 = new three_ui_textBox(cohortUiPanel, 'name0',
    //    buttonClickHandler, "drag");
    //var cohortButton0 = new three_ui_textBox(cohortUiPanel, 'name1',
    //    buttonClickHandler, "drag");

    // status variable
    this.detail = false;
    var needUpdate = true;
    var status = ROIVIEW_STATUS_NONE;
    var statsIndex = 1;

    // drag view window event parameters
    var drag_onDrag = false;
    var drag_startPixel = new THREE.Vector2();
    var drag_currentPixel = new THREE.Vector2();
    var drag_dropTarget = null;

    // drag scene event
    var sceneDrag_onDrag = false;
    var sceneDrag_startPixel = new THREE.Vector2();
    var sceneDrag_currentPixel = new THREE.Vector2();
    var sceneDrag_accOffset = new THREE.Vector2(0, 0);
    var sceneDrag_curOffset = new THREE.Vector2(0, 0);

    this.enabled = true;
    /************** End of Variable Definitions **********************/

    
    /********************** Privileged  Functions (interfaces) ********************/
    this.init = function (rois) {
        scene.add(camera);
        this.roiBoxLayout.cohortCompData = this.cohortCompData;
        if (rois !== undefined) {
            this.cohortCompData.rois = rois;
        }
    }
    this.setHighlighted = function (bHighlighted) {
        if (!bHighlighted) {
            boundingBox.material.opacity = 0;
        }
        else {
            boundingBox.material.opacity = 1;
        }
    }
    this.setStatsIndex = function (sidx) {
        statsIndex = sidx;
    }
    this.update = function () {
        if (!this.enabled) return;
        var needQuad = false;
        for (var i = 0; i < this.getRois().length; i++) {
            if (this.cohortCompData.cohortRoiDataArray[0].stats[0].subjectMeans.length !== 0) {
                needQuad = true;
                break;
            }
        }
        this.roiBoxLayout.roiBox_width =
            this.roiBoxLayout.roiBox_widthBasePixel / this.getViewbox().size().x;
        this.roiBoxLayout.setQuadNeed(needQuad);
        this.clear();
        this.drawDummy();
        this.updateUI();
        this.updateLegend();
        this.drawBoundingBox();
        status = this.cohortCompData.computeStatus();
        if (status === ROIVIEW_STATUS_NONE) {
            this.drawDummy();
            return;
        }
        else {
            if (this.cohortCompData.computeStatus() === ROIVIEW_STATUS_COMP) {
                if (this.cohortCompData.getStatsName(statsIndex) === 'p value') {
                    this.roiBoxLayout.sortOption = SORT_INC;
                }
                else {
                    this.roiBoxLayout.sortOption = SORT_DEC;
                }
            }
            else {
                this.roiBoxLayout.sortOption = SORT_RAW;
            }
            this.roiBoxLayout.statsIndex = statsIndex;
            this.roiBoxLayout.update();
            if (status !== ROIVIEW_STATUS_NONE) {
                this.updateQuadAxis();
                this.updateBarAxis();
            }

            for (var i = 0; i < this.getRois().length; i++) {
                var roiBox = this.makeRoiBox(i);
                subScene.add(roiBox.renderable);

                // check if selected
                //var object = spatialView.scene.getObjectByName(this.getRois()[i].name);
                //if (object !== null && object !== undefined) {
                var roi = this.getRois()[i];
                if(spatialView.getRoiMesh(roi) !== undefined || spatialView.isRoiLoading(roi)){
                    var wholeBox = this.roiBoxLayout.boxAt(i);
                    var highlightBox = scaleAtPoint(wholeBox, wholeBox.center(), 1);
                    var material = new THREE.MeshBasicMaterial({
                        color: 0x000000
                    });
                    var pixelWidth = 1.04 / this.viewbox.size().x;
                    var pixelHeight = 1.04 / this.viewbox.size().y;
                    var hlBoxLineGeo = three_makeQuadBoarderGeometryWidth(highlightBox, 2 * pixelWidth, 2 * pixelHeight, 0.9);
                    var line = new THREE.Mesh(hlBoxLineGeo, material);

                    line.name = 'highlight_' + this.getRois()[i].name;
                    subScene.add(line);
                }
            }
        }
    }
    this.enable = function(){
        this.enabled = true;
    }
    this.disable = function(){
        this.enabled = false;
    }
    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
        this.viewbox.min.x += 10;
        if (this.viewbox.size().x > 100 && this.viewbox.size().y > 100) {
            this.enable();
            this.update();
        }
        else {
            this.disable();
        }
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

    this.updateQuadAxis = function () {
        quadAxis = new three_axisTicks();
        if (this.cohortCompData.computeStatus() !== ROIVIEW_STATUS_NONE) {
            quadAxis.viewbox = this.getViewbox();
            quadAxis.low = this.roiBoxLayout.getQuadBottom();
            quadAxis.high = this.roiBoxLayout.getQuadTop();
            quadAxis.valueRange = [-3, 3];
            quadAxis.update();
        }
    }
    this.updateBarAxis = function () {
        barAxis = new three_axisTicks();
        if (this.cohortCompData.computeStatus() === ROIVIEW_STATUS_COMP) {
            barAxis.viewbox = this.getViewbox();
            barAxis.low = this.roiBoxLayout.getBarBottom();
            barAxis.high = this.roiBoxLayout.getBarTop();
            var statsName = this.cohortCompData.getStatsName(statsIndex);
            var statsRange;// = roiView.getLegendManager().legendRanges.get(statsName);
            if (statsRange !== undefined) {
                //var mapType = three_legendManager.getStatsMapType(statsName);
                //barAxis.valueRange = three_legendManager.getValueDrawRange(statsRange, mapType);
                barAxis.valueRange = statsRange;
            }
            else {
                barAxis.valueRange = this.cohortCompData.computeStatsRange(statsIndex);
            }
            barAxis.logarithm = this.cohortCompData.useLogarithm(statsIndex);
            //if (!barAxis.logarithm ) {
               // barAxis.valueRange[1] = computeChartMax(Math.max(Math.abs(barAxis.valueRange[0]),
                //    Math.abs(barAxis.valueRange[1])));
                //barAxis.valueRange[0] = 0;
            //}
            barAxis.valueRange = roiView.getLegendManager().computeAxisRange(barAxis.valueRange, statsName);
            

            barAxis.update();
        }
    }
    // render function
    this.render = function () {
        if (!this.enabled) return;
        var theViewBox = this.getViewbox();
        if (drag_onDrag) {
            this.update();
        }
        renderer.setViewport(theViewBox.min.x, theViewBox.min.y, theViewBox.size().x, theViewBox.size().y);
        renderer.setScissor(theViewBox.min.x, theViewBox.min.y, theViewBox.size().x, theViewBox.size().y);
        //renderer.clear();
        renderer.render(scene, camera);
        quadAxis.render();
        barAxis.render();
        legend.render();
        this.renderHighlight();
        if (this.getRois().length !== 0
            && uiPanel !== undefined) {
            renderer.clearDepth();
            uiPanel.render();
        }
        if (cohortUiPanel !== undefined) {
            renderer.clearDepth();
            cohortUiPanel.render();
        }

        //var subViewbox = cutBox(theViewBox, 0, 0.05, 0.95);
        var subViewbox = cutBox(theViewBox, 0, 1 - 1 / 1.02, 1 / 1.02);
        renderer.setViewport(subViewbox.min.x, subViewbox.min.y, subViewbox.size().x, subViewbox.size().y);
        renderer.setScissor(subViewbox.min.x, subViewbox.min.y, subViewbox.size().x, subViewbox.size().y);
        renderer.render(subScene, subCamera);
    }

    this.merge = function (otherRoiSubView) {
        if (this.getRois() !== otherRoiSubView.getRois()) {
            alert('ROIs don\'t match!');
        }
        else {
            if (this.cohortCompData.cohortRoiDataArray.length === 2) {
                alert('Target already full!');
            }
            else if (this.cohortCompData.cohortRoiDataArray.length === 1
                && otherRoiSubView.cohortCompData.cohortRoiDataArray.length === 1) {
                this.cohortCompData.cohortRoiDataArray.push(
                    otherRoiSubView.cohortCompData.cohortRoiDataArray[0]);
                this.cohortCompData.update();
                statsIndex = this.cohortCompData.suggestNextStatsIndex(statsIndex);
            }
            else {
                alert('Both source and target should have only 1 cohort!');
            }
        }
    }

    this.drag = function (coord) {
        drag_startPixel = coord;
        drag_currentPixel = drag_startPixel;
        drag_onDrag = true;
    }
    /********************** Privileged  Functions (utilities) ********************/
    this.updateLegend = function () {

        var status = this.cohortCompData.computeStatus();

        /*
        if (status === ROIVIEW_STATUS_COMP) {
            legend.minValue = this.cohortCompData.cohortRoiCompStatRange[0];
            legend.maxValue = this.cohortCompData.cohortRoiCompStatRange[1];
            legend.title = this.cohortCompData.getStatsName();
            legend.viewbox = this.getViewbox();
            legend.box = new THREE.Box2(new THREE.Vector2(0.3, 0.95), new THREE.Vector2(0.7, 0.99));
            legend.update();

        }
        */
        // notify roiView to update legend
        roiView.updateLegend();
    }
    this.updateUI = function () {
        // update ui
        if (this.viewbox !== undefined) {
            if (uiPanel !== undefined) uiPanel.destory();
            uiPanel = new three_ui_panel();
            //var templateButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
            //    three_ui_button_drag_icon, buttonClickHandler, "drag");
            var roiDelButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
                three_ui_button_data_icon, buttonClickHandler, "roiDel");
            roiDelButton.setTooltip('Shrink/expand Selected');
            var templateButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
                three_ui_button_copy_icon, buttonClickHandler, "copy");
            templateButton.setTooltip('Copy');
            //var dataButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
            //    three_ui_button_data_icon, buttonClickHandler, "data");
            //var labelButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
            //    three_ui_button_label_icon, buttonClickHandler, "label");
            //var labelButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
            //    three_ui_button_dist_icon, buttonClickHandler, "detail");
            var deleteButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
                three_ui_button_delt_icon, buttonClickHandler, "delete");
            deleteButton.setTooltip('Delete');
            uiPanel.setFromViewbox(this.getViewbox(), ui_panel_position_topRight);
            uiPanel.update();

            if (cohortUiPanel !== undefined) cohortUiPanel.destory();
            cohortUiPanel = new three_ui_panel();
            /*
            for (var i = 0; i < this.cohortCompData.cohortRoiDataArray.length; i++) {
                var cohortButton = new three_ui_textBox(cohortUiPanel,
                    this.cohortCompData.cohortRoiDataArray[i].name, cohortColors[i],
                    buttonClickHandler, i + 1);
            }
            */
            var cohortButton = new three_ui_textBox(cohortUiPanel,
                    this.name, new THREE.Color(0, 0, 0),
                    buttonClickHandler, "drag");
            cohortButton.setTooltip('Drag to Move');
            var status = this.cohortCompData.computeStatus();
            if (status === ROIVIEW_STATUS_COMP) {
                var statsButton = new three_ui_textBox(cohortUiPanel,
                    this.cohortCompData.getStatsName(statsIndex), new THREE.Color(0, 0, 0),
                    buttonClickHandler, "stats_next");
                statsButton.setTooltip('Switch Statistics Display');
                statsButton.cursorStyle = 'pointer';
            }
            cohortUiPanel.setFromViewbox(this.getViewbox(), ui_panel_position_topLeft);
            cohortUiPanel.update();
        }
    }
    this.clearScene = function () {
    }
    this.clear = function () {
        for (var i = scene.children.length - 1; i >= 0 ; i--) {
            var obj = scene.children[i];
            if (obj !== camera) {
                destoryThreeJsObjectFromScene(scene, obj);
            }
        }
        for (var i = subScene.children.length - 1; i >= 0 ; i--) {
            var obj = subScene.children[i];
            if (obj !== camera) {
                destoryThreeJsObjectFromScene(subScene, obj);
            }
        }
        disposeHierarchy(scene);
        disposeHierarchy(subScene);
        for (var i = 0; i < roiBoxes.length; i++) {
            roiBoxes[i].clear();
        }
        roiBoxes.length = 0;
        quadAxis.clear();
        barAxis.clear();
        legend.clear();
        if (uiPanel !== undefined) uiPanel.clear();
        if (cohortUiPanel !== undefined) cohortUiPanel.clear();
    }
    this.renderHighlight = function () {
        for (var i = subScene.children.length - 1; i >= 0 ; i--) {
            var obj = subScene.children[i];
            if (obj.name.substring(0, 9) == 'highlight') {
                obj.material.color.set(0);
            }
        }
        if (spatialView.selectedObj !== undefined) {
            var hl_name = spatialView.selectedObj.name;
            /*
            for (var i = 0; i < this.getRois().length; i++) {
                if (this.getRois()[i].name == hl_name) {
                    var wholeBox = this.roiBoxLayout.boxAt(i);
                    var highlightBox = scaleAtPoint(wholeBox, wholeBox.center(), 1);
                    // add line
                    var pixelWidth = 1.04 / this.viewbox.size().x;
                    var pixelHeight = 1.04 / this.viewbox.size().y;
                    var hlBoxLineGeo = three_makeQuadBoarderGeometryWidth(highlightBox, 5 * pixelWidth, 5 * pixelHeight, 0.99);
                    var material = new THREE.MeshBasicMaterial({
                        color: 0xff0000
                    });
                    var line = new THREE.Mesh(hlBoxLineGeo, material);
                    line.name = 'highlight';
                    scene.add(line);
                }
            }
            */
            for (var i = subScene.children.length - 1; i >= 0 ; i--) {
                var obj = subScene.children[i];
                if (obj.name == 'highlight_' + hl_name) {
                    obj.material.color.set(0xff0000);
                    obj.material.needsUpdate = true;
                }
            }
        }
    }
    this.drawBoundingBox = function () {
        var box = new THREE.Box2(new THREE.Vector3(-0.019, -0.019, 0),
            new THREE.Vector3(1.02, 1.02, 0));
        var material = new THREE.LineBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0
        });;
        var geometry = three_makeQuadWireGeometry(box);
        boundingBox = new THREE.Line(geometry, material);
        scene.add(boundingBox);
    }
    this.makeRoiBox = function (idx) {
        var roiBox = new three_roiBox();
        roiBox.parent = this;
        roiBox.index = idx;
        roiBox.quad = this.roiBoxLayout.quadAt(idx);
        roiBox.bar = this.roiBoxLayout.barAt(idx);
        if (this.roiBoxLayout.isRoiHidden(idx)) {
            roiBox.label = '';
        }
        else roiBox.label = this.cohortCompData.rois[idx].name;
        roiBox.cohortCompData = this.cohortCompData;
        roiBox.color = this.roiBoxLayout.colorAt(idx);
        roiBox.detail = this.detail;
        roiBox.init();
        roiBox.update();
        roiBoxes.push(roiBox);
        return roiBox;
    }
    this.getRois = function () {
        if (this.cohortCompData === undefined) return [];
        if (this.cohortCompData.rois === undefined) return [];
        return this.cohortCompData.rois;
    }
    this.getRoiColor = function (roi) {
        var idx = this.getRoiIndex(roi);
        return this.roiBoxLayout.colorAt(idx);
    }
    this.getRoiIndex = function (roi) {
        if (this.cohortCompData === undefined) return [];
        if (this.cohortCompData.rois === undefined) return [];
        var rois = this.cohortCompData.rois;
        return rois.indexOf(roi);
    }
    this.getRoiByPixelCoord = function(coord) {
        if (this.getRois().length == 0) return null;
        var theViewBox = this.getViewbox();
        var viewboxAdj = cutBox(theViewBox, 0, 1 - 1 / 1.02, 1 / 1.02);
        var norCoord = normalizedCoord(viewboxAdj, coord);
        for (var i = 0; i < this.getRois().length; i++) {
            var box = this.roiBoxLayout.boxAt(i);
            if (box.containsPoint(norCoord)) {
                //console.log(this.getRois()[i].name + ' clicked');
                return this.getRois()[i];
            }
        }
        return null;
    }
    this.getViewbox = function () {
        var theViewBox = this.viewbox.clone();
        if (drag_onDrag) {
            var offset = new THREE.Vector2();
            offset.subVectors(drag_currentPixel, drag_startPixel)
            if (offset.x !== 0 || offset.y !== 0) {
                theViewBox.translate(offset);
            }
        }
        return theViewBox;
    }
    this.getStatsIndex = function () {
        return statsIndex;
    }
    this.globalPixelCoord = function (geoCoord) {
        var theViewBox = this.getViewbox();
        var viewboxAdj = scaleAtPoint(theViewBox, theViewBox.center(), 1 / 1.04);
        var gCoord = absoluteCoord(viewboxAdj, geoCoord);
        return gCoord;
    };
    this.drawDummy = function (numRois) {
        // must use this to store this pointer
        // because the onLoad function is called by window
        var theScope = this;
        // status may have changed already
        if (theScope.getRois().length !== 0) return;
        var img = new THREE.MeshBasicMaterial({
            map: three_roiSubViewDummyTexture_preview,
            opacity: 0.25,
            transparent: true,
            color: 0xFFFFFF
        });
        var plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0.5), img);
        scene.add(plane);
        if (theScope.getRois().length !== 0) return;
        var img2 = new THREE.MeshBasicMaterial({
            map: three_roiSubViewDummyTexture_icon,
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
        scene.add(plane2);
    }
    /********************** Private  Functions ********************/
    var scope = this;
    // event handlers
    this.onMouseMove = function (event) {
        if (!this.enabled) return;
        if (uiPanel !== undefined) {
            uiPanel.onMouseMove(event);
        }
        if (cohortUiPanel !== undefined) {
            cohortUiPanel.onMouseMove(event);
        }
        if (drag_onDrag) {
            drag_currentPixel = eventCoord(event);
            var newLocationIdx = roiView.getLocationIndex(drag_currentPixel);
            if (newLocationIdx >= 0) {
                drag_dropTarget = newLocationIdx;
                roiView.highlightLocation(drag_dropTarget);
            }
            else {
                roiView.highlightLocation(-1);
                var subView = roiView.getSubViewAt(drag_currentPixel);
                if (subView !== this && subView !== null) {
                    roiView.highlightSubView(subView);
                    drag_dropTarget = subView;
                }
                else {
                    drag_dropTarget = -1;
                }
            }
            roiView.updateRoiViewLinks();
        }

        if (sceneDrag_onDrag) {
            sceneDrag_currentPixel = eventCoord(event);
            sceneDrag_curOffset.subVectors(sceneDrag_currentPixel, sceneDrag_startPixel);
            sceneDrag_curOffset.x /= this.viewbox.size().x;
            // offset.y /= this.viewbox.size().y;
            sceneDrag_curOffset.y = 0;
            var offset = new THREE.Vector2();
            offset.addVectors(sceneDrag_curOffset, sceneDrag_accOffset);
            var xRange = this.roiBoxLayout.xRange;
            if (xRange[1] > 1) {
                if (offset.x > 0) offset.x = 0;
                if (offset.x < 1 - xRange[1]) offset.x = 1 - xRange[1];
            }
            else {
                if (offset.x > 1 - xRange[1]) offset.x = 1 - xRange[1];
                if (offset.x < 0) offset.x = 0;
            }
            // for the sake of consistency
            sceneDrag_accOffset.subVectors(offset, sceneDrag_curOffset);
            this.roiBoxLayout.setOffset(offset);
            this.update();
            roiView.updateRoiViewLinks();
        }

        if (!drag_onDrag && !sceneDrag_onDrag) {
            var coord = eventCoord(event);
            if (this.viewbox.containsPoint(coord)) {
                var roi = this.getRoiByPixelCoord(coord);
                if (roi !== null) {
                    tooltip.setPosition(coord);
                    var idx = this.cohortCompData.rois.indexOf(roi);
                    var effectSize = this.cohortCompData.cohortRoiCompStats[idx].effectSize;
                    var pValue = this.cohortCompData.cohortRoiCompStats[idx].pValue;
                    var name = roi.fullname ? roi.fullname : roi.name;
                    tooltip.setText(name +
                        "\nEffect size: " + effectSize +
                        "\np value: "+pValue +
                        "\n(Click to toggle 3D geometry)");
                }
            }
        }
    }

    this.onMouseWheel = function (event) {
        if (!this.enabled) return;

        var coord = eventCoord(event);
        if (!scope.viewbox.containsPoint(coord)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if (event.wheelDelta) {

            if (event.wheelDelta > 0) {
                scope.roiBoxLayout.roiBox_widthBasePixel *= 1.1;
            }
            else {
                scope.roiBoxLayout.roiBox_widthBasePixel /= 1.1;
            }
            scope.update();
            roiView.updateRoiViewLinks();
        } else if (event.detail) {

            // Firefox

            delta = - event.detail / 3;

        }

    }

    this.onMouseDown = function (event) {
        if (!this.enabled) return;
        if (event.button !== 0) return;
        var coord = eventCoord(event);
        if (scope.viewbox.containsPoint(coord) && scope.getRois().length === 0) {
            scope.roiView.activeSubView = scope;
            var input = document.getElementById('fileinput');
            input.click();
            return;
        }
        if (uiPanel.eventInBox(event)) {
            uiPanel.onMouseDown(event);
            return;
        }
        if (cohortUiPanel.eventInBox(event)) {
            cohortUiPanel.onMouseDown(event);
            return;
        }
        if (scope.viewbox.containsPoint(coord)) {
            scope.roiView.activeSubView = scope;
            if (scope.getRois().length !== 0) {
                var roi = this.getRoiByPixelCoord(coord);
                if (roi !== null) {
                    // alraedy in spatial view, remove it
                    var object = spatialView.scene.getObjectByName(roi.name);
                    if (object !== null && object !== undefined) {
                        //destoryThreeJsObjectFromScene(spatialView.scene, object);
                        spatialView.removeRoi(roi);
                    }
                    // not yet in spatial view, add it
                    else {
                        var idx = scope.getRois().indexOf(roi);
                        var color = scope.roiBoxLayout.colorAt(idx);
                        spatialView.addRoi(roi, color);
                    }
                }
                else {
                    sceneDrag_onDrag = true;
                    sceneDrag_startPixel = coord;
                    sceneDrag_currentPixel = coord;
                }
            }
            scope.roiView.update();
        }
    }

    this.onMouseUp = function (event) {
        if (!this.enabled) return;
        if (drag_onDrag) {
            drag_onDrag = false;
            scope.update();
            roiView.highlightSubView(0);
            roiView.highlightLocation(-1);
            // current disable this function by adding false
            if (false && drag_dropTarget instanceof three_roiSubView) {
                drag_dropTarget.merge(this);
                drag_dropTarget.update();
                roiView.removeSubView(this);
            }
            else if (drag_dropTarget >= 0) {
                roiView.moveSubViewToLocation(this, drag_dropTarget);
                console.log('Move to ' + drag_dropTarget);
            }
            else {
                var coord = eventCoord(event);
                if (spatialView.viewbox.containsPoint(coord)) {
                    // tmp removal for gen pics
                    if (this.getRois()[0].type !== 'cortical' || true) {
                        // add all rois to spatial view first
                        var rois = this.getRois();
                        for (var i = 0; i < rois.length; i++) {
                            var roi = rois[i];
                            var idx = scope.getRois().indexOf(roi);
                            var color = scope.roiBoxLayout.colorAt(idx);
                            var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
                            spatialView.addRoi(roi, color, statValue);
                        }
                        if (inplaceCharts.cohortCompDatasets.indexOf(this.cohortCompData) < 0) {
                            inplaceCharts.cohortCompDatasets.push(this.cohortCompData);
                        }
                    }
                    else {
                        var rois = this.getRois();
                        for (var i = 0; i < rois.length; i++) {
                            var roi = rois[i];
                            var idx = scope.getRois().indexOf(roi);
                            var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(1);

                            var color = three_colorTable.heatedBodyColor(Math.abs(statValue), 0.556);
                            spatialView.addRoi(roi, color, statValue);
                        }
                        if (inplaceCharts.cohortCompDatasets.indexOf(this.cohortCompData) < 0) {
                            inplaceCharts.cohortCompDatasets.push(this.cohortCompData);
                        }
                        //roiView.removeSubView(this);
                        /*
                        var geos = [];
                        var vals = [];
                        var colors = [];
                        var rois = this.getRois();
                        var toLoad = rois.length;
                        for (var i = 0; i < rois.length; i++) {
                            var roi = rois[i];
                            var idx = scope.getRois().indexOf(roi);
                            colors.push(roi.color);
                            var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
                            vals[i] = Math.sqrt(Math.abs(statValue)) + 0.1;
                            (function (idx) {
                                roi.computeGeometry(function callBack(geometry) {
                                    if (spatialView.showBoundary) {
                                        //var lineSegmentGeometry = makeBoundaryLineSegmentsGeometry(geometry.vertices, geometry.faces);
                                        //var lineMaterial = new THREE.LineBasicMaterial({
                                        //    color: 0xff0000
                                        //});
                                        //var lineSegments = new THREE.LineSegments(lineSegmentGeometry, lineMaterial);
                                        //spatialView.scene.add(lineSegments);
                                        var bandGeometry = makeBoundaryBandGeometry(geometry.vertices, geometry.faces, Math.abs(statValue));
                                        //var bandMaterial = new THREE.MeshLambertMaterial();
                                        var bandMaterial = new THREE.MeshBasicMaterial();
                                        bandMaterial.color = colors[idx];
                                        var band = new THREE.Mesh(bandGeometry, bandMaterial);
                                        spatialView.scene.add(band);

                                    }
                                    geos[idx] = geometry;
                                    toLoad--;
                                    if (toLoad == 0) {
                                        var mesh = genCollectiveMesh(geos, vals);
                                        mesh.roi = rois[0];
                                        spatialView.scene.add(mesh);
                                    }
                                });
                            }(i));
                        }*/
                    }
                }
            }
            roiView.updateRoiViewLinks();
        }

        if (sceneDrag_onDrag) {
            sceneDrag_onDrag = false;
            sceneDrag_accOffset.addVectors(sceneDrag_curOffset, sceneDrag_accOffset);
            sceneDrag_curOffset.set(0, 0);
        }
    }

    function buttonClickHandler(arg, event) {
        roiView.activeSubView = scope;
        if (arg === 'copy') {
            /*
            // make a copy of the rois only
            var newSubView = roiView.addSubView(scope.getRois());
            newSubView.update();
            roiView.updateRoiViewLinks();
            */

            // make a 'copy' of the cohortCompData
            var cohortCompData2 = new three_cohortCompData();
            cohortCompData2.rois = scope.getRois();
            cohortCompData2.cohortRoiDataArray = scope.cohortCompData.cohortRoiDataArray.slice(0);
            // this comp stats should be cloned
            for (var i = 0; i < scope.cohortCompData.cohortRoiCompStats.length; i++) {
                cohortCompData2.cohortRoiCompStats.push(scope.cohortCompData.cohortRoiCompStats[i].clone());
            }
            cohortCompData2.cohortRoiCompStatRange = scope.cohortCompData.cohortRoiCompStatRange;
            cohortCompData2.sortOrder = scope.cohortCompData.sortOrder.slice(0);
            cohortCompData2.sortOption = scope.cohortCompData.sortOption;
    
            var newSubView2 = roiView.addSubView(cohortCompData2.rois);
            roiView.getLegendManager().cohortCompDatasets.push(cohortCompData2);
            newSubView2.cohortCompData = cohortCompData2;
            newSubView2.init();
            newSubView2.setStatsIndex(statsIndex);
            newSubView2.name = scope.name + "copy";
            newSubView2.update();
        }
        else if (arg === 'roiDel') {
            var oldRois = scope.getRois();
            for (var i = 0; i < oldRois.length ; i++) {
                var roi = oldRois[i];
                // alraedy in spatial view, remove it
                var object = spatialView.scene.getObjectByName(roi.name);
                if (object !== null && object !== undefined) {
                    if (!scope.roiBoxLayout.isRoiHidden(i)) {
                        scope.roiBoxLayout.hideRoi(i);
                    }
                    else {
                        scope.roiBoxLayout.unhideRoi(i);
                    }
                }
            }
            roiView.update();
        }
        else if (arg === 'data') {
            var input = document.getElementById('directoryinput');
            input.click();
        }
        else if (arg === 'label') {
            var fileinput = document.getElementById('fileinput1');
            fileinput.click();
        }
        else if (arg === 'detail') {
            scope.detail = !scope.detail;
            if (status !== ROIVIEW_STATUS_COMP
                && status !== ROIVIEW_STATUS_DATA) return;
            scope.update();

        }
        else if (arg === 'stats_next') {
            if (status !== ROIVIEW_STATUS_COMP) return;
            statsIndex = scope.cohortCompData.suggestNextStatsIndex(statsIndex);
            //scope.update();
            roiView.update();
        }
        else if (arg === 'delete') {
            scope.clear();
            roiView.removeSubView(scope);
            var idx = roiView.getLegendManager().cohortCompDatasets.indexOf(scope.cohortCompData);
            roiView.getLegendManager().cohortCompDatasets.splice(idx, 1);
            //roiView.updateRoiViewLinks();
            roiView.update();
        }
        else if (arg === 'drag') {
            drag_startPixel = eventCoord(event);
            drag_currentPixel = drag_startPixel;
            drag_onDrag = true;
        }
        else if (arg === 1) {
            if (scope.cohortCompData.cohortRoiDataArray.length === 1) {
                // normal drag
                drag_startPixel = eventCoord(event);
                drag_currentPixel = drag_startPixel;
                drag_onDrag = true;
            }
            else {
                var coord = eventCoord(event);
                roiView.addFloatingSubView(scope.cohortCompData.cohortRoiDataArray[0], coord);
                scope.cohortCompData.cohortRoiDataArray[0]
                 = scope.cohortCompData.cohortRoiDataArray[1];
                scope.cohortCompData.cohortRoiDataArray.length = 1;
                scope.cohortCompData.update();
                scope.update();
            }
        }
        else if (arg === 2) {
            if (scope.cohortCompData.cohortRoiDataArray.length === 2) {
                var coord = eventCoord(event);
                roiView.addFloatingSubView(scope.cohortCompData.cohortRoiDataArray[1], coord);
                scope.cohortCompData.cohortRoiDataArray.length = 1;
                scope.cohortCompData.update();
                scope.update();
            }
        }
    }
}


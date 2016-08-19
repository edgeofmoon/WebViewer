
var three_roiView = function () {
    this.viewbox = new THREE.Box2(new THREE.Vector2(0, 0),
        new THREE.Vector2(window.innerWidth, window.innerHeight));
    this.subViews = [];
    this.activeSubView;
    this.floatingSubView;

    // private
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(0, 1, 1, 0, -100, 20000);
    var roiSubViewLinks = [];
    var legendManager = new three_legendManager();

    this.init = function () {
    }

    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
        camera = new THREE.OrthographicCamera(this.viewbox.min.x, this.viewbox.max.x,
            this.viewbox.max.y, this.viewbox.min.y, -100, 20000);
        this.updateSubViewboxes();
        legendManager.update();
        this.updateRoiViewLinks();
    }
    this.render = function () {
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.clear();
        renderer.render(scene, camera);
        for (var i = 0; i < this.subViews.length; i++) {
            //this.subViews[i].update();
            this.subViews[i].render();
        }
        legendManager.render();
        //return;
        if (spatialView.roiLinks) {
            if (this.subViews.length - 1 > roiSubViewLinks.length) {
                this.updateRoiViewLinks();
            }
            for (var i = 1; i < this.subViews.length; i++) {
                roiSubViewLinks[i - 1].render();
            }
        }
        //console.log(renderer.info.programs.length);
    }
    this.addSubView = function (rois) {
        if (rois === undefined) {
            if (this.activeSubView === undefined) return;
            else if (this.activeSubView.getRois().length === 0) {
                alert('Cannot copy empty ROI!');
                return;
            };
        }
        var newSubView = new three_roiSubView(this);
        var theRois = (rois === undefined ? this.activeSubView.rois : rois);
        this.subViews.push(newSubView);
        this.updateSubViewboxes();
        newSubView.init(theRois);
        return newSubView;
    }
    this.addFloatingSubView = function (cohortRoiData, coord) {
        var newSubView = new three_roiSubView(this);
        newSubView.cohortCompData.rois = cohortRoiData.rois;
        newSubView.cohortCompData.add(cohortRoiData);
        newSubView.init();
        newSubView.viewbox = this.subViews[0].viewbox.clone();
        var size = newSubView.viewbox.size();
        newSubView.viewbox.min.x = coord.x;
        newSubView.viewbox.min.y = coord.y - size.y;
        newSubView.viewbox.max.x = coord.x + size.x;
        newSubView.viewbox.max.y = coord.y;
        newSubView.update();
        newSubView.drag(coord);
        this.subViews.push(newSubView);
        this.floatingSubView = newSubView;
    }
    this.removeSubView = function (roiSubView) {
        var idx = this.subViews.indexOf(roiSubView);
        if (idx > -1) {
            this.subViews[idx].clear();
            this.subViews.splice(idx, 1);
        }
        this.updateSubViewboxes();
    }
    this.addDummySubView = function () {
        var newSubView = new three_roiSubView(this);
        this.subViews.push(newSubView);
        this.updateSubViewboxes();
        return newSubView;
    }
    this.getDummySubView = function () {
        for (var i = 0; i < this.subViews.length; i++) {
            if (this.subViews[i].getRois() === null) {
                return this.subViews[i];
            }
        }
        return null;
    }
    this.getSubViewAt = function (coord) {
        for (var i = 0; i < this.subViews.length; i++) {
            if (this.subViews[i].viewbox.containsPoint(coord)) {
                return this.subViews[i];
            }
        }
        return null;
    }
    this.getLocationIndex = function (coord) {
        if (this.subViews.length === 0) return -1;
        else {
            var firstBox = cutBox(this.subViews[0].viewbox, 1, -0.2, 0.2);
            if (firstBox.containsPoint(coord)) {
                return 0;
            }
            for (var i = 0; i < this.subViews.length; i++) {
                if (this.subViews[i] !== this.floatingSubView) {
                    var box = cutBox(this.subViews[i].viewbox, 1, 0.8, 1.2);
                    if (box.containsPoint(coord)) {
                        return i + 1;
                    }
                }
            }
        }
        return -1;
    }
    this.moveSubViewToLocation = function (subView, index) {
        var idx = this.subViews.indexOf(subView);
        if(subView === this.floatingSubView){
            this.floatingSubView = undefined;
        }
        else if (index === idx || index === idx + 1) return;
        if (idx > -1) {
            this.subViews.splice(idx, 1);
        }
        this.subViews.splice(index, 0, subView);
        this.updateSubViewboxes();
    }
    this.highlightSubView = function (subView) {
        for (var i = 0; i < this.subViews.length; i++) {
            if (this.subViews[i] === subView) {
                this.subViews[i].setHighlighted(true);
            }
            else {
                this.subViews[i].setHighlighted(false);
            }
        }
    }

    this.highlightLocation = function (index) {
        this.clearScene();
        if (index < 0) return;
        var newBox;
        if (index === 0) {
            var box = this.subViews[0].viewbox;
            newBox = cutBox(box, 1, 0, 0.02);
        }
        else {
            var box = this.subViews[index - 1].viewbox;
            newBox = cutBox(box, 1, 0.98, 1);
        }
        var geometry = three_makeQuadWireGeometry(newBox);
        var material = new THREE.LineBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1
        });;
        var boundingBox = new THREE.Line(geometry, material);
        scene.add(boundingBox);
    }

    this.clearScene = function () {
        for (var i = scene.children.length - 1; i >= 0 ; i--) {
            var obj = scene.children[i];
            if (obj !== camera) {
                destoryThreeJsObjectFromScene(scene, obj);
            }
        }
    }
    this.updateLegend = function () {
        legendManager.update();
    }
    this.getLegendManager = function () {
        return legendManager;
    }
    this.updateSubViewboxes = function () {
        var totalSubViews = this.subViews.length;
        for (var idx = 0; idx < totalSubViews; idx++) {
            var verticalRatio = Math.min(0.3, 0.9 / totalSubViews);
            var endRatio = 0.99 - (totalSubViews - 1 - idx) * verticalRatio;
            var startRatio = 0.99 - (totalSubViews - idx) * verticalRatio;
            var newViewbox = cutBox(this.viewbox, 1, startRatio, endRatio);
            this.subViews[idx].setViewbox(newViewbox);
        }
        legendManager.viewbox = cutBox(this.viewbox, 1, 0.01, 0.09);
    }
    this.updateRoiViewLinks = function () {
        for (var i = 1; i < this.subViews.length; i++) {
            if (roiSubViewLinks.length <= i - 1) {
                var svl = new three_roiSubViewLinks();
                roiSubViewLinks.push(svl);
            }
            var subViewLinks = roiSubViewLinks[i - 1];
            subViewLinks.roiSubViews[0] = this.subViews[i - 1];
            subViewLinks.roiSubViews[1] = this.subViews[i];
            subViewLinks.update();
        }
    }
    this.update = function () {
        legendManager.update();
        for (var i = 0; i < this.subViews.length; i++) {
            this.subViews[i].update();
        }
        this.updateRoiViewLinks();
    }
    this.removeAllSubViews = function () {
        this.subViews.length = 0;
        this.getLegendManager().cohortCompDatasets.length = 0;
        this.update();
    }
    var scope = this;

    function onMouseMove(event) {
        for (var i = 0; i < scope.subViews.length; i++) {
            scope.subViews[i].onMouseMove(event);
        }
    }

    function onMouseWheel(event) {
        for (var i = 0; i < scope.subViews.length; i++) {
            scope.subViews[i].onMouseWheel(event);
        }
    }

    function onMouseDown(event) {
        var coord = eventCoord(event);
        for (var i = 0; i < scope.subViews.length; i++) {
            if (scope.subViews[i].viewbox.containsPoint(coord)) {
                scope.subViews[i].onMouseDown(event);
                return;
            }
        }
    }

    function onMouseUp(event) {
        for (var i = 0; i < scope.subViews.length; i++) {
            scope.subViews[i].onMouseUp(event);
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
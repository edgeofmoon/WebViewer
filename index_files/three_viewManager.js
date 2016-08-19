

var three_viewManager = function () {
    this.viewbox;
    this.linePixels = 5;
    // for x split
    this.ctrlPoints = [0, 0, 0.6, 1];
    this.subviewboxes = [];
    this.numViews = 2;
    
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(0, 1920, 800, 0, -100, 20000);
    this.setNumViews = function(nV){
        this.numViews = nV;
    }

    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
    }

    this.update = function () {
        this.subviewboxes.length = 0;
        for (var i = 0; i < this.ctrlPoints.length-1; i++) {
            var subBox = cutBox(this.viewbox, 0,
                this.ctrlPoints[i], this.ctrlPoints[i + 1]);
            subBox.min.x += this.linePixels;
            subBox.max.x -= this.linePixels;
            this.subviewboxes.push(subBox);
        }
        camera.right = this.viewbox.size().x;
        camera.top = this.viewbox.size().y;
        camera.updateProjectionMatrix();
        emptyScene(scene);
        for (var i = 1; i < this.ctrlPoints.length - 1; i++) {
            var geometry = new THREE.PlaneGeometry(this.linePixels, this.viewbox.size().y);
            geometry.translate(this.ctrlPoints[i] * this.viewbox.size().x, this.viewbox.size().y / 2, 0);
            var mat = new THREE.MeshBasicMaterial({ color: 0x999999 });
            var mesh = new THREE.Mesh(geometry, mat);
            scene.add(mesh);
        }
    }

    this.getViewbox = function (idx) {
        return this.subviewboxes[idx].clone();
    }

    this.getViewport = function (idx) {
        var viewbox = this.getViewbox(idx);
        var ret = [viewbox.min.x, viewbox.min.y, viewbox.max.x, viewbox.max.y];
        return ret;
    }
    this.getControlPointIndexAtCoord = function (coord) {
        for (var i = 1; i < this.ctrlPoints.length - 1; i++) {
            var pos = this.ctrlPoints[i] * this.viewbox.size().x + this.viewbox.min.x;
            if (Math.abs(coord.x-pos)<this.linePixels/2) {
                return i;
            }
        }
        return -1;
    }
    this.render = function () {
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);

        renderer.render(scene, camera);
    }
    // event handlers
    var scope = this;
    var ctrlIdx = -1;
    function onMouseMove(event) {
        if (ctrlIdx >= 0) {
            var coord = eventCoord(event);
            var newCtrlPos = coord.x / scope.viewbox.size().x;
            /*
            if (newCtrlPos >= 0.85) newCtrlPos = 0.85;
            var oldCtrlPos = scope.ctrlPoints[ctrlIdx];
            for (var i = 1; i < scope.ctrlPoints.length - 1; i++) {
                if (i < ctrlIdx) {
                    scope.ctrlPoints[i]
                        = scope.ctrlPoints[i] / oldCtrlPos * newCtrlPos;
                }
                else {
                    scope.ctrlPoints[i]
                        = (scope.ctrlPoints[i] - oldCtrlPos) / (1 - oldCtrlPos) * (1 - newCtrlPos) + newCtrlPos;
                }
            }
            */
            if (newCtrlPos > scope.ctrlPoints[ctrlIdx + 1]) newCtrlPos = scope.ctrlPoints[ctrlIdx + 1];
            if (newCtrlPos < scope.ctrlPoints[ctrlIdx - 1]) newCtrlPos = scope.ctrlPoints[ctrlIdx - 1];
            scope.ctrlPoints[ctrlIdx] = newCtrlPos;
            app.resize();
        }
        else {
            var coord = eventCoord(event);
            var idx = scope.getControlPointIndexAtCoord(coord);
            if (idx >= 0) {
                tooltip.setPosition(coord);
                tooltip.setText('Drag to resize views.');
            }
        }
    }

    function onMouseWheel(event) {
    }

    function onMouseDown(event) {
        var coord = eventCoord(event);
        ctrlIdx = scope.getControlPointIndexAtCoord(coord);
    }

    function onMouseUp(event) {
        ctrlIdx = -1;
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
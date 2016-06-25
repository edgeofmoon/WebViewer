
var three_roiSubViewLinks = function () {
    this.roiSubViews = [undefined, undefined];

    // private
    var viewbox = new THREE.Box2(new THREE.Vector2(0, 0),
        new THREE.Vector2(window.innerWidth, window.innerHeight));
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-0.02, 1.02, 1.02, -0.02, -100, 20000);

    this.clearScene = function () {
        clearScene(scene);
    }
    this.update = function () {
        this.clearScene();
        if (this.roiSubViews[0] === undefined
            || this.roiSubViews[1] === undefined) return;
        //if (this.roiSubViews[0].getRois() !== this.roiSubViews[1].getRois()) return;   
        viewbox = this.roiSubViews[0].getViewbox().clone();
        viewbox.union(this.roiSubViews[1].getViewbox());
        //camera = new THREE.OrthographicCamera(viewbox.min.x, viewbox.max.x,
        //    viewbox.max.y, viewbox.min.y, -100, 20000);
        camera.left = viewbox.min.x;
        camera.right = viewbox.max.x;
        camera.top = viewbox.max.y;
        camera.bottom = viewbox.min.y;
        camera.updateProjectionMatrix();
        var topView = this.roiSubViews[0];
        var botView = this.roiSubViews[1];
        if (this.roiSubViews[0].viewbox.min.y < this.roiSubViews[1].viewbox.min.y) {
            topView = this.roiSubViews[1];
            botView = this.roiSubViews[0];
        }
        var rois = this.roiSubViews[0].getRois();
        for (var i = 0; i < rois.length; i++) {
            var upIdx = topView.getRoiIndex(rois[i]);
            var botIdx = botView.getRoiIndex(rois[i]);
            if (upIdx >= 0 && botIdx >= 0) {
                var upBox = topView.roiBoxLayout.boxAt(upIdx);
                var upAnchor = new THREE.Vector2(upBox.center().x, upBox.min.y);
                if (upAnchor.x < 0 || upAnchor.x > 1) continue;
                var upPixel = topView.globalPixelCoord(upAnchor);
                var botBox = botView.roiBoxLayout.boxAt(botIdx);
                var botAnchor = new THREE.Vector2(botBox.center().x, botBox.max.y);
                if (botAnchor.x < 0 || botAnchor.x > 1) continue;
                var botPixel = botView.globalPixelCoord(botAnchor);
                //this.drawCurve(upPixel, botPixel, rois[i].color);
                var topColor = topView.getRoiColor(rois[i]);
                var botColor = botView.getRoiColor(rois[i]);
                this.drawCurve(upPixel, botPixel, botColor, topColor);
            }
        }
    }

    this.render = function () {
        renderer.setViewport(viewbox.min.x, viewbox.min.y, viewbox.size().x, viewbox.size().y);
        renderer.setScissor(viewbox.min.x, viewbox.min.y, viewbox.size().x, viewbox.size().y);
        renderer.render(scene, camera);
    }

    this.drawCurve = function (start, end, startColor, endColor) {
        endColor = endColor ? endColor : startColor;
        var yRange = end.y - start.y;
        var sp = start.clone();
        sp.y += yRange / 3;
        var ep = end.clone();
        ep.y -= yRange / 3;
        var numPoints = 50;
        var curve = new THREE.CubicBezierCurve(start, sp, ep, end);
        var path = new THREE.Path(curve.getPoints(numPoints));
        var geometry = path.createPointsGeometry(numPoints);
        geometry.vertices.length -= 1;
        geometry.colors.length = geometry.vertices.length;
        function interpolateColor(c0, c1, v) {
            var w = 1 - v;
            var r = c0.r * w + c1.r * v;
            var g = c0.g * w + c1.g * v;
            var b = c0.b * w + c1.b * v;
            return new THREE.Color(r, g, b);
        }
        for (var iv = 0; iv < geometry.colors.length; iv++) {
            var color = interpolateColor(startColor, endColor, iv / (geometry.colors.length - 1));
            geometry.colors[iv] = color;
        }
        var material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            vertexColors: THREE.VertexColors
        });
        //material.color = startColor;
        var curveObject = new THREE.Line(geometry, material);
        scene.add(curveObject);
    }
}
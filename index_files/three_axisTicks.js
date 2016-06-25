
var three_axisTicks = function () {
    this.viewbox;
    this.low = 0;
    this.high = 1;
    this.valueRange = [];
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.02, 1.02, 1.02, -0.02, -100, 20000);
    this.scene.add(this.camera);
    this.logarithm = false;

    this.tickScene = new THREE.Scene();
    this.tickCamera = new THREE.OrthographicCamera(-1.04, 0, 1.02, -0.02, -100, 20000);

}

three_axisTicks.prototype.globalPixelCoord = function (geoCoord) {
    var viewboxAdj = scaleAtPoint(this.viewbox, this.viewbox.center(), 1 / 1.04);
    var gCoord = absoluteCoord(viewboxAdj, geoCoord);
    return gCoord;
}

three_axisTicks.prototype.mainLineMaterial = new THREE.LineBasicMaterial({
    color: 0x777777
});

three_axisTicks.prototype.subLineMaterial = new THREE.LineBasicMaterial({
    color: 0xcccccc
});

three_axisTicks.prototype.clearScene = function () {
    for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
        var obj = this.scene.children[i];
        if (obj !== this.camera) {
            //this.scene.remove(obj);
            destoryThreeJsObjectFromScene(this.scene, obj);
        }
    }
    for (var i = this.tickScene.children.length - 1; i >= 0 ; i--) {
        var obj = this.tickScene.children[i];
        if (obj !== this.camera) {
            //this.scene.remove(obj);
            destoryThreeJsObjectFromScene(this.tickScene, obj);
        }
    }
}
three_axisTicks.prototype.clear = function () {
    this.clearScene();
}
three_axisTicks.prototype.update = function () {
    this.clearScene();
    if (this.high == this.low) return;
    var mainLineMaterial = new THREE.LineBasicMaterial({
        color: 0x777777,

    });
    var subLineMaterial = new THREE.LineBasicMaterial({
        color: 0x777777,
        transparent: true,
        opacity: 0.4

    });
    if (this.logarithm) {
        var highEnd = Math.max(Math.abs(Math.log10(this.valueRange[1])), Math.abs(Math.log10(this.valueRange[0])));
        var magnitude = Math.ceil(highEnd);
        var nStep = magnitude;
        var heightRange = this.high - this.low;
        var base = this.low;
        if (this.high < 1) {
            base = this.high;
            heightRange *= -1;
        }


        var lastVisibleHeight = 0;
        for (var i = 0; i <= nStep; i++) {
            // add main lines
            var value = Math.pow(10, -i);
            var height = i / nStep * heightRange + base;
            var lineStart = new THREE.Vector3(0, height, -1);
            var lineEnd = new THREE.Vector3(1, height, -1);
            var lineGeo = new THREE.Geometry();
            var lineMat = mainLineMaterial;
            lineGeo.vertices.push(lineStart, lineEnd);
            var line = new THREE.Line(lineGeo, lineMat);
            this.scene.add(line);

            var pixelSize = [1.04 / this.viewbox.size().x, 1.04 / this.viewbox.size().y];
            var textMesh = genTextQuad(value.toExponential(),
                0, "10px Arial", pixelSize, 'right');
            textMesh.translateX(lineStart.x);
            textMesh.translateY(lineStart.y);
            //this.scene.add(textMesh);
            this.tickScene.add(textMesh);
            /*
            if (nStep <= 5) {
                // add sub lines
                for (var j = 1; j < 5; j++) {
                    var subHeightOfst = Math.log10(j * 2) / nStep * heightRange;
                    var subHeight = height + subHeightOfst;
                    var sublineStart = new THREE.Vector3(0, subHeight, -1);
                    var sublineEnd = new THREE.Vector3(1, subHeight, -1);
                    var sublineGeo = new THREE.Geometry();
                    var sublineMat = subLineMaterial;
                    sublineGeo.vertices.push(sublineStart, sublineEnd);
                    var subline = new THREE.Line(sublineGeo, sublineMat);
                    this.scene.add(subline);
                }
            }
            */
        }
    }
    else {
        var magnitude = Math.floor(Math.log10(this.valueRange[1] - this.valueRange[0]));
        var step = Math.pow(10, magnitude);
        var subStep = step / 5;
        var nStep = Math.round((this.valueRange[1] - this.valueRange[0]) / subStep);
        var subStepHeight = (this.high - this.low) / nStep;


        for (var i = 0; i <= nStep; i++) {
            if (i % 5 !== 0 && magnitude <= -2) continue;
            var height = this.low + subStepHeight * i;
            var material = subLineMaterial;
            // line geometry
            var lineStart = new THREE.Vector3(0, height, -1);
            var lineEnd = new THREE.Vector3(1, height, -1);
            var lineGeo = new THREE.Geometry();
            lineGeo.vertices.push(lineStart, lineEnd);
            if (i % 5 == 0) {
                material = mainLineMaterial;

                // add text using mesh
                var pixelSize = [1.04 / this.viewbox.size().x, 1.04 / this.viewbox.size().y];
                var textMesh = genTextQuad((subStep * i + this.valueRange[0]).toString().substring(0,3),
                    0, "10px Arial", pixelSize, 'right');
                textMesh.translateX(lineStart.x);
                textMesh.translateY(lineStart.y);
                textMesh.frustumCulled = false;
                //this.scene.add(textMesh);
                this.tickScene.add(textMesh);
            }
            else {
            }
            var line = new THREE.Line(lineGeo, material);
            this.scene.add(line);
        }
    }
}

three_axisTicks.prototype.renderLabels = function () {

}

three_axisTicks.prototype.render = function () {
    var offsetPixel = this.viewbox.size().x / 1.04 * 1.02;
    renderer.setViewport(this.viewbox.min.x - offsetPixel, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
    renderer.setScissor(this.viewbox.min.x - offsetPixel, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
    renderer.render(this.tickScene, this.tickCamera);
    renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
    renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
    renderer.render(this.scene, this.camera);
}
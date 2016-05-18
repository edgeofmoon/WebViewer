
var three_legend = function () {
    this.minValue = -1;
    this.maxValue = 1;
    this.numSteps = 20;
    this.title = 'T Score';

    // public access
    this.viewbox = new THREE.Box2(new THREE.Vector2(0, 0),
        new THREE.Vector2(window.innerWidth, window.innerHeight));
    this.box = new THREE.Box2(new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 1));

    //private
    this.textDivs = [];
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.02, 1.02, 1.02, -0.02, -100, 20000);

    this.update = function () {
        this.clearScene();
        var range = this.maxValue - this.minValue;
        var stepValue = range / this.numSteps;
        var geometry = new THREE.Geometry();
        var vertexColorMaterial = new THREE.MeshBasicMaterial(
            { vertexColors: THREE.VertexColors });
        var lastColor = undefined;
        var bottom = this.box.min.y;
        var top = this.box.max.y;
        for (var i = 0; i <= this.numSteps; i++) {
            //var value = stepValue * i + this.minValue;
            var value = (i - this.numSteps / 2) / (this.numSteps / 2);
            value *= (value >= 0) ? this.maxValue : -this.minValue;
            var color = three_colorTable.divergingColor(
                value, this.minValue, this.maxValue);
            var x = i / this.numSteps * this.box.size().x + this.box.min.x;
            geometry.vertices.push(new THREE.Vector3(x, bottom, 1));
            geometry.vertices.push(new THREE.Vector3(x, top, 1));

            if (i !== 0) {
                var face0 = new THREE.Face3(2 * i - 2, 2 * i, 2 * i + 1);
                face0.vertexColors[0] = lastColor;
                face0.vertexColors[1] = color;
                face0.vertexColors[2] = color;
                var face1 = new THREE.Face3(2 * i - 2, 2 * i + 1, 2 * i - 1);
                face1.vertexColors[0] = lastColor;
                face1.vertexColors[1] = color;
                face1.vertexColors[2] = lastColor;
                geometry.faces.push(face0, face1);
            }
            lastColor = color;
        }
        var renderable = new THREE.Mesh(geometry, vertexColorMaterial);
        this.scene.add(renderable);

        // text divs
        for (var i = this.textDivs.length; i < 3; i++) {
            var textDiv = document.createElement('div');
            document.body.appendChild(textDiv);
            this.textDivs.push(textDiv);
        }
        var values = [this.minValue, 0, this.maxValue];
        //var middleX = -this.box.min / range * this.box.size().x + this.box.min.x;
        var middleX = this.box.center().x;
        var xCoord = [this.box.min.x, middleX, this.box.max.x];
        for (var i = 0; i < 3; i++) {
            var gCoord = this.globalPixelCoord(new THREE.Vector2(xCoord[i], this.box.min.y));
            var valueString = values[i].toString();
            if (values[i] >= 0) {
                valueString = valueString.substring(0, 4);
            }
            else {
                valueString = valueString.substring(0, 5);
            }
            if (i === 1) valueString = this.title;
            var textLength = getTextSize(valueString, '12pt arial').x;
            gCoord.x -= textLength / 2;
            this.textDivs[i].innerHTML = valueString;
            this.textDivs[i].style.font = "12px Arial";
            this.textDivs[i].style.color = "#000";
            this.textDivs[i].style.top = window.innerHeight - gCoord.y + 'px';
            this.textDivs[i].style.left = gCoord.x + 'px';
            this.textDivs[i].style.position = 'absolute';
            this.textDivs[i].style.zIndex = 1;
            this.textDivs[i].style.backgroundColor = "transparent";
        }
    }
    this.clear = function () {
        for (var i = 0; i < this.textDivs.length; i++) {
            var textDiv = this.textDivs[i];
            document.body.removeChild(textDiv);
        }
        this.textDivs.length = 0;
        this.clearScene();
    }
    this.clearScene = function () {
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj !== this.camera) {
                destoryThreeJsObjectFromScene(this.scene, obj);
            }
        }
    }
    this.render = function () {
        renderer.render(this.scene, this.camera);
    }
    this.globalPixelCoord = function (geoCoord) {
        var viewboxAdj = scaleAtPoint(this.viewbox, this.viewbox.center(), 1 / 1.04);
        var gCoord = absoluteCoord(viewboxAdj, geoCoord);
        return gCoord;
    }
}
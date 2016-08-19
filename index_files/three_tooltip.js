
// example from http://stemkoski.github.io/Three.js/Mouse-Tooltip.html
var three_tooltip = function () {
    var sprite;
    var canvas, context, texture;
    var position, text;
    var size = [400, 400];
    var timerHandler;
    // create a canvas element
    canvas = document.createElement('canvas');
    // setting this to avoid pow of 2 warning
    canvas.width = 256;
    canvas.height = 128;
    //document.body.appendChild(canvas);
    context = canvas.getContext('2d');
    context.font = "12px Arial";
    context.fillStyle = "rgba(0,0,0,0.95)";
    context.textAlign = "left";
    context.textBaseline = "top";
    //context.fillText('Hello, world!', 0, 20);

    // canvas contents will be used for a texture
    texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        //useScreenCoordinates: true,
        //alignment: THREE.SpriteAlignment.topLeft
    });
    sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size[0], size[1], 1.0);


    this.getTooltip = function () {
        return sprite;
    }

    this.update = function () {
        if (this.text) {
            var textHeight = 12;
            var lines = this.text.split('\n');
            var width = 0;
            for (var i = 0; i < lines.length; i++) {
                var metrics = context.measureText(lines[i]);
                width = Math.max(metrics.width, width);
            }
            var height = textHeight * lines.length;
            var boarder = 5;
            var tw = 2;
            var th = 2;
            while (tw < width + boarder * 2) tw *= 2;
            while (th < height + boarder * 2) th *= 2;
            canvas.width = tw;
            canvas.height = th;
            size = [canvas.width, canvas.height];
            sprite.scale.set(size[0], size[1], 1.0);
            // !!! context.measureText will eliminate 
            // !!! the attributes previously assigned
            // !!! need to assign agian
            context.font = "12px Arial";
            context.textAlign = "left";
            context.textBaseline = "top";
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = "rgba(125,125,125,0.95)"; // 1 pixel gray border
            context.fillRect(0, 0, width + boarder * 2, height + boarder * 2);
            context.fillStyle = "rgba(255,255,255,0.95)"; // black border
            context.fillRect(1, 1, width + boarder * 2 - 2, height + boarder * 2 - 2);
            context.fillStyle = "rgba(255,255,255,0.95)"; // white filler
            context.fillRect(boarder, boarder, width, height);
            context.fillStyle = "rgba(0,0,0,1)"; // text color
            //context.fillRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < lines.length; i++) {
                context.fillText(lines[i], boarder, i * textHeight + boarder);
            }
            //canvas.innerHTML = text;
            sprite.position.set(position.x + size[0] / 2,
                position.y - size[1] / 2 + height + boarder * 2, 100);
            if (position.x + width + boarder * 2 > window.innerWidth) {
                sprite.position.x = window.innerWidth + size[0] / 2 - width - boarder * 2;
            }
            if (position.y + height + boarder * 2 > window.innerHeight) {
                sprite.position.y = window.innerHeight - size[1] / 2;
            }
            texture.dispose();
            texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            sprite.material.map = texture;

            clearTimeout(timerHandler);
            timerHandler = setTimeout(clear, 3000);
        }
        else {
            context.clearRect(0, 0, canvas.width, canvas.height);
            //texture.dispose();
            //texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            //sprite.material.map = texture;
        }
    }

    this.setPosition = function (pos) {
        position = pos;
        this.update();
    }

    function clear() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        texture.needsUpdate = true;
    }

    this.setText = function (text) {
        this.text = text;
        this.update();
    }
}

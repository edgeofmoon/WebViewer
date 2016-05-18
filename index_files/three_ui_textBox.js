
const textBox_font = '12pt arial';

var three_ui_textBox = function (panel, text, color, callback, parameter) {
    this.text = text;
    var size = [];
    this.textTexture = genTextTexture(this.text, size, 4);
    this.textCoord = [size[2], size[3]];
    var textbox = new THREE.Box2(new THREE.Vector2(0, 0), new THREE.Vector2(size[0], size[1]));
    three_ui_object.call(this, panel, textbox);
    this.callback = callback;
    this.parameter = parameter;
    this.color = color;
    this.hovered = false;

    // public
    this.div = null;

    //
    this.cursorStyle = 'move';
}

three_ui_textBox.prototype = Object.create(three_ui_object.prototype);
three_ui_textBox.prototype.constructor = three_ui_textBox;


three_ui_textBox.prototype.update = function () {
    /*
    if (this.div == null || this.div == undefined) {
        this.div = document.createElement('div');
        document.body.appendChild(this.div);
    }
    this.div.innerHTML = this.text;
    this.div.style.font = textBox_font;
    this.div.style.top = window.innerHeight - (this.box.max.y + this.panel.viewbox.min.y) + 'px';
    this.div.style.left = this.box.min.x + this.panel.viewbox.min.x + 'px';
    this.div.style.position = 'absolute';
    this.div.style.zIndex = 1;
    this.div.style.cursor = this.cursorStyle;
    var colorString = this.color.getHexString();
    colorString = '#' + colorString;
    this.div.style.color = colorString;
    //this.div.style.color = this.color.getHex();
    //this.div.style.backgroundColor = 0xffffff;
    this.div.style.backgroundColor = "transparent";
    */
    // update box
    //this.box.max.x = this.div.offsetWidth;
    //this.box.max.y = this.div.offsetHeight;
    if (this.renderable == undefined) {
        // update quad
        var quad_geo = new THREE.PlaneGeometry(this.box.size().x, this.box.size().y)
            .translate(this.box.center().x, this.box.center().y, 0.9);
        var quad_mat = new THREE.MeshBasicMaterial({
            map: three_ui_button_bkgd_tex,
            transparent: true,
            color: 0xffffff,
        });
        this.renderable = new THREE.Mesh(quad_geo, quad_mat);
        /*
        var quad_line_geo = three_makeQuadWireGeometry(this.box, 0.9);
        var quad_line_mat = new THREE.LineBasicMaterial({
            color: 0x000000
        });
        var line = new THREE.Line(quad_line_geo, quad_line_mat);
        this.renderable.add(line);
        */
        var quad_geo2 = new THREE.PlaneGeometry(this.box.size().x, this.box.size().y)
            .translate(this.box.center().x, this.box.center().y, 0.99);
        var tex_u = this.textCoord[0];
        var tex_v = this.textCoord[1];
        quad_geo2.faceVertexUvs[0][0][0].set(0, 1);
        quad_geo2.faceVertexUvs[0][0][1].set(0, 1 - tex_v);
        quad_geo2.faceVertexUvs[0][0][2].set(tex_u, 1);
        quad_geo2.faceVertexUvs[0][1][0].set(0, 1 - tex_v);
        quad_geo2.faceVertexUvs[0][1][1].set(tex_u, 1 - tex_v);
        quad_geo2.faceVertexUvs[0][1][2].set(tex_u, 1);
        quad_geo2.uvsNeedUpdate = true;
        var quad_mat2 = new THREE.MeshBasicMaterial({
            map: this.textTexture,
            transparent: true,
            color: 0xffffff,
        });
        this.renderable.add(new THREE.Mesh(quad_geo2, quad_mat2));

        /*
        var textMesh = genTextQuad(this.text);
        this.renderable.add(textMesh);
        */
    }

    if (this.hovered) {
        this.renderable.material.map = three_ui_button_bkgd_tex2;
    }
    else {
        this.renderable.material.map = three_ui_button_bkgd_tex;
    }
}

three_ui_textBox.prototype.clear = function () {
    if (this.div !== undefined) {
       // document.body.removeChild(this.div);
        this.div = undefined;
    }
    if (this.textTexture) {
        this.textTexture.dispose();
    }
}

// mouse event
three_ui_textBox.prototype.onMouseDown = function (evt) {
    if (this.eventInBox(evt)) {
        this.callback(this.parameter, evt);
    }
}
three_ui_textBox.prototype.onMouseMove = function (evt) {
    three_ui_object.prototype.onMouseMove.call(this, evt);
    if (this.eventInBox(evt)) {
        this.hovered = true;
        this.renderable.material.map = three_ui_button_bkgd_tex2;
    }
    else {
        this.hovered = false;
        this.renderable.material.map = three_ui_button_bkgd_tex;
    }

}
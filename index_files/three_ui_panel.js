
const ui_panel_position_topLeft = 1;
const ui_panel_position_topRight = 2;

var three_ui_panel = function (viewbox, position) {
    this.scene = new THREE.Scene();
    this.camera = null;
    this.viewbox = null;
    if (viewbox !== undefined) {
        this.viewbox = three_ui_panel.prototype.setFromViewbox(viewbox, position);
        this.camera = new THREE.OrthographicCamera(
            viewbox.min.x, viewbox.max.x, viewbox.max.y, viewbox.min.y, -1, 1000);
        this.scene.add(this.camera);
    }
    this.lineMaterial = new THREE.LineBasicMaterial({
        color: 0x000000
    });
    this.children = [];

    /*
    // work around 'this' issue
    var that = this;
    function mouseDown(evt) { that.onMouseDown(evt); }
    function mouseUp(evt) { that.onMouseUp(evt); }
    function mouseMove(evt) { that.onMouseMove(evt); }
    document.addEventListener('mousedown', mouseDown, false);
    document.addEventListener('mouseup', mouseUp, false);
    document.addEventListener('mousemove', mouseMove, false);
    */
}

// children object management
three_ui_panel.prototype.add = function(uiObj){
    this.children.push(uiObj);
    var interval = 5;
    var endX = interval;
    for (var i = 0; i < this.children.length - 1; i++) {
        endX += this.children[i].box.size().x + interval;
    }
    //var box = three_ui_button_defaultSizeBox.clone();
    var box = uiObj.box.clone();
    box.translate(new THREE.Vector2(endX + 1, 0 + 1));
    uiObj.box = box;
}


three_ui_panel.prototype.clear = function () {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].clear();
        //this.children[i] = undefined;
    }
    //this.children.length = 0;
}

three_ui_panel.prototype.clearScene = function () {
    for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
        var obj = this.scene.children[i];
        //this.scene.remove(obj);
        destoryThreeJsObjectFromScene(this.scene, obj);
    }
}

three_ui_panel.prototype.destory = function () {
    this.clear();
    this.clearScene();
    for (var i = this.children.length - 1; i >= 0 ; i--) {
        this.children[i].panel = undefined;
        this.children.pop();
    }
}
three_ui_panel.prototype.setFromViewbox = function (viewbox, position) {
    var interval = 5;
    var endX = interval;
    var maxY = 0;
    for (var i = 0; i < this.children.length; i++) {
        endX += this.children[i].box.size().x + interval;
        maxY = Math.max(this.children[i].box.size().y, maxY);
    }
    var panelSize = new THREE.Vector2(endX + 2, maxY + 2);
    if (this.children.length === 0) {
        panelSize.x = 0;
        panelSize.y = 0;
    }
    this.viewbox = viewbox.clone();
    if (position === ui_panel_position_topRight) {
        this.viewbox.min.subVectors(this.viewbox.max, panelSize);
    }
    else {
        this.viewbox.min.y = this.viewbox.max.y - panelSize.y;
        this.viewbox.max.addVectors(this.viewbox.min, panelSize);
    }
    this.camera = new THREE.OrthographicCamera(
       0, this.viewbox.size().x, this.viewbox.size().y, 0, -1, 1000);
}

three_ui_panel.prototype.update = function () {
    this.clearScene();
    /*
    var box = new THREE.Box2(new THREE.Vector2(1, 1),
        this.viewbox.size());
    var material = this.lineMaterial;
    var geometry = three_makeQuadWireGeometry(box);
    var line = new THREE.Line(geometry, material);
    this.scene.add(line);
    */
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].update();
        if (this.children[i].renderable instanceof THREE.Object3D) {
            this.scene.add(this.children[i].renderable);
        }
    }
}

// render function
three_ui_panel.prototype.render = function () {
    //this.update();
    renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
    renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
    renderer.render(this.scene, this.camera);
}
// mouse event
three_ui_panel.prototype.eventInBox = function (evt) {
    var coord = new THREE.Vector2(evt.clientX, window.innerHeight - evt.clientY);
    return this.viewbox.containsPoint(coord);
}
three_ui_panel.prototype.onMouseDown = function (evt) {
    if (!this.eventInBox(evt)) return;
    else {
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].eventInBox(evt)) {
                this.children[i].onMouseDown(evt);
            }
        }
    }
}
three_ui_panel.prototype.onMouseUp = function (evt) {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].onMouseUp(evt);
    }
}

three_ui_panel.prototype.onMouseMove = function (evt) {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].onMouseMove(evt);
    }
}
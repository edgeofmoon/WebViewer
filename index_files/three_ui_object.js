
var three_ui_object = function (panel, box) {
    this.panel = panel;
    this.box = box;
    this.renderable = null;

    this.tooltipText;

    if(panel.children.indexOf(this) < 0){
        panel.add(this);
    }
}

// update function
// render is handled by parent panel
three_ui_object.prototype.update = function () {
}

// destructor
three_ui_object.prototype.clear = function () {
}
three_ui_object.prototype.setTooltip = function (txt) {
    this.tooltipText = txt;
}
// mouse event
three_ui_object.prototype.eventInBox = function (evt) {
    var coord = new THREE.Vector2(evt.clientX - this.panel.viewbox.min.x,
        window.innerHeight - evt.clientY - this.panel.viewbox.min.y);
    return this.box.containsPoint(coord);
}
three_ui_object.prototype.onMouseDown = function (evt) {
}

three_ui_object.prototype.onMouseUp = function (evt) {
}

three_ui_object.prototype.onMouseMove = function (evt) {
    // update tool tip
    if (this.eventInBox(evt)) {
        var coord = eventCoord(evt);
        tooltip.setPosition(coord);
        tooltip.setText(this.tooltipText);
    }
}
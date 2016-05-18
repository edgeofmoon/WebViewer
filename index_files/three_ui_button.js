
var three_ui_button_copy_icon = null;
var three_ui_button_data_icon = null;
var three_ui_button_label_icon = null;
var three_ui_button_delt_icon = null;
var three_ui_button_drag_icon = null;
var three_ui_button_dist_icon = null;
var three_ui_button_bkgd_tex = null;
var three_ui_button_bkgd_tex2 = null;

var three_ui_button_icon_nLoad = 0;
var three_ui_button_icon_total = 8;

three_ui_button_image_loader = new THREE.TextureLoader();
three_ui_button_image_loader.load('images/copy.png', function (texture) {
    three_ui_button_copy_icon = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});
three_ui_button_image_loader.load('images/data.png', function (texture) {
    three_ui_button_data_icon = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});
three_ui_button_image_loader.load('images/label.png', function (texture) {
    three_ui_button_label_icon = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});
three_ui_button_image_loader.load('images/delete.png', function (texture) {
    three_ui_button_delt_icon = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});
three_ui_button_image_loader.load('images/drag.png', function (texture) {
    three_ui_button_drag_icon = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});
three_ui_button_image_loader.load('images/dist.png', function (texture) {
    three_ui_button_dist_icon = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});
three_ui_button_image_loader.load('images/button.png', function (texture) {
    three_ui_button_bkgd_tex = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});
three_ui_button_image_loader.load('images/button2.png', function (texture) {
    three_ui_button_bkgd_tex2 = texture;
    three_ui_button_icon_nLoad++;
    if (three_ui_button_icon_nLoad === three_ui_button_icon_total) {
        updateViewUIs();
    }
});

function updateViewUIs() {
    //if (typeof spatialView !== undefined) {
    if ("spatialView" in window) {
        spatialView.updateUI();
    }
    //if (typeof roiView !== undefined) {
    if ("roiView" in window) {
        roiView.update();
    }
}

var three_ui_button_defaultSizeBox = new THREE.Box2(new THREE.Vector2(0,0), new THREE.Vector2(20,20));
var three_ui_button = function (panel, box, texture, callback, parameter) {
    three_ui_object.call(this, panel, (box === undefined) ? three_ui_defaultSizeBox : box);
    this.callback = callback;
    this.parameter = parameter;

    this.texture = texture;
    this.hovered = false;

}

three_ui_button.prototype = Object.create(three_ui_object.prototype);
three_ui_button.prototype.constructor = three_ui_button;

// update function
// render is handled by parent panel
three_ui_button.prototype.update = function () {
    //if (this.renderable == undefined) {
        var geometry = new THREE.PlaneGeometry(this.box.size().x, this.box.size().y)
            .translate(this.box.center().x, this.box.center().y, 0.9);
        var material = new THREE.MeshBasicMaterial({
            map: this.texture,
            opacity: 0.25,
            transparent: true,
            color: 0xFFFFFF
        });
        this.renderable = new THREE.Mesh(geometry, material);
    //}
    //else {
        if (this.hovered) {
            //this.renderable.material.color.setHex(0x993333);
            this.renderable.material.opacity = 1;
        }
        else {
            //this.renderable.material.color.setHex(0xffffff);
            this.renderable.material.opacity = 0.25;
        }
    //}
}

three_ui_button.prototype.clear = function () {
    //this.material.dispose();
    //this.material = undefined;
}

// mouse event
three_ui_button.prototype.onMouseDown = function (evt) {
    if (this.eventInBox(evt)) {
        this.callback(this.parameter, evt);
    }
}
three_ui_button.prototype.onMouseMove = function (evt) {
    three_ui_object.prototype.onMouseMove.call(this, evt);
    if (this.eventInBox(evt)) {
        this.hovered = true;
        this.renderable.material.opacity = 1;
    }
    else {
        this.hovered = false;
        this.renderable.material.opacity = 0.25;
    }
    
}
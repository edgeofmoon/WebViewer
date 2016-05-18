var three_spatialView = function () {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 0.3, 0.1, 20000);
    //this.controls = new three_orbitControls(this.camera);
    this.controls = new three_trackballControl(this.camera);
    //this.controls = new THREE.TrackballControls(this.camera);
    //this.controls = new THREE.OrbitControls(this.camera);
    this.viewbox = new THREE.Box2(new THREE.Vector2(0, 0),
        new THREE.Vector2(window.innerWidth, window.innerHeight));
    this.light0 = new THREE.SpotLight(0xffffff);
    this.light1 = new THREE.SpotLight(0xffffff);
    this.cortexMeshes = [[], []];
    // axis
    var axisLength = 100;
    this.axisHelper = new THREE.AxisHelper(axisLength);

    this.labelDivs = [];
    this.labelTexts = ['right', 'anterior', 'superior'];
    this.labelColor = ['#ff0000', '#00ff00', '#0000ff'];
    this.labelCoords = [new THREE.Vector3(axisLength, 0, 0),
        new THREE.Vector3(0, axisLength, 0),
        new THREE.Vector3(0, 0, axisLength),
    ];

    // UI
    //var uiPanel;

    // parameters
    this.showLeftMesh = true;
    this.showRightMesh = true;
    this.tranparency = 0.2;
    this.showTracts = true;
    this.tractThreshold = 0.5;
    this.barWidth = 0.05;
    // UI
    var gui = new dat.GUI({ autoPlace: false });
    gui.close();
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '0px';
    gui.domElement.style.left = '0px';
    document.body.appendChild(gui.domElement);
    var scope = this;
    function updateRender() { scope.updateRendering(); };
    this.updateData = function() {
        var fileinput = document.getElementById('fileinput2');
        fileinput.click();
    };
    function updateBarWidth(){
        three_roiBoxLayout_barWidth = scope.barWidth;
        roiView.update();
    };
    var f1 = gui.addFolder("Cortex Mesh");
    f1.add(this, 'showLeftMesh').name('Left hemisphere').onFinishChange(updateRender);
    f1.add(this, 'showRightMesh').name('Right hemisphere').onFinishChange(updateRender);
    f1.add(this, 'tranparency').min(0).max(1.0).name('Transparency').onChange(updateRender);
    var f2 = gui.addFolder("Tractography Mesh");
    f2.add(this, 'showTracts').name('Display with ROI');
    f2.add(this, 'tractThreshold').min(0).max(1.0).name('Density threshold').onChange(updateRender);
    var f3 = gui.addFolder("Roi View");
    f3.add(this, 'barWidth').min(0.02).max(0.2).name('Bar Width').onChange(updateBarWidth);
    var f4 = gui.addFolder("Data");
    f4.add(this, 'updateData').name('Load Data');

    
	 $("div.dg.main")
     .mousemove(function (ev) {
         ev.preventDefault();
        // ev.stopPropagation();
     })
     .mousedown(function (ev) {
         ev.stopPropagation();
     });
    this.updateUI = function () {
        /*
        if (uiPanel !== undefined) uiPanel.destory();
        uiPanel = new three_ui_panel();
        var upButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
            three_ui_button_up_icon, buttonClickHandler, "up");
        var downButton = new three_ui_button(uiPanel, three_ui_button_defaultSizeBox.clone(),
            three_ui_button_down_icon, buttonClickHandler, "down");
        uiPanel.setFromViewbox(this.viewbox, ui_panel_position_topLeft);
        uiPanel.update();
        */
    }

    this.updateUI();

    this.updateLabels = function () {
        for (var i = this.labelDivs.length; i < 3; i++) {
            var label = document.createElement('div');
            document.body.appendChild(label);
            this.labelDivs.push(label);
            label.innerHTML = this.labelTexts[i];
            label.style.backgroundColor = "transparent";
            label.style.position = 'absolute';
            label.style.color = this.labelColor[i];
            label.style.zIndex = 1;
        }
        for (var i = 0; i < 3; i++) {
            var pixel = getProjection(this.labelCoords[i],
                this.axisHelper.matrixWorld, this.camera, this.viewbox);
            if (this.viewbox.containsPoint(pixel)) {
                this.labelDivs[i].style.top = pixel.y + 'px';
                this.labelDivs[i].style.left = pixel.x + 'px';
                this.labelDivs[i].style.display = 'block';
            }
            else {
                this.labelDivs[i].style.display = 'none';
            }
        }
        
    }
    // init 
    this.init = function () {
        // setup camera
        this.scene.add(this.camera);
        this.camera.position.set(0, 0, 400);
        this.camera.lookAt(this.scene.position);

        // setup light
        this.light0.position.set(0, 0, 300);
        this.light0.distance = 2000;
        //light.castShadow = true;
        this.scene.add(this.light0);

        this.light1.position.set(0, 0, -300);
        this.light1.distance = 2000;
        //light2.castShadow = true;
        this.scene.add(this.light1);

        // setup axis
        this.scene.add(this.axisHelper);
    }
    
    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
        this.controls.responseBox = this.viewbox;
        this.camera.aspect = viewbox.size().x / viewbox.size().y;
        this.camera.updateProjectionMatrix();
    }

    this.setViewport = function (viewport) {
        var viewbox = viewport2viewbox(viewport);
        this.setViewbox(viewbox);
    }

    // add cortex mesh
    this.addCortexMesh = function(lfn, rfh){
        three_cortexMesh(lfn, rfh, this.scene);
    }

    // add marching cubes mesh
    this.addMarchingCubesMesh = function (vol, isolevel, name) {
        var geometry = three_marchingCubes(vol, isolevel);
        var colorMaterial = new THREE.MeshLambertMaterial({
            color: 0xff00ff,
            //side: THREE.BackSide
        });
        var mesh = new THREE.Mesh(geometry, colorMaterial);
        mesh.name = name;
        //mesh.castShadow = true;
        //mesh.receiveShadow = true;
        this.scene.add(mesh);
    }
    this.updateRenderingOrder = function () {
        // move cortex mesh to the end
        var cortexMeshNames = ['lh', 'rh'];
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            for (var j = 0; j < cortexMeshNames.length; j++) {
                if (obj.name == cortexMeshNames[j]) {
                    this.scene.remove(obj);
                    this.scene.add(obj);
                }
            }
        }
    }
    this.addRoi = function(roi){
        var geometry = roi.getGeometry();
        var colorMaterial = new THREE.MeshLambertMaterial;
        renderer.sortObjects = false;
        colorMaterial.color = roi.color.clone();
        var mesh = new THREE.Mesh(geometry, colorMaterial);
        mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
        mesh.name = roi.name;
        mesh.roi = roi;
        //mesh.castShadow = true;
        //mesh.receiveShadow = true;
        this.scene.add(mesh);
        if (this.showTracts) {
            this.addRoiTractVol(roi);
        }
    }
    this.addRoiTractVol = function (roi) {
        // adding tract mesh
        var scope = this;
        function makeTractVolMesh(vol) {
            var geometry = three_marchingCubes(vol, scope.tractThreshold);
            var colorMaterial = new THREE.MeshLambertMaterial;
            colorMaterial.color = roi.color.clone();
            colorMaterial.transparent = true;
            colorMaterial.opacity = 0.5;
            //colorMaterial.side = THREE.DoubleSide;
            //colorMaterial.depthWrite = false;
            var mesh = new THREE.Mesh(geometry, colorMaterial);
            mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 1);
            mesh.name = roi.name+"_tract";
            mesh.roi = roi;
            scope.scene.add(mesh);
            scope.updateRenderingOrder();

            // progress bar
            app.callbackFinish();
        };
        three_dataLoader.buildTractVol(roi.maskValues, makeTractVolMesh);
    }

    this.removeMeshByName = function(name){
        var selectedObject = this.scene.getObjectByName(name);
        this.scene.remove( selectedObject );
    }
    this.removeObject = function (object) {
        this.scene.remove(object);
    }

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.mousei = new THREE.Vector2();
    this.selectedObj = undefined;
    // update picking
    this.updatePicking = function () {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.selectedObj = undefined;
        // reset obj color
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj.roi !== undefined) {
                //obj.material.color.set(0xff00ff);
                obj.material.color.set(obj.roi.color.clone());

            }
        }
        // calculate objects intersecting the picking ray
        var intersects = this.raycaster.intersectObjects(this.scene.children);
        for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.roi !== undefined) {
                intersects[i].object.material.color.set(0xff0000);
                // only checks the nearest object
                this.selectedObj = intersects[i].object;
                break;
            }

        }
    }
    this.updateRendering = function () {
        // update rendering
        var cortexMeshNames = ['lh', 'rh'];
        var cortexMeshInScene = [false, false];
        var cortexMeshShow = [this.showLeftMesh && this.tranparency < 0.99,
            this.showRightMesh && this.tranparency < 0.99];
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            for (var j = 0; j < cortexMeshNames.length; j++) {
                if (obj.name == cortexMeshNames[j]) {
                    if (!cortexMeshShow[j]) {
                        this.scene.remove(obj);
                        if (this.cortexMeshes[j].indexOf(obj) < 0) {
                            this.cortexMeshes[j].push(obj);
                        }
                    }
                    cortexMeshInScene[j] = true;
                }
            }
        }
        for (var j = 0; j < cortexMeshNames.length; j++) {
            if (cortexMeshShow[j] && !cortexMeshInScene[j]) {
                for (var i = 0; i < this.cortexMeshes[j].length; i++) {
                    this.scene.add(this.cortexMeshes[j][i]);
                }
            }
        }
        for (var i = scope.scene.children.length - 1; i >= 0 ; i--) {
            var obj = scope.scene.children[i];
            if (obj instanceof THREE.Mesh) {
                if (obj.material instanceof THREE.ShaderMaterial) {
                    obj.material.uniforms.transExp.value = this.tranparency * 30;
                }
            }
            if (obj.name.endsWith("_tract")) {
                obj.material.opacity = this.tractThreshold;
            }
        }
    }
    this.update = function () {
        //uiPanel.update();
    }
    // render function
    this.render = function () {
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);

        renderer.clear();
        this.updateLabels();
        renderer.render(this.scene, this.camera);
        // render UI
        renderer.clearDepth();
        //uiPanel.render();
    }

    function onMouseMove(event) {
        //uiPanel.onMouseMove(event);

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        if (scope.eventInBox(event)) {
            scope.mouse.x = (event.clientX / scope.viewbox.size().x) * 2 - 1;
            scope.mouse.y = -(event.clientY / scope.viewbox.size().y) * 2 + 1;
            scope.mousei.x = event.clientX;
            scope.mousei.y = window.innerHeight-event.clientY;
            scope.updatePicking();

            // tooltip update
            if (scope.selectedObj) {
                tooltip.setPosition(scope.mousei);
                tooltip.setText(scope.selectedObj.name+'\n(Click to remove)');
            }
        }
    }
    function onMouseDown(event) {
        if (event.button !== 0) return;
        //if (uiPanel.eventInBox(event)) {
        //    uiPanel.onMouseDown(event);
        //    return;
        //}
        if (scope.selectedObj !== undefined) {
            scope.scene.remove(scope.selectedObj);
        }
        roiView.update();
    }
    function buttonClickHandler(arg, event) {
        if (arg === 'up') {
            for (var i = scope.scene.children.length - 1; i >= 0 ; i--) {
                var obj = scope.scene.children[i];
                if (obj instanceof THREE.Mesh) {
                    if (obj.material instanceof THREE.ShaderMaterial) {
                        obj.material.uniforms.transExp.value *= 1.2;
                    }
                }
            }
        }
        else if (arg === 'down') {
            for (var i = scope.scene.children.length - 1; i >= 0 ; i--) {
                var obj = scope.scene.children[i];
                if (obj instanceof THREE.Mesh) {
                    if (obj.material instanceof THREE.ShaderMaterial) {
                        obj.material.uniforms.transExp.value /= 1.2;
                    }
                }
            }
        }
    }
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
}


three_spatialView.prototype.eventInBox = function (evt) {
    var coord = new THREE.Vector2(evt.clientX, window.innerHeight - evt.clientY);
    return this.viewbox.containsPoint(coord);
}
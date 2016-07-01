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
    this.roiMesh = new Map();
    this.roiLoading = new Map();

    // axis
    var axisLength = 100;
    this.axisHelper = new THREE.AxisHelper(axisLength);

    this.labelDivs = [];
    this.labelTexts = ['Right', 'Anterior', 'Superior'];
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
    this.showAxis = true;
    this.showBoundary = false;
    this.tranparency = 0.2;
    this.autoVerticesSort = false;
    this.showTracts = false;
    this.tractThreshold = 0.5;
    this.globalNormalization = true;
    this.stackerView = false;
    this.roiLinks = true;
    this.inplaceCharts = true;
    // UI
    var gui = new dat.GUI({ autoPlace: false });
    gui.close();
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '0px';
    var guiLeft = window.innerWidth * 0.15;
    gui.domElement.style.left = guiLeft+'px';
    document.body.appendChild(gui.domElement);
    var scope = this;
    function updateRender() { scope.updateRendering(); };
    function updateNormalization() {
        roiView.update();
    };
    function sortVertices() {
        scope.sortMeshVertices();
        scope.sortMeshes();
    }
    function updateStacker() {
        if (scope.stackerView) {
            statsStackerView.viewbox = roiView.viewbox;
            statsStackerView.cohortCompDatasets.length = 0;
            for (var i = 0; i < roiView.subViews.length; i++) {
                var cohortCompData = roiView.subViews[i].cohortCompData;
                statsStackerView.cohortCompDatasets.push(cohortCompData);
            }
            statsStackerView.update();
            statsStackerView.enable();
            roiView.disable();
        }
        else {
            statsStackerView.disable();
            roiView.enable();
        }
    }
    this.updateData = function() {
        var fileinput = document.getElementById('fileinput2');
        fileinput.click();
    };
    this.resetCamera = function () {
        this.camera.position.set(0, 0, 340);
        this.camera.lookAt(this.scene.position);
        this.camera.up.set(0, 1, 0);
    }
    this.sortMeshVertices = function () {
        if (!this.autoVerticesSort) return;
        var cortexMeshNames = ['lh', 'rh'];
        var matrix = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse);
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj instanceof THREE.Mesh) {
                if (obj.roi) {
                    if (obj.roi.type == "cortical") {
                        sortObjectFacesByDepths(obj, matrix);
                    }
                }
                else if (obj.name == cortexMeshNames[0] || obj.name == cortexMeshNames[1]) {
                    sortObjectFacesByDepths(obj, matrix);
                }
            }
        }
    }
    this.sortMeshes = function () {
        var cortexMeshNames = ['lh', 'rh'];
        var matrix = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse);
        var corticalRoiMeshes = [];
        var cortexMeshes = [];
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            if (obj instanceof THREE.Mesh) {
                if (obj.roi) {
                    if (obj.roi.type == "cortical") {
                        corticalRoiMeshes.push(obj);
                        this.scene.remove(obj);
                    }
                }
                else if (obj.name == cortexMeshNames[0] || obj.name == cortexMeshNames[1]) {
                    cortexMeshes.push(obj);
                    this.scene.remove(obj);
                }
            }
        }
        sortObjectsByDepth(corticalRoiMeshes, matrix);
        sortObjectsByDepth(cortexMeshes, matrix);
        for (var i in corticalRoiMeshes) this.scene.add(corticalRoiMeshes[i]);
        for (var i in cortexMeshes) this.scene.add(cortexMeshes[i]);
    }
    var f1 = gui.addFolder("Cortex Mesh");
    f1.add(this, 'showLeftMesh').name('Left hemisphere').onFinishChange(updateRender);
    f1.add(this, 'showRightMesh').name('Right hemisphere').onFinishChange(updateRender);
    f1.add(this, 'showAxis').name('Show axis').onFinishChange(toggleAxis);
    f1.add(this, 'showBoundary').name('Show boundary');
    f1.add(this, 'tranparency').min(0).max(1.0).name('Transparency').onChange(updateRender);
    f1.add(this, 'autoVerticesSort').name('AutoVerticesSort').onChange(sortVertices);
    f1.add(this, 'inplaceCharts').name('In place charts');
    var f2 = gui.addFolder("Tractography Mesh");
    f2.add(this, 'showTracts').name('Display with ROI');
    f2.add(this, 'tractThreshold').min(0).max(1.0).name('Density threshold').onChange(updateRender);
    f2.add(this, 'globalNormalization').name('Global normalization').onChange(updateNormalization);
    f2.add(this, 'stackerView').name('Stacker view').onChange(updateStacker);
    f2.add(this, 'roiLinks').name('Show links');
    var f3 = gui.addFolder("Camera");
    f3.add(this, 'resetCamera').name('Reset Camera');
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
    function toggleAxis() {
        if (scope.showAxis) {
            scope.scene.add(scope.axisHelper);
        }
        else{
            scope.scene.remove(scope.axisHelper);
        }
    }
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
        if (!this.showAxis) {
            for (var i = 0; i < 3; i++) {
                this.labelDivs[i].style.display = 'none';
            }
        }
    }
    // init 
    this.init = function () {
        // setup camera
        this.resetCamera();

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
        var guiLeft = window.innerWidth * 0.15;
        gui.domElement.style.left = guiLeft + 'px';
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
        var objs = [0,0];
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            for (var j = 0; j < cortexMeshNames.length; j++) {
                if (obj.name == cortexMeshNames[j]) {
                    this.scene.remove(obj);
                    objs[j] = obj;
                }
            }
        }
        for (var j = 0; j < cortexMeshNames.length; j++) {
            if (objs[i] !== 0) {
                this.scene.add(objs[0]);
                this.scene.add(objs[1]);
            }
        }
    }
    this.getRoiMesh = function(roi){
        return this.roiMesh.get(roi);
    }
    this.isRoiSelected = function (roi) {
        if (this.selectedObj == undefined) return false;
        return this.selectedObj === roi;
    }
    this.isRoiLoading = function (roi) {
        return this.roiLoading.has(roi);
    }
    this.addMeshByFileNames = function (fns, meshName, color) {
        var loaders = [];
        var renderable;
        var numToLoader = fns.length;
        for (var i = 0; i < fns.length; i++) {
            var fn = fns[i];
            var loader;
            var extension_lfn = fn.split('.').pop();
            if (extension_lfn == 'obj') {
                loader = new THREE.OBJLoader();
            }
            else if (extension_lfn == 'stl') {
                loader = new THREE.STLLoader();
            }
            else {
                alert('Unknown mesh format!');
                numToLoader--;
                continue;
            }
            loaders.push(loader);
            var scope = this;
            loader.load(fn, function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        var unpackedGeometry = new THREE.Geometry().fromBufferGeometry(child.geometry);
                        child.geometry.dispose();
                        child.geometry = unpackedGeometry;
                        child.geometry.mergeVertices();
                        child.geometry.computeFaceNormals();
                        child.geometry.computeVertexNormals();
                        child.material.effectColor = color.clone();
                        child.material.color = color.clone();
                        if (renderable === undefined) {
                            renderable = child;
                        }
                        else {
                            //renderable.add(child);
                            renderable.geometry.merge(child.geometry, child.matrix);
                            child.geometry.dispose();
                            renderable.geometry.verticesNeedUpdate = true;
                        }
                        //callback(child);
                        numToLoader--;
                        if (numToLoader == 0) {
                            renderable.name = meshName;
                            renderable.roi = 0;
                            scope.scene.add(renderable);
                        }
                    }
                });
            });
        }
    }
    this.removeRoi = function (roi) {
        if (this.roiMesh.has(roi)) {
            var object = this.roiMesh.get(roi);
            this.roiMesh.delete(roi);
            destoryThreeJsObjectFromScene(spatialView.scene, object);
        }
    }
    this.addRoi = function (roi, color) {
        if (this.roiMesh.get(roi)) return;
        if (this.isRoiLoading(roi)) return;
        scope = this;
        this.roiLoading.set(roi, 1);
        roi.computeGeometry(function callBack(geometry) {
            //var geometry = roi.getGeometry();
            if (geometry.boundingBox  == undefined) {
                geometry.computeBoundingBox();
            }
            var colorMaterial = new THREE.MeshLambertMaterial;
            colorMaterial.side = THREE.DoubleSide;
            renderer.sortObjects = false;
            if (color == undefined) {
                colorMaterial.color = roi.color.clone();
            }
            else {
                colorMaterial.color = color.clone();
                colorMaterial.effectColor = color.clone();
            }
            var mesh = new THREE.Mesh(geometry, colorMaterial);
            if (roi.type == 'cortical') {
                colorMaterial.transparent = true;
                colorMaterial.opacity = 1-scope.corticalTranparency;
                if (geometry instanceof THREE.BufferGeometry) {
                    var unpackedGeometry = new THREE.Geometry().fromBufferGeometry(geometry);
                    unpackedGeometry.mergeVertices();
                    mesh.geometry = unpackedGeometry;
                }
                if (scope.showBoundary) {
                    var lineSegmentGeometry = makeBoundaryLineSegmentsGeometry(mesh.geometry.vertices, mesh.geometry.faces);
                    var lineMaterial = new THREE.LineBasicMaterial({
                        color: 0xff0000
                    });
                    lineMaterial.color = roi.color.clone();
                    var lineSegments = new THREE.LineSegments(lineSegmentGeometry, lineMaterial);
                    mesh.add(lineSegments);
                }
            }
            // rotate mesh from vol file
            if (roi.vol !== undefined) {
                mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
            }
            mesh.name = roi.name;
            mesh.roi = roi;

            // wire frame
            //var helper = new THREE.WireframeHelper(mesh);
            //helper.material.color.set(0x0000ff);
            //scope.scene.add(helper);

            scope.scene.add(mesh);
            scope.roiLoading.delete(roi);
            scope.roiMesh.set(roi, mesh);
            scope.updateRendering();
            //scope.updateRenderingOrder();
        });

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
                //obj.material.color.set(obj.roi.color.clone());
                if (obj.material.effectColor) {
                    obj.material.color.set(obj.material.effectColor.clone());
                }
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
        var cortexMeshShow = [this.showLeftMesh && this.tranparency < 0.99,
            this.showRightMesh && this.tranparency < 0.99];
        for (var i = this.scene.children.length - 1; i >= 0 ; i--) {
            var obj = this.scene.children[i];
            for (var j = 0; j < cortexMeshNames.length; j++) {
                if (obj.name == cortexMeshNames[j]) {
                    this.scene.remove(obj);
                    if (this.cortexMeshes[j].indexOf(obj) < 0) {
                        this.cortexMeshes[j].push(obj);
                    }
                }
            }
        }
        for (var j = 0; j < cortexMeshNames.length; j++) {
            if (cortexMeshShow[j]) {
                for (var i = this.cortexMeshes[j].length - 1; i >= 0; i--) {
                    this.scene.add(this.cortexMeshes[j][i]);
                    this.cortexMeshes[j].splice(i, 1);
                }
            }
        }

        for (var i = scope.scene.children.length - 1; i >= 0 ; i--) {
            var obj = scope.scene.children[i];
            if (obj instanceof THREE.Mesh) {
                if (obj.material instanceof THREE.ShaderMaterial) {
                    obj.material.uniforms.transExp.value = this.tranparency * 30;
                }
                else {
                    obj.material.opacity = 1-this.tranparency;
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
        //renderer.clearDepth();
        //uiPanel.render();
    }

    // only unmoved mouse click, i.e. not drag
    // removes meshes
    var moved = false;
    function onMouseMove(event) {
        //uiPanel.onMouseMove(event);

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        if (scope.eventInBox(event)) {
            scope.mouse.x = ((event.clientX - scope.viewbox.min.x) / scope.viewbox.size().x) * 2 - 1;
            scope.mouse.y = -((event.clientY - scope.viewbox.min.y) / scope.viewbox.size().y) * 2 + 1;
            scope.mousei.x = event.clientX;
            scope.mousei.y = window.innerHeight-event.clientY;
            scope.updatePicking();

            // tooltip update
            if (scope.selectedObj) {
                tooltip.setPosition(scope.mousei);
                tooltip.setText(scope.selectedObj.name+'\n(Click to remove)');
            }
            moved = true;
        }
    }
    function onMouseDown(event) {
        if (event.button !== 0) return;
        if (!scope.eventInBox(event)) return;
        moved = false;
        window.addEventListener('mouseup', onMouseUp, false);
    }
    function onMouseUp(event) {
        window.removeEventListener('mouseup', onMouseUp, false);
        if (event.button !== 0) return;
        //if (!scope.eventInBox(event)) return;
        if (scope.selectedObj !== undefined && !moved) {
            //scope.scene.remove(scope.selectedObj);
            if (scope.selectedObj.roi) {
                scope.removeRoi(scope.selectedObj.roi);
                scope.scene.remove(scope.selectedObj);
            }
            else {
                // for compatability
                scope.scene.remove(scope.selectedObj);
            }
            roiView.update();
        }
        if (moved) {
            sortVertices();
            moved = false;
        }
    }
    function onMouseWheel(){
            //scope.sortMeshVertices();
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
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousewheel', onMouseWheel, false);
}


three_spatialView.prototype.eventInBox = function (evt) {
    var coord = new THREE.Vector2(evt.clientX, window.innerHeight - evt.clientY);
    return this.viewbox.containsPoint(coord);
}
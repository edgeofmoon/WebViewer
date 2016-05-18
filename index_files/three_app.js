
var three_app = function (renderer) {
    viewManager = new three_viewManager();
    //stats = new Stats();

    spatialView = new three_spatialView();
    roiView = new three_roiView();
    //roiView.addDummySubView();
    globalRois = null;

    // tooltip
    tooltip = new three_tooltip();
    var scene = new THREE.Scene();
    scene.add(tooltip.getTooltip());
    var camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -100, 20000);

    // progress bar related
    var progressbarbar = document.getElementById('bar');
    var progressbarPrg = document.getElementById('progress');


    loadRoiSpec('data/JHU-WhiteMatter-labels-1mm.nii', 'data/roiSpec3.txt', function (rois) {
        globalRois = rois;
        loadPreviewCVSData('data/Table-3.csv');
        loadPreviewCVSData('data/Table-4.csv');
    });

    document.getElementById('fileinput').addEventListener('change', three_dataLoader.loadRoisFileEventHandler, false);
    document.getElementById('fileinput1').addEventListener('change', three_dataLoader.loadLabelFileEventHandler, false);
    document.getElementById('fileinput2').addEventListener('change', three_dataLoader.loadCSVDatahandler, false);
    document.getElementById('directoryinput').addEventListener('change', three_dataLoader.loadCohortEventHandler, false);
    document.getElementById('directoryinput1').addEventListener('change', three_dataLoader.loadCohortEventHandler1, false);

    this.callbackProgress = function (progress) {
        console.log("Progress: " + progress);
        var bar = Math.floor(progress * 250);
        progressbarbar.style.width = bar + "px";
        progressbarbar.style.display = "block";
        progressbarPrg.style.display = "block";
    };

    this.callbackFinish = function () {
        progressbarbar.style.display = "none";
        progressbarPrg.style.display = "none";
    };

    this.render = function () {
        renderer.clear();
        spatialView.render();
        roiView.render();

        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
    }
    this.update = function () {
        spatialView.controls.update();
    }
    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        viewManager.setViewbox(new THREE.Box2(new THREE.Vector2(0, 0),
            new THREE.Vector2(window.innerWidth, window.innerHeight)));
        viewManager.update();
        spatialView.setViewbox(viewManager.getViewbox(0));
        roiView.setViewbox(viewManager.getViewbox(1));
        camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -100, 20000);
    };
    this.init = function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        //renderer.setClearColor(0xccccff, 1);
        renderer.setClearColor(0xfefefe, 1);
        //renderer.setClearColor(0x000000, 1);
        renderer.enableScissorTest(true);
        renderer.autoClear = false;
        var container = document.createElement('div');
        document.body.appendChild(container);
        container.appendChild(renderer.domElement);
        /*
        var menus = new three_menus();
        $(renderer.domElement).contextMenu(menus.roiMenu, {
            triggerOn: 'contextmenu'
        });
        window.onclick = function () {
            $(renderer.domElement).contextMenu('close');
        }
        // STATS
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        stats.domElement.style.zIndex = 100;
        container.appendChild(stats.domElement);
        */
        window.onresize = resize;
        spatialView.init();
        spatialView.setViewport([0, 0, window.innerWidth, window.innerHeight]);
        spatialView.addCortexMesh("data/lh.pial.obj", "data/rh.pial.obj");
        //spatialView.addCortexMesh("data/lh.orig.obj", "data/rh.orig.obj");
        //spatialView.addMarchingCubesMesh(vol, 0.4);

        /*
        // tmp sol
        function pad(num, size) {
            var s = num+"";
            while (s.length < size) s = "0" + s;
            return s;
        }
        var loader = new THREE.OBJLoader();
        var prefix = 'data/roi_obj/lh.white_roi.';
        for (var i = 1; i <= 36; i++) {
            var lfn = prefix + pad(i, 4) + '.obj';
            loader.load(lfn, function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        //child.material = cortexMaterial;
                        //child.material = THREE.MeshLambertMaterial();
                        child.material.color = three_colorTable.categoricalColor(Math.floor(Math.random() * 9999)),
                        child.material.transparent = true;
                        child.material.opacity = 0.5;
                        //child.geometry.mergeVertices();
                        child.geometry.computeFaceNormals();
                        child.geometry.computeVertexNormals();
                        child.name = 'white_lh';
                        spatialView.scene.add(child);
                    }
                });
            });
        }
        prefix = 'data/roi_obj/rh.white_roi.';
        for (var i = 1; i <= 35; i++) {
            var lfn = prefix + pad(i, 4) + '.obj';
            loader.load(lfn, function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        //child.material = cortexMaterial;
                        //child.material = THREE.MeshLambertMaterial();
                        child.material.color = three_colorTable.categoricalColor(Math.floor(Math.random() * 9999)),
                        //child.geometry.mergeVertices();
                        child.material.transparent = true;
                        child.material.opacity = 0.5;
                        child.geometry.computeFaceNormals();
                        child.geometry.computeVertexNormals();
                        child.name = 'white_lh';
                        spatialView.scene.add(child);
                    }
                });
            });
        }
        */
        roiView.init();

        resize();
    }
}
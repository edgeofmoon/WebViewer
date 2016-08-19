
var three_app = function (renderer) {
    viewManager = new three_viewManager();
    //stats = new Stats();

    spatialView = new three_spatialView();
    roiView = new three_roiView();
    imgView = new three_imageView();
    //imgView.disable();
    //statsStackerView = new three_roiStatsStacker();
    statsStackerView = new three_statsRiver();
    statsStackerView.disable();
    barLenses = [];
    inplaceCharts = new three_inplaceCharts();
    inplaceCharts.disable();

    //roiView.addDummySubView();
    globalRois = [];

    // tooltip
    tooltip = new three_tooltip();
    var scene = new THREE.Scene();
    scene.add(tooltip.getTooltip());
    var camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -100, 20000);

    // progress bar related
    var progressbarbar = document.getElementById('bar');
    var progressbarPrg = document.getElementById('progress');


    loadRoiSpec('data/JHU-WhiteMatter-labels-1mm.nii', 'data/roiSpec3.txt', function (rois) {
        var allrois = globalRois.concat(rois);
        globalRois = allrois;
        //loadPreviewCVSData('data/csv/Table-3.csv');
        //loadPreviewCVSData('data/csv/Table-4.csv');
        //loadPreviewCVSData('data/csv/meta.csv');
        //loadPreviewCVSData('data/csv/turner.csv');
        //loadPreviewCVSData('data/csv/TLE_vs_CONS.csv');
        //loadPreviewCVSData('data/csv/AL.csv');
    });


    loadMeshRoiSpecs('data/subcorticalFiles.txt', 'data/subcorticalSpecs.txt', function (rois) {
        var allrois = globalRois.concat(rois);
        globalRois = allrois;
        //adPreviewCVSData('data/csv/ALLEPI_v_CONS_cortical.csv');
        //loadPreviewCVSData('data/csv/GGE_v_CONS_cortical.csv');
        //loadPreviewCVSData('data/csv/MTLE-L_vs_CONS_cortical.csv');
        //loadPreviewCVSData('data/csv/MTLE-R_vs_CONS_cortical.csv');

        loadPreviewCVSData('data/csv/ALLEPI_v_CONS_subcortical.csv');
        loadPreviewCVSData('data/csv/GGE_v_CONS_subcortical.csv');
        loadPreviewCVSData('data/csv/MTLE-L_vs_CONS_subcortical.csv');
        loadPreviewCVSData('data/csv/MTLE-R_vs_CONS_subcortical.csv');
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
        //renderer.setClearColor(0x000000, 1);
        renderer.clear();
        imgView.render();
        spatialView.render();
        if (spatialView.stackerView) {
            statsStackerView.render();
        }
        else roiView.render();

        //for (var i = 0; i < barLenses.length; i++) {
        //    barLenses[i].render();
        //}
        inplaceCharts.render();
        viewManager.render();

        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
    }
    this.update = function () {

    }
    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        viewManager.setViewbox(new THREE.Box2(new THREE.Vector2(0, 0),
            new THREE.Vector2(window.innerWidth, window.innerHeight)));
        viewManager.update();
        imgView.setViewbox(viewManager.getViewbox(0));
        spatialView.setViewbox(viewManager.getViewbox(1));
        roiView.setViewbox(viewManager.getViewbox(2));
        statsStackerView.setViewbox(viewManager.getViewbox(2));
        inplaceCharts.setViewbox(viewManager.getViewbox(1));
        camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -100, 20000);
    };
    this.resize = function () {
        resize();
    }
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
        //spatialView.addCortexMesh("data/lh.pial.obj", "data/rh.pial.obj");
        //spatialView.addCortexMesh("data/lh.trans.pial.obj", "data/rh.pial.obj");
        spatialView.addCortexMesh("data/lh.trans.normal.pial.obj", "data/rh.trans.normal.pial.obj");
        //spatialView.addCortexMesh("data/lh.pial.obj", "data/rh.pial.obj");
        //spatialView.addCortexMesh("data/lh.orig.obj", "data/rh.orig.obj");
        //spatialView.addMarchingCubesMesh(vol, 0.4);
        
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Maccumb_Oct10_1_manhattan.png", "accumbens", new THREE.Color("rgb(78,238,148)"));
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Maccumb_Oct10_1_qq.png", "accumbens", new THREE.Color("rgb(78,238,148)"));

        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mamyg_Oct10_1_manhattan.png", "amygdala", new THREE.Color("rgb(142,229,238)"));
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mamyg_Oct10_1_qq.png", "amygdala", new THREE.Color("rgb(142,229,238)"));

        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mcaud_Oct10_1_manhattan.png", "caudate", new THREE.Color("rgb(184,134,11)"));
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mcaud_Oct10_1_qq.png", "caudate", new THREE.Color("rgb(184,134,11)"));

        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mhippo_Oct10_1_manhattan.png", "hippocampus", new THREE.Color("rgb(204,204,204)"));
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mhippo_Oct10_1_qq.png", "hippocampus", new THREE.Color("rgb(204,204,204)"));

        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mpal_Oct10_1_manhattan.png", "pallidum", new THREE.Color("rgb(255,174,185)"));
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mpal_Oct10_1_qq.png", "pallidum", new THREE.Color("rgb(255,174,185)"));

        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mput_Oct10_1_manhattan.png", "putamen", new THREE.Color("rgb(204,102,255)"));
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mput_Oct10_1_qq.png", "putamen", new THREE.Color("rgb(204,102,255)"));

        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mthal_Oct10_1_manhattan.png", "thalamus", new THREE.Color("rgb(255,0,0)"));
        imgView.addImage("data/statsImages/COMBINED_SE_DGC_Mthal_Oct10_1_qq.png", "thalamus", new THREE.Color("rgb(255,0,0)"));
        
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
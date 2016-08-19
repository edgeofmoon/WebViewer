
subcorticalNames = ["3rd-Ventricle",
"4th-Ventricle",
"Brain-Stem",
"CC_Anterior",
"CC_Central",
"CC_Mid_Anterior",
"CC_Mid_Posterior",
"CC_Posterior",
"Left-Accumbens-area",
"Left-Amygdala",
"Left-Caudate",
"Left-Cerebellum-Cortex",
"Left-Cerebellum-White-Matter",
"Left-Hippocampus",
"Left-Inf-Lat-Vent",
"Left-Lateral-Ventricle",
"Left-Pallidum",
"Left-Putamen",
"Left-Thalamus-Proper",
"Left-VentralDC",
"Right-Accumbens-area",
"Right-Amygdala",
"Right-Caudate",
"Right-Cerebellum-Cortex",
"Right-Cerebellum-White-Matter",
"Right-Hippocampus",
"Right-Inf-Lat-Vent",
"Right-Lateral-Ventricle",
"Right-Pallidum",
"Right-Putamen",
"Right-Thalamus-Proper",
"Right-VentralDC",
];

var three_imageView = function () {
    this.viewbox = new THREE.Box2(new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 1));
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(0, 1, 1, 0, -100, 20000);
    var imgObjs = [];
    var totalHeight = 0;
    var curIndex = 0;
    this.enabled = true;
    // functions
    var scope = this;
    this.setViewbox = function (viewbox) {
        if (viewbox.size().x >= 5 && viewbox.size().y >= 5) {
            this.viewbox = viewbox;
            this.enable();
            this.updateLayout();
        }
        else {
            this.disable();
        }
    }
    this.addImage = function (imgName, roiName, color) {
        var loader = new THREE.TextureLoader();
        var thisIndex = curIndex++;
        loader.load(imgName, function (tex) {
            var geometry = new THREE.PlaneGeometry(1,1)
                .translate(0.5, 0.5, 0.9);
            geometry.dynamic = true;
            var material = new THREE.MeshBasicMaterial({
                map: tex,
                color: 0xFFFFFF
            });
            var imageObj = new THREE.Mesh(geometry, material);
            imageObj.roiName = roiName;
            imageObj.mainColor = color;
            imageObj.index = thisIndex;
            imgObjs.push(imageObj);
            scene.add(imageObj);
            if (this.enabled) {
                scope.updateLayout();
            }
        });
    }
    this.updateLayout = function () {
        var aspect = this.viewbox.size().x / this.viewbox.size().y;
        camera.top = 0;
        camera.bottom = -1 / aspect;
        camera.updateProjectionMatrix();
        totalHeight = 0;
        function sortImages(img0, img1) {
            return img0.index - img1.index;
        }
        imgObjs.sort(sortImages);
        /*
        for (var i = 0; i < imgObjs.length; i++) {
            var imgObj = imgObjs[i];
            var texWidth = imgObj.material.map.image.width;
            var texHeight = imgObj.material.map.image.height;
            var texAspect = texWidth / texHeight;
            var objHeight = 1 / texAspect;
            imgObj.geometry.vertices[0].set(0, -totalHeight, 0.9);
            imgObj.geometry.vertices[1].set(1, -totalHeight, 0.9);
            imgObj.geometry.vertices[2].set(0, -totalHeight - objHeight, 0.9);
            imgObj.geometry.vertices[3].set(1, -totalHeight - objHeight, 0.9);
            imgObj.geometry.verticesNeedUpdate = true;
            totalHeight += objHeight;
        }
        */
        for (var i = 0; i < imgObjs.length / 2; i++) {
            var imgObj0 = imgObjs[2*i];
            var texWidth0 = imgObj0.material.map.image.width;
            var texHeight0 = imgObj0.material.map.image.height;
            var texAspect0 = texWidth0 / texHeight0;
            var objHeight0 = 0.5 / texAspect0;
            var objHeight = objHeight0;

            if (2 * i + 1 < imgObjs.length) {
                var imgObj1 = imgObjs[2 * i + 1];
                var texWidth1 = imgObj1.material.map.image.width;
                var texHeight1 = imgObj1.material.map.image.height;
                var texAspect1 = texWidth1 / texHeight1;
                var objHeight1 = 0.5 / texAspect1;
                objHeight = Math.max(objHeight0, objHeight1);
            }

            imgObj0.geometry.vertices[0].set(0, -totalHeight, 0.9);
            imgObj0.geometry.vertices[1].set(0.5, -totalHeight, 0.9);
            imgObj0.geometry.vertices[2].set(0, -totalHeight - objHeight, 0.9);
            imgObj0.geometry.vertices[3].set(0.5, -totalHeight - objHeight, 0.9);
            imgObj0.geometry.verticesNeedUpdate = true;
            imgObj0.geometry.computeBoundingSphere();
            if (2 * i + 1 < imgObjs.length) {
                imgObj1.geometry.vertices[0].set(0.5, -totalHeight, 0.9);
                imgObj1.geometry.vertices[1].set(1, -totalHeight, 0.9);
                imgObj1.geometry.vertices[2].set(0.5, -totalHeight - objHeight, 0.9);
                imgObj1.geometry.vertices[3].set(1, -totalHeight - objHeight, 0.9);
                imgObj1.geometry.verticesNeedUpdate = true;
                imgObj1.geometry.computeBoundingSphere();
            }

            totalHeight += objHeight;
        }
    }
    this.render = function () {
        if (!this.enabled) return;
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);

        renderer.render(scene, camera);
    }

    this.addRoiByName = function (roiName, color) {
        var roiFullNames = [];
        for (var i = 0; i < subcorticalNames.length; i++) {
            var namei = subcorticalNames[i];
            var roiNameCaptFirst = roiName.charAt(0).toUpperCase() + roiName.slice(1);
            if (namei.indexOf(roiNameCaptFirst) >= 0) {
                roiFullNames.push(namei);
            }
        }
        var roiFullNamePaths = [];
        for (var i = 0; i < roiFullNames.length; i++) {
            var roiFullNamePath = "data/subcortical_trans/" + roiFullNames[i] + '_trans.obj';
            roiFullNamePaths.push(roiFullNamePath);
        }
        spatialView.addMeshByFileNames(roiFullNamePaths, roiName, color);
    }

    function onMouseWheel(event) {
        if (!scope.viewbox.containsPoint(eventCoord(event))) {
            return;
        }
        camera.top += event.wheelDelta / 400;
        camera.bottom += event.wheelDelta / 400;
        var aspect = scope.viewbox.size().x / scope.viewbox.size().y;
        var windowHeight = 1 / aspect;
        if (totalHeight > windowHeight) {
            if (camera.top > 0) {
                camera.top = 0;
                camera.bottom = camera.top - windowHeight;
            }
            var maxBottom = Math.max(totalHeight, windowHeight);
            if (camera.bottom < -maxBottom) {
                camera.bottom = -maxBottom;
                camera.top = camera.bottom + windowHeight;
            }
        }
        else {
            if (camera.top > windowHeight - totalHeight) {
                camera.top = windowHeight - totalHeight;
                camera.bottom = camera.top - windowHeight;
            }
            var maxBottom = Math.max(totalHeight, windowHeight);
            if (camera.bottom < -maxBottom) {
                camera.bottom = -maxBottom;
                camera.top = camera.bottom + windowHeight;
            }
        }
        camera.updateProjectionMatrix();
    }

    function onMouseDown(event) {
        if (!scope.viewbox.containsPoint(eventCoord(event))) {
            return;
        }
        var mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - scope.viewbox.min.x) / scope.viewbox.size().x) * 2 - 1;
        mouse.y = -((event.clientY - scope.viewbox.min.y) / scope.viewbox.size().y) * 2 + 1;
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children);
        for (var i = 0; i < scene.children.length; i++) {
            if (scene.children[i] instanceof THREE.Mesh) {
                scene.children[i].material.color.set(0xffffff);
            }
        }
        for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.roiName !== undefined) {
                intersects[i].object.material.color.set(0xf2f2f2);
                scope.addRoiByName(intersects[i].object.roiName, intersects[i].object.mainColor);
            }
        }
    }
    function onMouseMove(event) {
        if (!scope.viewbox.containsPoint(eventCoord(event))) {
            return;
        }
        var mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - scope.viewbox.min.x) / scope.viewbox.size().x) * 2 - 1;
        mouse.y = -((event.clientY - scope.viewbox.min.y) / scope.viewbox.size().y) * 2 + 1;
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children);

        for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.roiName !== undefined) {
                tooltip.setPosition(eventCoord(event));
                tooltip.setText(intersects[i].object.roiName);
           }
        }
    }

    this.disable = function () {
        if (!this.enabled) return;
        this.enabled = false;
        document.removeEventListener('mousedown', onMouseDown, false);
        document.removeEventListener('mousewheel', onMouseWheel, false);
        document.removeEventListener('mousemove', onMouseMove, false);
    }

    this.enable = function () {
        if (this.enabled) return;
        this.enabled = true;
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mousewheel', onMouseWheel, false);
        document.addEventListener('mousemove', onMouseMove, false);
    };
    this.enable();
}
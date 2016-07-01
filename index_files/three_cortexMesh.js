var coretexMesh_uniforms = {
    transExp: {
      type: "f",
      value: 5.0,
      min: 0,
      max: 100
    },
};
var coretexMesh_vertexShader = document.getElementById('vertexShader').text;
var coretexMesh_fragmentShader = document.getElementById('fragmentShader').text;
coretexMesh_material = new THREE.ShaderMaterial(
    {
        uniforms: coretexMesh_uniforms,
        vertexShader: coretexMesh_vertexShader,
        fragmentShader: coretexMesh_fragmentShader,
        side: THREE.FrontSide,
        transparent: true,
    });

coretexMesh_material2 = new THREE.MeshLambertMaterial(
    {
        //opacity: 0.5,
        color: 0xffffff,
        //transparent: true,
        side: THREE.FrontSide,
        vertexColors: THREE.FaceColors,
    });

var three_cortexMesh = function (lfn, rfn, scene) {
    var extension_lfn = lfn.split('.').pop();
    var loader;
    if (extension_lfn == 'obj') {
        loader = new THREE.OBJLoader();
    }
    else if (extension_lfn == 'stl') {
        loader = new THREE.STLLoader();
    }
    else {
        alert('Unknown cortex mesh format!');
    }
    var loaded = 0;
    loader.load(lfn, function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.dispose();
                child.material = coretexMesh_material;
                var geometry = new THREE.Geometry();
                geometry.fromBufferGeometry(child.geometry);
                child.geometry.dispose();
                child.geometry = geometry;
                child.geometry.mergeVertices();
                child.geometry.computeFaceNormals();
                child.geometry.computeVertexNormals();
                // back to buffer geometry 
                //geometry = new THREE.BufferGeometry();
                //geometry.fromGeometry(child.geometry);
                //child.geometry.dispose();
                //child.geometry = geometry;
                child.name = 'lh';
                scene.add(child);
                loaded++;
                if (loaded == 2) {
                    spatialView.sortMeshVertices();
                }
            }
        });
    });
    var extension_rfn = rfn.split('.').pop();
    if (extension_lfn !== extension_rfn) {
        if (extension_rfn == 'obj') {
            loader = new THREE.OBJLoader();
        }
        else if (extension_rfn == 'stl') {
            loader = new THREE.STLLoader();
        }
        else {
            alert('Unknown cortex mesh format!');
        }
    }
    loader.load(rfn, function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.dispose();
                child.material = coretexMesh_material;
                var geometry = new THREE.Geometry();
                geometry.fromBufferGeometry(child.geometry);
                child.geometry.dispose();
                child.geometry = geometry;
                child.geometry.mergeVertices();
                child.geometry.computeFaceNormals();
                child.geometry.computeVertexNormals();
                // back to buffer geometry 
                //geometry = new THREE.BufferGeometry();
                //geometry.fromGeometry(child.geometry);
                //child.geometry.dispose();
                //child.geometry = geometry;
                child.name = 'rh';
                loaded++;
                scene.add(child);
                if (loaded == 2) {
                    spatialView.sortMeshVertices();
                }
            }
        });
    });
}
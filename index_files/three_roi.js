
var three_roi = function (sizes) {
    this.name = 'noName';
    this.fullname = '';
    this.sizes = sizes;
    //this.length = sizes[0] * sizes[1] * sizes[2];
    //this.buffer = new ArrayBuffer(this.length);
    //this.vol = new Uint8Array(this.buffer);
    this.data;// = this.vol;
    this.geometry;
    this.maskValues = -1;
    this.boundingbox = undefined;
    this.index = three_roi.nextIndex;
    //this.vox = [];
    three_roi.nextIndex++;
    this.color = three_colorTable.categoricalColor(this.index);

    // tmp
    this.vol = undefined;
    this.meshFns = [];
    this.type = 'subcortical';
}

three_roi.nextIndex = 0;

/*
three_roi.prototype.buildFromVolume = function (volume, maskValue) {
    if (volume.sizes !== this.sizes) {
        alert("volume sizes not matched!");
        return;
    }
    for (var i = 0; i < this.length; i++) {
        if(volume.data[i] === maskValue){
            this.vol[i] = 1;
        }
    }
    this.name = 'Roi_' + maskValue;
    three_roi.nextIndex = Math.max(maskValue, three_roi.nextIndex);
    this.maskValue = maskValue;
}
*/
three_roi.prototype.setData = function (vol, maskValues) {
    this.maskValues = maskValues;
    this.vol = vol;
}

three_roi.prototype.buildFromVolume = function (vol, maskValues) {
    if (vol.sizes !== this.sizes) {
        alert("volume sizes not matched!");
        return;
    }
    var maskValueMap = new Map();
    if (maskValues instanceof Array) {
        for (var i = 0; i < maskValues.length; i++) {
            maskValueMap.set(maskValues[i], 1);
        }
    }
    else if (isNaN(maskValues)) {
        maskValueMap.set(maskValues, 1);
    }
    var size = vol.sizes[0];
    var size2 = vol.sizes[0] * vol.sizes[1];
    this.boundingbox = undefined;
    for (var z = 0; z < vol.sizes[2]; z++) {
        for (var y = 0; y < vol.sizes[1]; y++) {
            for (var x = 0; x < vol.sizes[0]; x++) {
                //var p = x + size * y + size2 * z;
                var p = z + size * y + size2 * x;
                var value = vol.data[p];
                if (maskValueMap.has(value)) {
                    var vec = new THREE.Vector3(x, y, z);
                    if (this.boundingbox === undefined) {
                        this.boundingbox = new THREE.Box3(vec.clone(), vec.clone());
                    }
                    else {
                        this.boundingbox.expandByPoint(vec);
                    }
                    //this.vox.push(p);
                }
            }
        }
    }
    this.boundingbox.max.add(new THREE.Vector3(2, 2, 2));
    this.boundingbox.min.sub(new THREE.Vector3(1, 1, 1));
    var bSize = this.boundingbox.size().x;
    var bSize2 = this.boundingbox.size().x * this.boundingbox.size().y;
    var length = this.boundingbox.size().x * this.boundingbox.size().y * this.boundingbox.size().z;
    var buffer = new ArrayBuffer(length);
    this.data = new Uint8Array(buffer);

    for (var z = this.boundingbox.min.z; z < this.boundingbox.max.z; z++) {
        for (var y = this.boundingbox.min.y; y < this.boundingbox.max.y; y++) {
            for (var x = this.boundingbox.min.x; x < this.boundingbox.max.x; x++) {
                //var p = x + size * y + size2 * z;
                var p = z + size * y + size2 * x;
                var z0 = z - this.boundingbox.min.z;
                var y0 = y - this.boundingbox.min.y;
                var x0 = x - this.boundingbox.min.x;
                var p0 = x0 + bSize * y0 + bSize2 * z0;
                var value = vol.data[p];
                if (maskValueMap.has(value)) {
                    this.data[p0] = 1;
                }
            }
        }
    }

    if (this.name === 'noName') {
        this.name = 'Roi_' + this.index;
    }
    this.maskValues = maskValues;
}

three_roi.prototype.computeGeometry = function (callback) {
    if (this.geometry === undefined) {
        if (this.vol) {
            if (this.boundingbox === undefined) {
                this.buildFromVolume(this.vol, this.maskValues);
            }
            this.geometry = three_marchingCubesRoi(this, 0.5);
            // clean the data
            this.data = undefined;
            callback(this.geometry);
        }
        else if (this.meshFn) {
            var extension_lfn = this.meshFn.split('.').pop();
            var loader;
            if (extension_lfn == 'obj') {
                loader = new THREE.OBJLoader();
            }
            else if (extension_lfn == 'stl') {
                loader = new THREE.STLLoader();
            }
            else {
                alert('Unknown mesh format!');
            }
            var scope = this;
            loader.load(this.meshFn, function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.mergeVertices();
                        scope.geometry = child.geometry;
                        scope.geometry.computeFaceNormals();
                        scope.geometry.computeVertexNormals();
                        child.material.dispose();
                        callback(scope.geometry);
                    }
                });
            });
        }
        else if (this.meshFns) {
            var curGeo;
            var partsToLoad = this.meshFns.length;
            for (var im = 0; im < this.meshFns.length; im++) {
                var meshFn = this.meshFns[im];
                var extension_lfn = meshFn.split('.').pop();
                var loader;
                if (extension_lfn == 'obj') {
                    loader = new THREE.OBJLoader();
                }
                else if (extension_lfn == 'stl') {
                    loader = new THREE.STLLoader();
                }
                else { alert('Unknown mesh format!'); }
                var scope = this;
                loader.load(meshFn, function (object) {
                    object.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            if (curGeo == undefined) {
                                curGeo = new THREE.Geometry();
                                curGeo.fromBufferGeometry(child.geometry);
                                //curGeo = child.geometry;
                                child.geometry.dispose();
                                child.material.dispose();
                            }
                            else {
                                //curGeo.merge(child.geometry, child.matrix);
                                var fltGeo = new THREE.Geometry();
                                fltGeo.fromBufferGeometry(child.geometry);
                                curGeo.merge(fltGeo);
                                fltGeo.dispose();
                                child.geometry.dispose();
                                child.material.dispose();
                            }
                            partsToLoad--;
                            if (0 == partsToLoad) {
                                curGeo.mergeVertices();
                                curGeo.computeFaceNormals();
                                curGeo.computeVertexNormals();
                                curGeo.verticesNeedUpdate = true;
                                callback(curGeo);
                            }
                        }
                    });
                });
            }
        }
    }
    else {
        callback(this.geometry);
    }
}


var three_roiBox = function () {
    // public
    this.parent = null;
    this.index = -1;
    this.quad = null;
    this.label = null;
    this.quad = null;
    this.bar = null;
    this.cohortCompData = null;
    this.color = null;
    this.detail = false;

    // private
    var labelDiv = null;

    // public
    this.renderable = undefined;

    // public
    this.init = function () {
        labelDiv = document.createElement('div');
        document.body.appendChild(labelDiv);
    }
    this.clear = function () {
        document.body.removeChild(labelDiv);
        this.renderable = undefined;
    }
    this.update = function () {
        // update label
        var gCoord = this.globalPixelCoord(this.quad.min);
        var gCoord2 = this.globalPixelCoord(this.quad.max);
        labelDiv.innerHTML = this.label;
        labelDiv.style.font = "12px Arial";
        labelDiv.style.top = window.innerHeight - gCoord.y + 'px';
        labelDiv.style.left = gCoord.x + 'px';
        labelDiv.style.position = 'absolute';
        labelDiv.style.zIndex = 1;
        var colorString = this.cohortCompData.rois[this.index].color.getHexString();
        colorString = '#'+colorString;
        labelDiv.style.color = colorString;
        labelDiv.style.backgroundColor = "transparent";
        if (this.parent.getViewbox().containsPoint(gCoord)
            && this.parent.getViewbox().containsPoint(gCoord2)) {
            labelDiv.style.display = 'block';
            /*
            // onclick not working
            // onmouseover works
            labelDiv.style.cursor = 'pointer';
            var scope = this;
            labelDiv.addEventListener('click', function (event) {
                console.log(scope.label + ' clicked.');
                roiView.activeSubView = scope.parent;
                var fileinput = document.getElementById('fileinput1');
                fileinput.click();
            });
            labelDiv.onclick = function (event) {
                console.log(scope.label + ' clicked.');
                roiView.activeSubView = scope.parent;
                var fileinput = document.getElementById('fileinput1');
                fileinput.click();
            };
            labelDiv.onmouseover = function () {
                console.log(scope.label + ' hovering.');
            };
            */
        }
        else {
            labelDiv.style.display = 'none';
        }
        // update quad
        var quad_geo = three_makeQuadGeometry(this.quad, 0.5);
        var quad_mat = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        this.renderable = new THREE.Mesh(quad_geo, quad_mat);
        var quad_line_geo = three_makeQuadWireGeometry(this.quad, 0.9);
        var quad_line_mat = new THREE.LineBasicMaterial({
            color: 0x000000
        });
        var line = new THREE.Line(quad_line_geo, quad_line_mat);
        this.renderable.add(line);
        // update distribution
        var stdRange = this.cohortCompData.computeStdevRange(this.index);
        if (this.cohortCompData.computeStatus() === ROIVIEW_STATUS_DATA
            || this.cohortCompData.computeStatus() === ROIVIEW_STATUS_COMP) {
            if (!this.detail) {
                var minStdev = this.cohortCompData.cohortRoiCompStatRange[0];
                if (this.cohortCompData.cohortRoiDataArray[0] !== undefined) {
                    //var color = this.cohortCompData.cohortRoiDataArray[0].color;
                    var color = cohortColors[0];
                    this.drawCurves(this.cohortCompData.cohortRoiDataArray[0].stats[this.index], color.clone(), stdRange[0]);
                }
                if (this.cohortCompData.cohortRoiDataArray[1] !== undefined) {
                    //var color = this.cohortCompData.cohortRoiDataArray[1].color;
                    var color = cohortColors[1];
                    this.drawCurves(this.cohortCompData.cohortRoiDataArray[1].stats[this.index], color.clone(), stdRange[0]);
                }
            }
            else {
                if (this.cohortCompData.cohortRoiDataArray[0] !== undefined
                    && this.cohortCompData.cohortRoiDataArray[1] !== undefined) {
                    var distr0 = this.cohortCompData.cohortRoiDataArray[0].stats[this.index].kde_guassian(-3, 3, 0.1, 100);
                    var distr0_max = distr0.reduce(function (a, b) { return Math.max(a, b); });
                    var distr1 = this.cohortCompData.cohortRoiDataArray[1].stats[this.index].kde_guassian(-3, 3, 0.1, 100);
                    var distr1_max = distr1.reduce(function (a, b) { return Math.max(a, b); });
                    var distr_max = Math.max(distr0_max, distr1_max);
                    var norFactor = 1 / distr_max;
                    this.drawDistribution(distr0, cohortColors[0], norFactor);
                    this.drawDistribution(distr1, cohortColors[1], norFactor);
                }
                else if (this.cohortCompData.cohortRoiDataArray[0] !== undefined) {
                    var distr0 = this.cohortCompData.cohortRoiDataArray[0].stats[this.index].kde_guassian(-3, 3, 0.1, 100);
                    var distr0_max = distr0.reduce(function (a, b) { return Math.max(a, b); });
                    var norFactor = 1 / distr0_max;
                    this.drawDistribution(distr0, cohortColors[0], norFactor);
                }
            }
        }
        // update box
        if (this.bar !== null) {
            this.drawBar();
        }
    }

    // utility functions (private)
    this.globalPixelCoord = function (geoCoord) {
        var viewboxAdj = scaleAtPoint(this.parent.getViewbox(), this.parent.getViewbox().center(), 1 / 1.04);
        var gCoord = absoluteCoord(viewboxAdj, geoCoord);
        return gCoord;
    };
    this.drawBar = function () {
        var bar_geo = three_makeQuadGeometry(this.bar);
        var bar_mat = new THREE.MeshBasicMaterial({
            color: this.color.getHex()
        });
        var bar_mesh = new THREE.Mesh(bar_geo, bar_mat);
        this.renderable.add(bar_mesh);

        var bar_line_geo = three_makeQuadWireGeometry(this.bar, 0.9);
        var bar_line_mat = new THREE.LineBasicMaterial({
            color: 0x000000
        });
        var bar_line = new THREE.Line(bar_line_geo, bar_line_mat);
        this.renderable.add(bar_line);
    }
    this.drawCurves = function (roiStats, color, minStdev) {
        var mean = roiStats.mean();
        var stdev = roiStats.stdev();
        var box = this.quad;

        var curve_geometry = getGaussianCurveGeometry(mean, stdev, box, -2, 2, minStdev);
        var material = new THREE.MeshBasicMaterial();
        material.color.set(color);
        material.transparent = true;
        material.opacity = 0.5;
        var curve_mesh = new THREE.Mesh(curve_geometry, material);
        this.renderable.add(curve_mesh);

        var lineGeo = getGaussianCurveLineGeometry(mean, stdev, box, -2, 2, minStdev);
        var lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000
        });
        var line = new THREE.Line(lineGeo, lineMaterial);
        this.renderable.add(line);
    }
    this.drawDistribution = function (distribution, color, norFactor) {
        var box = this.quad;
        //var distribution = roiStats.kde_guassian(-2, 2, 0.1, 100);
        var curve_geometry = getDistributionCurveGeometry(distribution, -2, 2, box, norFactor);
        var material = new THREE.MeshBasicMaterial();
        material.color.set(color);
        material.transparent = true;
        material.opacity = 0.5;
        var curve_mesh = new THREE.Mesh(curve_geometry, material);
        this.renderable.add(curve_mesh);

        var lineGeo = getDistributionCurveLineGeometry(distribution, -2, 2, box, norFactor);
        var lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000
        });
        var line = new THREE.Line(lineGeo, lineMaterial);
        this.renderable.add(line);
    }
    function getDistributionCurveGeometry(distribution, min, max, box, norFactor) {
        var numSteps = distribution.length;
        var geometry = new THREE.Geometry();
        var bottom = box.min.y;
        var maxHeight = box.size().x;
        var left = box.min.x + Math.exp(-9) * maxHeight;
        for (var i = 0; i < distribution.length; i++) {
            var kd = distribution[i];
            var height = kd * maxHeight * norFactor;
            var yPos = bottom + i / (distribution.length - 1) * box.size().y;
            var p0 = new THREE.Vector3(left, yPos, 1);
            var p1 = new THREE.Vector3(left + height, yPos, 1);
            geometry.vertices.push(p0, p1);
        }
        for (var i = 0; i < geometry.vertices.length - 2; i += 2) {
            geometry.faces.push(new THREE.Face3(i, i + 1, i + 3));
            geometry.faces.push(new THREE.Face3(i, i + 3, i + 2));
        }
        return geometry;
    }
    function getGaussianCurveGeometry(mean, stdev, box, min, max, minStdev) {
        var numSteps = 50;
        var maxHeight = box.size().x;
        var geometry = new THREE.Geometry();
        var range = box.size().y / (max - min);
        var left = box.min.x + Math.exp(-9) * maxHeight * (minStdev / stdev);
        var bottom = box.min.y;
        for (var i = -numSteps / 2; i <= numSteps / 2; i++) {
            var diff = i / (numSteps / 2) * 3;
            if (mean + diff * stdev < min || mean + diff * stdev > max) continue;
            var height = Math.exp(-diff * diff) * maxHeight * (minStdev / stdev);
            var yPos = bottom + (diff * stdev + mean - min) * range;
            var p0 = new THREE.Vector3(left, yPos, 1);
            var p1 = new THREE.Vector3(left + height, yPos, 1);
            geometry.vertices.push(p0, p1);
        }

        for (var i = 0; i < geometry.vertices.length - 2; i += 2) {
            geometry.faces.push(new THREE.Face3(i, i + 1, i + 3));
            geometry.faces.push(new THREE.Face3(i, i + 3, i + 2));
        }

        return geometry;
    }

    function getDistributionCurveLineGeometry(distribution, min, max, box, norFactor) {
        var numSteps = distribution.length;
        var geometry = new THREE.Geometry();
        var bottom = box.min.y;
        var maxHeight = box.size().x;
        var left = box.min.x + Math.exp(-9) * maxHeight;
        for (var i = 0; i < distribution.length; i++) {
            var kd = distribution[i] * norFactor;
            var height = kd * maxHeight;
            var yPos = bottom + i / (distribution.length - 1) * box.size().y;
            var p = new THREE.Vector3(left + height, yPos, 1);
            geometry.vertices.push(p);
        }
        return geometry;
    }
    function getGaussianCurveLineGeometry(mean, stdev, box, min, max, minStdev) {
        var numSteps = 50;
        var maxHeight = box.size().x;
        var geometry = new THREE.Geometry();
        var range = box.size().y / (max - min);
        var left = box.min.x + Math.exp(-9) * maxHeight * (minStdev / stdev);
        var bottom = box.min.y;
        for (var i = -numSteps / 2; i <= numSteps / 2; i++) {
            var diff = i / (numSteps / 2) * 3;
            if (mean + diff * stdev < min || mean + diff * stdev > max) continue;
            var height = Math.exp(-diff * diff) * maxHeight * (minStdev / stdev);
            var yPos = bottom + (diff * stdev + mean - min) * range;
            var p = new THREE.Vector3(left + height, yPos, 1);
            geometry.vertices.push(p);
        }
        //geometry.vertices.push(geometry.vertices[0]);
        return geometry;
    }

}
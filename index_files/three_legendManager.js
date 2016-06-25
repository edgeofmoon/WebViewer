


var three_legendManager = function () {
    this.legendRanges = new Map();

    this.cohortCompDatasets = [];

    var scene = new THREE.Scene();
    var camera;

    // public
    this.viewbox;

    this.globalPixelCoord = function (geoCoord) {
        var gCoord = absoluteCoord(this.viewbox, geoCoord);
        return gCoord;
    }

    this.addTextDiv = function (text, coord) {

        var pixelSize = [1.0 / this.viewbox.size().x, 1.0 / this.viewbox.size().y];
        var textMesh = genTextQuad(text, 0, "12px Arial", pixelSize, 'left', 'top');
        textMesh.translateX(coord.x);
        textMesh.translateY(coord.y);
        textMesh.frustumCulled = false;
        scene.add(textMesh);

    }
    this.addLegend = function (statsName, box, mapType) {
        if (mapType == 'log') {
            return this.addLegendLog(statsName, box);
        }
        else {
            return this.addLegendLinear(statsName, box);
        }
    }
    this.addLegendLog = function (statsName, box) {
        // update scene
        var numSteps = 50;
        var dataRange = this.legendRanges.get(statsName);
        var range = dataRange[1] / dataRange[0];
        var stepValue = Math.pow(range, 1.0 / numSteps);
        var geometry = new THREE.Geometry();
        var vertexColorMaterial = new THREE.MeshBasicMaterial(
            { vertexColors: THREE.VertexColors });
        var lastColor = undefined;
        var bottom = box.min.y;
        var top = box.max.y;
        var xOffset = box.min.x;
        var remainWidth = box.size().x;
        if (Math.log10(dataRange[0]) * Math.log10(dataRange[1]) < 0) remainWidth /= 2;
        if (Math.log10(dataRange[0]) < 0) {
            // diverging map, negative color
            for (var i = 0; i <= numSteps; i++) {
                var value = Math.pow(stepValue, i) * dataRange[0];
                var color = three_colorTable.divergingColor(
                    Math.log10(value), Math.log10(dataRange[0]), Math.log10(dataRange[1]));
                var x = i / numSteps * remainWidth + xOffset;
                geometry.vertices.push(new THREE.Vector3(x, bottom, 1));
                geometry.vertices.push(new THREE.Vector3(x, top, 1));

                if (i !== 0) {
                    var face0 = new THREE.Face3(2 * i - 2, 2 * i, 2 * i + 1);
                    face0.vertexColors[0] = lastColor;
                    face0.vertexColors[1] = color;
                    face0.vertexColors[2] = color;
                    var face1 = new THREE.Face3(2 * i - 2, 2 * i + 1, 2 * i - 1);
                    face1.vertexColors[0] = lastColor;
                    face1.vertexColors[1] = color;
                    face1.vertexColors[2] = lastColor;
                    geometry.faces.push(face0, face1);
                }
                lastColor = color;
            }
            xOffset = box.center().x;
        }
        var vOffset = geometry.vertices.length;
        if (Math.log10(dataRange[1]) > 0) {
            for (var i = 0; i <= numSteps; i++) {
                //var value = stepValue * i + this.minValue;
                var value = Math.pow(stepValue, numSteps - i) * dataRange[0];
                var color = three_colorTable.divergingColor(
                    Math.log10(value), Math.log10(dataRange[0]), Math.log10(dataRange[1]));
                var x = i / numSteps * remainWidth + xOffset;
                geometry.vertices.push(new THREE.Vector3(x, bottom, 1));
                geometry.vertices.push(new THREE.Vector3(x, top, 1));

                if (i !== 0) {
                    var face0 = new THREE.Face3(2 * i - 2 + vOffset,
                        2 * i + vOffset, 2 * i + 1 + vOffset);
                    face0.vertexColors[0] = lastColor;
                    face0.vertexColors[1] = color;
                    face0.vertexColors[2] = color;
                    var face1 = new THREE.Face3(2 * i - 2 + vOffset,
                        2 * i + 1 + vOffset, 2 * i - 1 + vOffset);
                    face1.vertexColors[0] = lastColor;
                    face1.vertexColors[1] = color;
                    face1.vertexColors[2] = lastColor;
                    geometry.faces.push(face0, face1);
                }
                lastColor = color;
            }
        }
        var renderable = new THREE.Mesh(geometry, vertexColorMaterial);
        scene.add(renderable);

        // update labels
        // add negative value label
        var value = dataRange[0];
        var valueString = value.toExponential();
        var vSpt = valueString.split('e');
        valueString = vSpt[0].substring(0, Math.min(vSpt[0].length, 3)) + 'e' + vSpt[1];
        //valueString = valueString.substring(0, Math.min(valueString.length, 5));
        var xCoord = box.min.x;
        var coord = new THREE.Vector2(xCoord, box.min.y);
        this.addTextDiv(valueString, coord);

        // add positive value label
        var value = dataRange[1];
        var valueString = value.toExponential();
        var vSpt = valueString.split('e');
        valueString = vSpt[0].substring(0, Math.min(vSpt[0].length, 3)) + 'e' + vSpt[1];
        //valueString = valueString.substring(0, Math.min(valueString.length, 4));
        var xCoord = box.max.x;
        var coord = new THREE.Vector2(xCoord, box.min.y);
        this.addTextDiv(valueString, coord);

        if (Math.log10(dataRange[0]) * Math.log10(dataRange[1]) < 0) {
            // add 0 value label
            var zeroString = '1';
            var zeroCoord = new THREE.Vector2(box.center().x, box.min.y);
            this.addTextDiv(zeroString, zeroCoord);
        }
        // add title
        var pixelPerUnit = this.viewbox.size().y;
        var titleCoord = new THREE.Vector2(box.center().x, box.max.y + 15 / pixelPerUnit);
        this.addTextDiv(statsName, titleCoord);
    }
        
    this.addLegendLinear = function (statsName, box) {
        // update scene
        var numSteps = 50;
        var dataRange = this.legendRanges.get(statsName);
        var range = dataRange[1] - dataRange[0];
        var stepValue = range / numSteps;
        var geometry = new THREE.Geometry();
        var vertexColorMaterial = new THREE.MeshBasicMaterial(
            { vertexColors: THREE.VertexColors });
        var lastColor = undefined;
        var bottom = box.min.y;
        var top = box.max.y;
        var xOffset = box.min.x;
        var remainWidth = box.size().x;
        var ratio = Math.abs(dataRange[0] / dataRange[1]);
        if (dataRange[0] * dataRange[1] < 0) remainWidth = box.size().x*ratio/(1+ratio);
        if (dataRange[0] < 0) {
            // diverging map, negative color
            for (var i = 0; i <= numSteps; i++) {
                //var value = stepValue * i + this.minValue;
                var value = (1 - i / numSteps) * dataRange[0];
                var color = three_colorTable.divergingColor(
                    value, dataRange[0], dataRange[1]);
                var x = i / numSteps * remainWidth + xOffset;
                geometry.vertices.push(new THREE.Vector3(x, bottom, 1));
                geometry.vertices.push(new THREE.Vector3(x, top, 1));

                if (i !== 0) {
                    var face0 = new THREE.Face3(2 * i - 2, 2 * i, 2 * i + 1);
                    face0.vertexColors[0] = lastColor;
                    face0.vertexColors[1] = color;
                    face0.vertexColors[2] = color;
                    var face1 = new THREE.Face3(2 * i - 2, 2 * i + 1, 2 * i - 1);
                    face1.vertexColors[0] = lastColor;
                    face1.vertexColors[1] = color;
                    face1.vertexColors[2] = lastColor;
                    geometry.faces.push(face0, face1);
                }
                lastColor = color;
            }
            xOffset += remainWidth;
        }
        var vOffset = geometry.vertices.length;
        if (dataRange[0] * dataRange[1] < 0) remainWidth = box.size().x * 1 / (1 + ratio);
        if (dataRange[1] > 0) {
            for (var i = 0; i <= numSteps; i++) {
                //var value = stepValue * i + this.minValue;
                var value =  i / numSteps * dataRange[1];
                var color = three_colorTable.divergingColor(
                    value, dataRange[0], dataRange[1]);
                var x = i / numSteps * remainWidth + xOffset;
                geometry.vertices.push(new THREE.Vector3(x, bottom, 1));
                geometry.vertices.push(new THREE.Vector3(x, top, 1));

                if (i !== 0) {
                    var face0 = new THREE.Face3(2 * i - 2 + vOffset,
                        2 * i + vOffset, 2 * i + 1 + vOffset);
                    face0.vertexColors[0] = lastColor;
                    face0.vertexColors[1] = color;
                    face0.vertexColors[2] = color;
                    var face1 = new THREE.Face3(2 * i - 2 + vOffset,
                        2 * i + 1 + vOffset, 2 * i - 1 + vOffset);
                    face1.vertexColors[0] = lastColor;
                    face1.vertexColors[1] = color;
                    face1.vertexColors[2] = lastColor;
                    geometry.faces.push(face0, face1);
                }
                lastColor = color;
            }
        }
        var renderable = new THREE.Mesh(geometry, vertexColorMaterial);
        scene.add(renderable);

        // update labels
        // add negative value label
        var value = dataRange[0];
        var valueString = value.toString();
        valueString = valueString.substring(0, Math.min(valueString.length, 5));
        var xCoord = box.min.x;
        var coord = new THREE.Vector2(xCoord, box.min.y);
        this.addTextDiv(valueString, coord);

        // add positive value label
        var value = dataRange[1];
        var valueString = value.toString();
        valueString = valueString.substring(0, Math.min(valueString.length, 4));
        var xCoord = box.max.x;
        var coord = new THREE.Vector2(xCoord, box.min.y);
        this.addTextDiv(valueString, coord);

        if (dataRange[0] * dataRange[1] < 0) {
            // add 0 value label
            var zeroString = '0';
            var zeroCoord = new THREE.Vector2(box.min.x+box.size().x * ratio / (1 + ratio), box.min.y);
            this.addTextDiv(zeroString, zeroCoord);
        }
        // add title
        var pixelPerUnit = this.viewbox.size().y;
        var titleCoord = new THREE.Vector2(box.center().x, box.max.y + 15 / pixelPerUnit);
        this.addTextDiv(statsName, titleCoord);
    }
    this.computeAxisRange = function (valueRange, statsName) {
        var mapType = three_legendManager.getStatsMapType(statsName);
        if (mapType == 'linear') {
            if (spatialView.globalNormalization) {
                var dataRange = this.legendRanges.get(statsName);
                return [0, dataRange[1]];
            }
            else {
                var rst = [0, 0];
                rst[1] = computeChartMax(Math.max(Math.abs(valueRange[0]),
                    Math.abs(valueRange[1])));
                return rst;
            }
        }
        else if (mapType == 'log') {
            if (spatialView.globalNormalization) {
                var dataRange = this.legendRanges.get(statsName);
                return dataRange;
            }
            else {
                var rst = [1, 1];
                rst[0] = computeChartMax(Math.min(Math.abs(valueRange[0]),
                    Math.abs(valueRange[1])));
                return rst;
            }

        }
    }
    this.update = function () {
        // update ranges
        this.legendRanges.clear();
        for (var i = 0; i < this.cohortCompDatasets.length; i++) {
            var cohortCompData = this.cohortCompDatasets[i];
            var statsIndex = 1;
            if(roiView.subViews.length>i){
                statsIndex = roiView.subViews[i].getStatsIndex();
            }
            var status = cohortCompData.computeStatus();
            if (status === ROIVIEW_STATUS_COMP) {
                var statsName = cohortCompData.getStatsName(statsIndex);
                if (this.legendRanges.has(statsName)) {
                    var range = this.legendRanges.get(statsName);
                    var thisRange = cohortCompData.computeStatsRange(statsIndex);
                    range[0] = Math.min(range[0], thisRange[0]);
                    range[1] = Math.max(range[1], thisRange[1]);
                    this.legendRanges.set(statsName, range);
                }
                else {
                    var range = cohortCompData.computeStatsRange(statsIndex);
                    if (statsName == "Effect size") {
                        if (range[0] < 0 && range[1] < 0) {
                            range[1] = 0;
                        }
                        else if (range[0] > 0 && range[1] > 0) {
                            range[0] = 0;
                        }
                    } 
                    this.legendRanges.set(statsName, range);
                }
            }
        }
        var scope = this;
        /*
        this.legendRanges.forEach(function (value, key, map) {
            if (value[0] < 0 && value[1] > 0) {
                var absRange = Math.max(Math.abs(value[0]), Math.abs(value[1]));
                scope.legendRanges.set(key, [-absRange, absRange]);
            }
        });
        */

        // update scene & camera
        camera = new THREE.OrthographicCamera(
            0, 1, 1, 0, -100, 100);

        // add all legends
        //return;
        clearScene(scene);
        var numLegends = this.legendRanges.size;
        var allBox = new THREE.Box2(new THREE.Vector2(0.05, 0.2), new THREE.Vector2(0.95, 0.8));
        var itrIdx = 0;
        nextTextDivIndex = 0;
        this.legendRanges.forEach(function(value, key, map){
            var thisBox = cutBox(allBox, 0, itrIdx / numLegends, (++itrIdx) / numLegends);
            thisBox = cutBox(thisBox, 0, 0.1, 0.9);
            thisBox = cutBox(thisBox, 1, 0.3, 0.7);
            scope.addLegend(key, thisBox, three_legendManager.getStatsMapType(key));

        });
    }

    this.render = function () {
        renderer.setViewport(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        renderer.setScissor(this.viewbox.min.x, this.viewbox.min.y, this.viewbox.size().x, this.viewbox.size().y);
        //renderer.clear();
        renderer.render(scene, camera);
    }
}

three_legendManager.getStatsMapType = function (statsName) {
    var mapType = new Map;
    mapType.set('p value', 'log');
    if (mapType.has(statsName)) {
        return mapType.get(statsName);
    }
    else {
        return 'linear';
    }
}

three_legendManager.getValueDrawRange = function (range, mapType) {
    mapType = (mapType ? mapType : 'linear');
    if (mapType == 'linear') {
        var highRange = Math.max(Math.abs(range[0]), Math.abs(range[1]));
        var magnitude = Math.ceil(Math.log10(highRange));
        highRange = Math.pow(10, magnitude);
        return [0, highRange];
    }
    else if (mapType == 'log') {
        var logRange = [
            Math.log10(range[0]),
            Math.log10(range[1])
        ];
        var absLogRange = [
            Math.abs(logRange[0]),
            Math.abs(logRange[1]),
        ]
        var maxAbsLogRange = Math.max(absLogRange[0], absLogRange[1]);
        var minAbsLogRange = Math.min(absLogRange[0], absLogRange[1]);
        return [minAbsLogRange, maxAbsLogRange];
    }
}

three_legendManager.getValueHeight = function (value, range, mapType) {
    mapType = (mapType ? mapType : 'linear');
    if (mapType == 'linear') {
        return Math.abs(value) / range[1];
    }
    else if (mapType == 'log') {
        var aVal = Math.abs(Math.log10(value));
        var aRng0 = Math.abs(Math.log10(range[0]));
        var aRng1 = Math.abs(Math.log10(range[1]));
        return (aVal - aRng0) / (aRng1 - aRng0);
    }
}

three_legendManager.nomalizeValueInRange = function (value, range, mapType) {
    mapType = (mapType ? mapType : 'linear');
    if (mapType == 'linear') {
        //return Math.abs(value) / Math.max(Math.abs(range[0]), Math.abs(range[1]));
        var chartMax = computeChartMax(Math.max(Math.abs(range[0]), Math.abs(range[1])));
        return Math.abs(value) / chartMax;
    }
    else if (mapType == 'log') {
        var logRange = [
            Math.log10(range[0]),
            Math.log10(range[1])
        ];
        var absLogRange = [
            Math.abs(logRange[0]),
            Math.abs(logRange[1]),
        ]
        var maxAbsLogRange = Math.max(absLogRange[0], absLogRange[1]);
        return Math.log10(value) / maxAbsLogRange;
    }
    else if (mapTyle == 'OOMM') {
        var exponent = Math.floor(Math.log10(Math.abs(value)));
        var mantissa = value / pow(10, exponent);
        var exponentRange = [
            Math.floor(Math.log10(Math.abs(range[0]))),
            Math.floor(Math.log10(Math.abs(range[1])))
        ]
        var expNor = Math.min(Math.abs(exponent / exponentRange[0]),
            exponent / exponentRange[1]);
        var manNor = mantissa / 10;
        return [manNor, expNor];
    }
}

three_legendManager.colorValueInRange = function (value, range, mapType) {
    mapType = (mapType ? mapType : 'linear');
    if (mapType == 'linear') {
        return three_colorTable.divergingColor(value, range[0], range[1]);
    }
    else if (mapType == 'log') {
        var logRange = [
            Math.log10(range[0]),
            Math.log10(range[1])
        ];
        var absLogRange = [
            Math.abs(logRange[0]),
            Math.abs(logRange[1]),
        ]
        var maxAbsLogRange = Math.max(absLogRange[0], absLogRange[1]);
        var valueIndex = Math.abs(Math.log10(value)) / maxAbsLogRange;
        return three_colorTable.divergingColor(valueIndex, 0, 1);
    }
    else if (mapTyle == 'OOMM') {
        var exponent = Math.floor(Math.log10(Math.abs(value)));
        var mantissa = value / pow(10, exponent);
        var expRange = [
            Math.floor(Math.log10(Math.abs(range[0]))),
            Math.floor(Math.log10(Math.abs(range[1])))
        ]
        var expMax = Math.max(Math.abs(expRange[0]), Math.abs(expRange[1]));
        var expColor = three_colorTable.divergingColor(Math.abs(exponent), 0, expMax);
        var manColor = three_colorTable.divergingColor(mantissa, 1, 10);
        return [manColor, expColor];
    }
}
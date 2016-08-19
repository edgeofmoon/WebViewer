
var three_colorMapper = function () {
    var colorMap = [];

    this.LoadColorMapFromFile = function (fn, callBack) {
        colorMap.length = 0;
        var client = new XMLHttpRequest();
        client.open('GET', specfn, true);
        client.addEventListener('load', function (event) {
            var response = event.target.response;
            var table = CSVToArray(response);
            for (var i = 1; i < table.length; i++) {
                var idx = table[i][0];
                var r = table[i][1];
                var g = table[i][2];
                var b = table[i][3];
                if (!isNaN(idx)) {
                    colorMap.push([idx, r, g, b]);
                }
            }
            callBack(this);
        });
    }

    this.GetColorByRatio = function (ratio) {
        var startIdx = Math.min(Math.round(ratio * colorMap.length), colorMap.length - 1);
        return new THREE.Color(colorMap[startIdx][1], colorMap[startIdx][2], colorMap[startIdx][3]);
    }
}
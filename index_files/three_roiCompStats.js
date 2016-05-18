
var three_roiCompStats = function () {
    this.stats = [];
    // stats
    this.tScore = undefined;
    this.effectSize = undefined;
    this.pValue = undefined;


    this.minStdev = 0;
    this.stats.push(undefined);
    this.stats.push(undefined);

    this.loaded = false;

    // for preload data
    this.final = false;
}

three_roiCompStats.prototype.clone = function () {
    var clone = new three_roiCompStats;
    clone.stats = this.stats.slice(0);
    clone.tScore = this.tScore;
    clone.effectSize = this.effectSize;
    clone.pValue = this.pValue;
    clone.minStdev = this.minStdev;
    return clone;
}

three_roiCompStats.prototype.update = function () {
    if (this.final) {
        this.loaded = true;
        return;
    }
    this.tScore = 0;
    this.effectSize = 0;
    this.loaded = false;
    if (this.stats[0].subjectMeans.length !== 0
        && this.stats[1].subjectMeans.length !== 0) {
        var m0 = this.stats[0].mean();
        var m1 = this.stats[1].mean();
        var s0 = this.stats[0].stdev();
        var s1 = this.stats[1].stdev();
        this.minStdev = Math.min(s0, s1);
        //console.log(m0 + ',' + m1 + ',' + s0 + ',' + s1);
        var n0 = this.stats[0].subjectMeans.length;
        var n1 = this.stats[1].subjectMeans.length;
        var div0 = (n0 - 1) * s0 * s0 + (n1 - 1) * s1 * s1;
        var div1 = n0 + n1 - 2;
        var div2 = 1 / n0 + 1 / n1;
        this.tScore = (m0 - m1) / Math.sqrt(div0 / div1 * div2);

        var mean = (n0 * m0 + n1 * m1) / (n0 + n1);
        var popStdev = Math.sqrt((s0 * s0 + s1 * s1) / (n0 + n1));
        this.effectSize = (m0 - m1) / popStdev;

        this.loaded = true;
    }
}

three_roiCompStats.prototype.getStats = function (idx) {
    if (idx === 0) {
        return this.tScore;
    }
    else if (idx === 1) {
        return this.effectSize;
    }
    else {
        return this.pValue;
    }
}

three_roiCompStats.prototype.getStatsName = function (idx) {
    if (idx === 0) {
        return 't score';
    }
    else if (idx === 1) {
        return 'effect size';
    }
    else {
        return 'p value';
    }
}
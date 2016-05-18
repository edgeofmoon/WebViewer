
var three_roiStats = function (roi) {
    this.roi = roi;

    // statistics
    this.subjectMeans = [];

    // rolling stats, do not access
    this.currentMean = 0;
    this.meanUpdated = true;
    this.currentStdev = 0;
    this.stdevUpdated = true;
}

three_roiStats.prototype.mean = function () {
    if (this.meanUpdated) {
        return this.currentMean;
    }
    else {
        var meanSum = 0;
        for (var i = 0; i < this.subjectMeans.length; i++) {
            meanSum += this.subjectMeans[i];
        }
        this.currentMean = meanSum / this.subjectMeans.length;
        this.meanUpdated = true;
        return this.currentMean;
    }
}

three_roiStats.prototype.stdev = function () {
    if (this.stdevUpdated) {
        return this.currentStdev;
    }
    else {
        var mean = this.mean();
        var sum = 0;
        for (var i = 0; i < this.subjectMeans.length; i++) {
            var diff = this.subjectMeans[i] - mean;
            sum += diff * diff;
        }
        this.currentStdev = Math.sqrt(sum / this.subjectMeans.length);
        this.stdevUpdated = true;
        return this.currentStdev;
    }
}

three_roiStats.prototype.kde_guassian = function (min, max, sigma, numBins) {
    numBins = (numBins ? numBins : 100);
    sigma = (sigma ? sigma : (max - min) * 0.05);
    var binSize = (max - min) / numBins;
    var kd = [];
    for (var i = 0; i < numBins; i++) {
        kd.push(0);
    }
    var totalWeight = 0;
    for (var i = 0; i < this.subjectMeans.length; i++) {
        var sbjm = this.subjectMeans[i];
        var st = sbjm - 3 * sigma;
        var ed = sbjm + 3 * sigma;
        var st_idx = Math.floor((st - min) / binSize);
        st_idx = Math.min(st_idx, numBins - 1);
        var ed_idx = Math.floor((ed - min) / binSize);
        ed_idx = Math.min(ed_idx, numBins - 1);
        // compute weight to each bin
        var weights = [];
        for (var idx = st_idx; idx <= ed_idx; idx++) {
            var binCenter = (idx + 0.5) * binSize + min;
            var diff = binCenter - sbjm;
            var diffNor = diff / sigma;
            var weight = Math.exp(-diffNor * diffNor);
            weights.push(weight);
        }
        // normalize weight
        var weightSum = weights.reduce(function (a, b) {
            return a + b;
        });
        if (weightSum !== 0) {
            for (var idx = 0; idx < weights.length; idx++) {
                weights[idx] /= weightSum;
            }
        }
        // add weight to distribution
        for (var idx = st_idx; idx <= ed_idx; idx++) {
            var iw = idx - st_idx;
            if (idx >= 0 && idx < kd.length) {
                kd[idx] += weights[iw];
            }
            totalWeight += weights[iw];
        }
    }
    // normalize total weight
    if (totalWeight !== 0) {
        for (var i = 0; i < kd.length; i++) {
            kd[i] /= totalWeight;
            kd[i] *= 100;
        }
    }
    return kd;
}

three_roiStats.prototype.updateFromVolume = function (volume) {
    if (volume.sizes[0] !== this.roi.sizes[0]
        || volume.sizes[1] !== this.roi.sizes[1]
        || volume.sizes[2] !== this.roi.sizes[2]) {
        console.log(volume.sizes);
        console.log(this.roi.sizes);
        alert("volume sizes not matched!");
        return;
    }
    var regionSum = 0;
    var regionCount = 0;
    for (var i = 0; i < this.roi.vox.length; i++) {
        var value = volume.data[this.roi.vox[i]];
        if(value>0){
            regionSum += value;
            regionCount++;
        }
    }
    var regionMean = (regionCount === 0 ? 0 : regionSum / regionCount);
    this.subjectMeans.push(regionMean);
    this.setUpdate();
}

three_roiStats.prototype.setUpdate = function () {
    this.meanUpdated = false;
    this.stdevUpdated = false;
}
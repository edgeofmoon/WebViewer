
var three_cohortRoiData = function () {
    // public
    this.name = 'cohort';
    this.rois = [];
    this.stats = [];
    this.meanRange = [];
    this.stdevRange = [];
    this.index = cohortRoiData_nextIndex++;
    this.color = three_colorTable.categoricalColor(this.index);


    // methods
    this.init = function (rois) {
        this.rois = rois;
    }
    this.update = function () {
        // update range
        if (this.stats.length === 0) return;
        this.meanRange = [this.stats[0].mean(), this.stats[0].mean()];
        this.stdevRange = [this.stats[0].stdev(), this.stats[0].stdev()];
        for (var i = 1; i < this.stats.length; i++) {
            var mean = this.stats[i].mean();
            var stdev = this.stats[i].stdev();
            if (this.meanRange[0] > mean) this.meanRange[0] = mean;
            else if (this.meanRange[1] < mean) this.meanRange[1] = mean;
            if (this.stdevRange[0] > stdev) this.stdevRange[0] = stdev;
            else if (this.stdevRange[1] < stdev) this.stdevRange[1] = stdev;
        }
    }
    this.updateFromSubjectVolume = function (volume) {
        // if empty statas, allocate them
        for (var i = this.stats.length; i < this.rois.length; i++) {
            var stat = new three_roiStats(this.rois[i]);
            this.stats.push(stat);
        }
        for (var j = 0; j < this.rois.length; j++) {
            this.stats[j].updateFromVolume(volume);
        }
    }
}

cohortRoiData_nextIndex = 0;
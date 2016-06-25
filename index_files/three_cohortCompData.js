

const ROIVIEW_STATUS_NONE = 0;
const ROIVIEW_STATUS_ROIS = 1;
const ROIVIEW_STATUS_DATA = 2;
const ROIVIEW_STATUS_COMP = 4;

var three_cohortCompData = function () {
    // public
    // rois
    this.rois = [];
    // array length equals # cohorts: 1 or 2
    this.cohortRoiDataArray = [];
    // array length equals # Rois
    this.cohortRoiCompStats = [];
    // range
    // range of t-score/effect size/p value
    this.cohortRoiCompStatRange = [];

    // private
    this.sortOrder = [];
    this.sortOption = SORT_RAW;

    this.name = 'Unamed';

    // public
    this.computeStatus = function () {
        if (this.rois.length === 0) {
            return ROIVIEW_STATUS_NONE;
        }
        else {
            if (this.cohortRoiCompStats.length ===
                this.rois.length) {
                return ROIVIEW_STATUS_COMP;
            }
            else if (this.cohortRoiDataArray.length !== 0) {
                return ROIVIEW_STATUS_DATA;
            }
            else {
                return ROIVIEW_STATUS_ROIS;
            }
        }
    }
    this.computeStdevRange = function (idx) {
        if (this.cohortRoiDataArray.length === 1) {
            // normalize within cohort
            return this.cohortRoiDataArray[0].stdevRange;
        }
        else if (this.cohortRoiDataArray.length === 2){
            // normalize within roi
            var stdev0 = this.cohortRoiDataArray[0].stats[idx].stdev();
            var stdev1 = this.cohortRoiDataArray[1].stats[idx].stdev();
            return [Math.min(stdev0, stdev1), Math.max(stdev0, stdev1)];
        }
        else{
            return [];
        }
    }
    this.getStatsName = function (idx) {
        return this.cohortRoiCompStats[0].getStatsName(idx);
    }
    this.useLogarithm = function (idx) {
        if (this.getStatsName(idx) === 'p value') {
            return true;
        }
        return false;
    }
    this.suggestNextStatsIndex = function (idx) {
        var statsIndex = idx;
        do{
            statsIndex = (statsIndex+1) % 3;
        } while (this.cohortRoiCompStats[0].getStats(statsIndex) === undefined);
        return statsIndex;
    }
    this.add = function(cohortRoiData){
        if (this.cohortRoiDataArray.length === 0) {
            if (this.rois === cohortRoiData.rois) {
                this.cohortRoiDataArray.push(cohortRoiData);
            }
            else {
                alert('Rois Don\'t Match!');
            }
        }
        else if (this.cohortRoiDataArray.length === 1) {
            var rois = this.cohortRoiDataArray[0].rois;
            if (rois === cohortRoiData.rois) {
                this.cohortRoiDataArray.push(cohortRoiData);
            }
            else {
                alert('Rois Don\'t Match!');
            }
        }
        else {
            alert('Already Full!');
        }
    }
    this.remove = function (cohortRoiData) {
        var idx = this.cohortRoiDataArray.indexOf(cohortRoiData);
        if (idx > -1) {
            this.subViews.splice(idx, 1);
        }
    }
    this.merge = function (cohortCompData) {
        if (this.cohortRoiDataArray.length === 1
            && cohortCompData.cohortRoiDataArray.length === 1) {
            this.cohortRoiDataArray.push(cohortCompData.cohortRoiDataArray[0]);
        }
        else {
            alert('Already Full!');
        }
    }
    // use abs value
    this.computeSortOrder = function (statsIndex, sortOption) {
        // sort and find range if necessary
        var valueMap = function (value) {
            return Math.abs(value);
        }
        if (sortOption === SORT_INC) {
            var sortOrder = makeSortOrderFrom(this.cohortRoiCompStats,
                function (compStat0, compStat1) {
                    if (valueMap(compStat0.getStats(statsIndex)) > valueMap(compStat1.getStats(statsIndex))) {
                        return 1;
                    }
                    else if (valueMap(compStat0.getStats(statsIndex)) < valueMap(compStat1.getStats(statsIndex))) {
                        return -1;
                    }
                    return 0;
                });
            return sortOrder;
        }
        else if (sortOption === SORT_DEC) {
            var sortOrder = makeSortOrderFrom(this.cohortRoiCompStats,
                function (compStat0, compStat1) {
                    if (valueMap(compStat0.getStats(statsIndex)) > valueMap(compStat1.getStats(statsIndex))) {
                        return -1;
                    }
                    else if (valueMap(compStat0.getStats(statsIndex)) < valueMap(compStat1.getStats(statsIndex))) {
                        return 1;
                    }
                    return 0;
                });
            return sortOrder;
        }
        else {
            var sortOrder = makeIntegerSequence(this.rois.length);
            return sortOrder;
        }
    }
    this.computeStatsRange = function (statsIndex) {
        var cohortRoiCompStatRange = makeDataRange(this.cohortRoiCompStats,
                function (cohortRoiCompStats) {
                    return cohortRoiCompStats.getStats(statsIndex);
                });
        return cohortRoiCompStatRange;
    }
    this.update = function () {
        // if partially loaded
        // update range only
        if (this.cohortRoiDataArray.length === 1) {
            this.sortOrder = makeIntegerSequence(this.rois.length);
            this.cohortRoiCompStats.length = 0;
        }
        // if fully loaded
        // update compStats
        if (this.cohortRoiDataArray.length === 2) {
            var rois = this.cohortRoiDataArray[0].rois;
            // must have the same set of rois
            if (rois === this.cohortRoiDataArray[1].rois) {
                // compute statistics
                for (var i = 0; i < rois.length; i++) {
                    var skip = false;
                    if (this.cohortRoiCompStats.length >= rois.length) {
                        if (this.cohortRoiCompStats[i].stats[0]
                            === this.cohortRoiDataArray[0].stats[i]
                            && this.cohortRoiCompStats[i].stats[1]
                            === this.cohortRoiDataArray[1].stats[i]
                            && this.cohortRoiCompStats[i].final) {
                            // skip this update
                            skip = true;
                        }
                    }
                    if (!skip) {
                        var compStats = new three_roiCompStats();
                        compStats.stats[0] = this.cohortRoiDataArray[0].stats[i];
                        compStats.stats[1] = this.cohortRoiDataArray[1].stats[i];
                        compStats.update();
                        this.cohortRoiCompStats[i] = compStats;
                    }
                }


                this.cohortRoiCompStats.length = this.rois.length;
            }
            else {
                alert('Rois Don\'t Match!');
            }
        }
    }
}
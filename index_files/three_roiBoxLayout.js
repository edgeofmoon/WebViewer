

three_roiBoxLayout_barWidth = 0.05;

var three_roiBoxLayout = function () {
    // input
    this.cohortCompData = null;

    // render parameters
    this.roiBox_width = three_roiBoxLayout_barWidth;
    this.roiBox_interval = 0.003;
    this.roiBox_hideWidth = three_roiBoxLayout_barWidth / 5;
    this.roiBox_hideInterval = 0.003;
    this.roiBox_quadYOfst = 0.025;
    this.roiBox_quadHeight = 0.2;
    this.roiBox_barYOfst = 0.025;
    this.roiBox_barHeight = 0.35;
    this.roiBox_baseY = 0.5;

    this.mapType = 'linear';
    // output, private, access through interface
    // instance of THREE.Box2
    var quads = [];
    var bars = [];
    var barAtBottom = false;
    // instance of THREE.Color
    var colors = [];
    // ture or false
    var roiHidden = [];

    var offset = new THREE.Vector2(0, 0);

    this.sortOption = SORT_RAW;
    this.statsIndex = 1;
    this.statsRange = [];

    this.update = function () {
        this.roiBox_width = three_roiBoxLayout_barWidth;
        this.roiBox_hideWidth = three_roiBoxLayout_barWidth / 5;
        quads.length = 0;
        bars.length = 0;
        barAtBottom = false;
        if (this.cohortCompData === null) {
            return;
        }
        else {
            // init
            var numBoxes = this.cohortCompData.rois.length;
            for (var i = quads.length; i < numBoxes; i++) {
                quads.push(new THREE.Box2());
                roiHidden.push(false);
                // default white color
                colors.push(new THREE.Color(1, 1, 1));
            }
            var status = this.cohortCompData.computeStatus();
            if (status !== ROIVIEW_STATUS_NONE) {
                var sortOrder = this.cohortCompData.computeSortOrder(this.statsIndex, this.sortOption);
                // layout quads indicating rois
                var xOffset = 0.1;
                for (var iLoc = 0; iLoc < numBoxes; iLoc++) {
                    var i = iLoc;
                    if(sortOrder.length === numBoxes){
                        i = sortOrder[iLoc];
                    }
                    var offset = roiHidden[i] ? this.roiBox_hideInterval : this.roiBox_interval;
                    var width = roiHidden[i] ? this.roiBox_hideWidth : this.roiBox_width;
                    xOffset += offset;
                    quads[i].min.set(xOffset, this.roiBox_baseY - this.roiBox_quadYOfst - this.roiBox_quadHeight);
                    xOffset += width;
                    quads[i].max.set(xOffset, this.roiBox_baseY - this.roiBox_quadYOfst);
                    xOffset += offset;
                }
            }
            // based on previous step
            if (status === ROIVIEW_STATUS_COMP) {
                var statsName = this.cohortCompData.getStatsName(this.statsIndex);
                // use global or local scale
                var globalRange = roiView.getLegendManager().legendRanges.get(statsName);
                var localRange = this.cohortCompData.computeStatsRange(this.statsIndex);
                this.statsRange = localRange;
                //this.statsRange = roiView.getLegendManager().legendRanges.get(statsName);
                //this.statsRange = three_legendManager.getValueDrawRange(this.statsRange);
                this.mapType = three_legendManager.getStatsMapType(statsName);
                //  plus bars height
                for (var i = 0; i < numBoxes; i++) {
                    var height = this.barHeight(i);
                    var bar = quads[i].clone();
                    if (height < 0) {
                        barAtBottom = true;
                        // move quad to top
                        quads[i].min.y = this.roiBox_baseY + this.roiBox_quadYOfst;
                        quads[i].max.y = this.roiBox_baseY + this.roiBox_quadYOfst + this.roiBox_quadHeight;
                        // bar on bottom
                        bar.max.y = this.roiBox_baseY - this.roiBox_barYOfst;
                        // height is negative itself
                        bar.min.y = bar.max.y + height;
                    }
                    else {
                        // quad on bottom, no change
                        // bar on top
                        bar.min.y = this.roiBox_baseY + this.roiBox_barYOfst;
                        bar.max.y = bar.min.y + height;

                    }
                    bars.push(bar);
                    if (globalRange) {
                        this.statsRange = globalRange;
                    }
                    colors[i] = this.barColor(i);
                    this.statsRange = localRange;
                }
            }
        }
    }
    /************** Public ******************/
    // idx is related to cohortCompData roi index
    this.barAt = function (idx) {
        if (bars.length > idx) {
            var bar = bars[idx].clone();
            bar.translate(offset);
            return bar;
        }
        return null;
    }
    this.quadAt = function (idx) {
        var quad = quads[idx].clone();
        quad.translate(offset);
        return quad;
    }
    this.boxAt = function (idx) {
        var quad = quads[idx].clone();
        if (bars.length > idx) {
            var bar = bars[idx].clone();
            quad.union(bar);
        }
        quad.translate(offset);
        return quad;
    }
    this.getQuadBottom = function () {
        if (quads.length !== 0) {
            return quads[0].min.y;
        }
        else return this.roiBox_baseY - this.roiBox_quadYOfst - this.roiBox_quadHeight;
    }
    this.getQuadTop = function () {
        if (quads.length !== 0) {
            return quads[0].max.y;
        }
        else return this.roiBox_baseY - this.roiBox_quadYOfst;
    }
    this.getBarBottom = function () {
        if (barAtBottom) {
            return this.roiBox_baseY - this.roiBox_barYOfst - this.roiBox_barHeight;
        }
        else {
            return this.roiBox_baseY + this.roiBox_barYOfst;
        }
    }
    this.getBarTop = function () {
        if (barAtBottom) {
            return this.roiBox_baseY - this.roiBox_barYOfst;
        }
        else {
            return this.roiBox_baseY + this.roiBox_barYOfst + this.roiBox_barHeight;
        }
    }
    this.colorAt = function (idx) {
        return colors[idx].clone();
    }
    this.hideRoi = function(idx){
        roiHidden[idx] = true;
    }
    this.unhideRoi = function(idx){
        roiHidden[idx] = false;
    }
    this.isRoiHidden = function (idx) {
        return roiHidden[idx];
    }
    this.setOffset = function (ost) {
        offset = ost;
    }
    /************** Private ******************/
    this.barHeight = function (idx) {
        /*
        if (this.cohortCompData.getStatsName(this.statsIndex) === 'p Value') {
            var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
            statValue = Math.abs(Math.log10(statValue));
            var statValueMax = Math.max(Math.abs(Math.log10(this.statsRange[0])),
                Math.abs(Math.log10(this.statsRange[1])));
            statValueMax = Math.ceil(statValueMax);
            var height = statValue / statValueMax * roiBox_barHeight;
            return height;
        }
        else {
            var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
            var statValueMax = Math.max(Math.abs(this.statsRange[0]),
                Math.abs(this.statsRange[1]));
            var height = Math.abs(statValue) / statValueMax * roiBox_barHeight;
            return height;
        }
        */
        var roiName = this.cohortCompData.rois[idx].name;
        if (roiName === 'CC') {
            var itdsdfa = 1;
        }
        var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
        var norHeight = three_legendManager.nomalizeValueInRange(statValue, this.statsRange, this.mapType);
        var height = norHeight * this.roiBox_barHeight;
        return height;
    }
    this.barColor = function (idx) {

        if (this.cohortCompData.getStatsName(this.statsIndex) === 'p value') {
            var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
            statValue = Math.log10(statValue);
            var statValueMax = Math.max(Math.log10(this.statsRange[0]),
                Math.log10(this.statsRange[1]));
            var statValueMin = Math.min(Math.log10(this.statsRange[0]),
                Math.log10(this.statsRange[1]));
            return three_colorTable.divergingColor(statValue, statValueMin,
                statValueMax);
        }
        else {
            var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
            return three_colorTable.divergingColor(statValue, this.statsRange[0],
                this.statsRange[1]);
        }
        /*
        return new THREE.Color(1, 1, 1);
        */
        /*
        var statValue = this.cohortCompData.cohortRoiCompStats[idx].getStats(this.statsIndex);
        var color = three_legendManager.colorValueInRange(statValue, this.statsRange, this.mapType);
        return color;
        */
    }
}
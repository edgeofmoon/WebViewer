

var three_viewManager = function () {
    this.viewbox;
    this.subviewboxes = [];
    this.numViews = 2;

    this.setNumViews = function(nV){
        this.numViews = nV;
    }

    this.setViewbox = function (viewbox) {
        this.viewbox = viewbox;
    }

    this.update = function () {
        this.subviewboxes.length = 0;
        this.subviewboxes.push(cutBox(this.viewbox, 0, 0, 0.15));
        this.subviewboxes.push(cutBox(this.viewbox, 0, 0.15, 0.6));
        this.subviewboxes.push(cutBox(this.viewbox, 0, 0.6, 1));
    }

    this.getViewbox = function (idx) {
        return this.subviewboxes[idx].clone();
    }

    this.getViewport = function (idx) {
        var viewbox = this.getViewbox(idx);
        var ret = [viewbox.min.x, viewbox.min.y, viewbox.max.x, viewbox.max.y];
        return ret;
    }
}


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
        var box0 = cutBox(this.viewbox, 0, 0, 0.5);
        var box1 = cutBox(this.viewbox, 0, 0.5, 1);
        this.subviewboxes.push(box0);
        this.subviewboxes.push(box1);
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
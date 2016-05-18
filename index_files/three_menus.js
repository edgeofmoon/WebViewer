
var three_menus = function () {
    this.roiMenu = [{
        name: 'create',
        img: 'images/create.png',
        title: 'create button',
        subMenu: [{
            name: 'new template',
            //img: 'images/healthy.png',
            title: 'load new template',
            fun: function () {
                var fileinput = document.getElementById('fileinput');
                fileinput.click();
            }
        }, {
            name: 'keep template',
            //img: 'images/diseased.png',
            title: 'keep template',
            fun: function () {
                roiView.addSubView();
                roiView.update();
            }
        }],
    }, {
        name: 'update',
        img: 'images/update.png',
        title: 'update button',
        subMenu: [{
            name: 'control',
            img: 'images/healthy.png',
            title: 'update control',
            fun: function () {
                var input = document.getElementById('directoryinput');
                input.click();
            }
        }, {
            name: 'diseased',
            img: 'images/diseased.png',
            title: 'update diseased',
            fun: function () {
                var input = document.getElementById('directoryinput1');
                input.click();
            }
        }],
    }, {
        name: 'delete',
        img: 'images/delete.png',
        title: 'delete button',
        fun: function () {
            alert('i am delete button')
        }
    }, {
        name: 'cancel',
        img: 'images/cancel.png',
        title: 'cancel button',
        fun: function () {
        }
    }];
}
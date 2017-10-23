$(function() 
{
	 $("#infoBox")
	.css( 
	{
	    "background": "rgba(255,255,255,0.5)",
	})
	.dialog({
	    autoOpen: false,
	    /*show: { effect: 'fade', duration: 500 },
		hide: { effect: 'fade', duration: 500 }*/
	})/*
    .hover(
        function (ev) {
            ev.stopPropagation();
        })
    .mousemove(
        function (ev) {
            ev.stopPropagation();
        })
    .mousedown(
        function (ev) {
            ev.stopPropagation();
        })
	.click(
		function (ev) {
		    ev.stopPropagation();
		})*/;
	
	 $("#infoButton")
       .text("") // sets text to empty
	.css(
	{ "z-index":"2",
	  "background":"rgba(0,0,0,0)", "opacity":"0.9", 
	  "position":"absolute", "bottom":"4px", "left":"4px"
	}) // adds CSS
    .append("<img width='32' height='32' src='images/icon-info.png'/>")
    .button()
	.click( 
		function(ev) 
		{ 
		    $("#infoBox").dialog("open");
		    ev.stopPropagation();

		    $("div.ui-widget-overlay")
            .mousemove(function (ev) {
                ev.stopPropagation();
            })
            .mousedown(function (ev) {
                ev.stopPropagation();
            });
		});



	 $("div.ui-dialog")
     .mousemove(function (ev) {
         //ev.stopPropagation();
     })
     .mousedown(function (ev) {
         ev.stopPropagation();
     });



});
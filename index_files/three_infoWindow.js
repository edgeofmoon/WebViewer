$(function () {
    
    $("#methodBox")
   .css(
   {
       "background": "rgba(255,255,255,0.5)",
   })
   .dialog({
       autoOpen: false,
       //show: { effect: 'fade', duration: 500 },
       //hide: { effect: 'fade', duration: 500 }
   })

    $("#resultBox")
    .css(
    {
        "background": "rgba(255,255,255,0.5)",
    })
    .css('left', 0)
    .dialog({
        autoOpen: false,
        modal: false,
        show: { effect: 'fade', duration: 500 },
        hide: { effect: 'fade', duration: 500 }
    })
    .draggable()
    .resizable();

});
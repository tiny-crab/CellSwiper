/*
 jQuery module to get URL parameters.
 Copied from: http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
 Minified.
 */
$.urlParam = function (a) {
    var b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null
    } else {
        return b[1] || 0
    }
};

//Our stuff
$(document).ready( ()=> {
    $("#name").text($.urlParam('name'));
    $("#structure").text($.urlParam('structure'));
    index = $.urlParam('index');
    $("#image").attr('src', '/images?index=' + index);
  
    document.onkeyup = function (event) {
        var e = (!event) ? window.event : event;
        switch (e.keyCode) {
            //left arrowkey
            case 37:
                prevImage();
                break;
            //right arrowkey
            case 39:
                nextImage();
                break;
        }
    };

    $("#image").click( ()=> {
        nextImage();
    });
});

function nextImage() {
    index++;
    if (index > 9) window.location = "http://cellswiper.cs.spu.edu/complete";
    $("#image").attr('src', '/images?index=' + index);
}

function prevImage() {
    index--;
    if (index < 0) index = 9;
    $("#image").attr('src', '/images?index=' + index);
}

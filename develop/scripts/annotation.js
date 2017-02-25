/*
jQuery module to get URL parameters.
Copied from: http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
Minified.
*/
$.urlParam=function(a){var b=new RegExp("[?&]"+a+"=([^&#]*)").exec(window.location.href);if(b==null){return null}else{return b[1]||0}};

//Our stuff
$(document).ready( ()=> {
    $("#name").text($.urlParam('name'));
    $("#structure").text($.urlParam('structure'));
    index = $.urlParam('index');
    $("#image").attr('src', '/images?index=' + index);

    $("#image").click( ()=> {
        index++;
        if (index > 9) index = 0;
        $("#image").attr('src', '/images?index=' + index);
    });
});

/*
 jQuery module to get URL parameters.
 Copied from: http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
 Minified.
 */
$.urlParam = function (a) {
    let b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null
    } else {
        return b[1] || 0
    }
};

//Our stuff
$(document).ready( ()=> {
    const name = $.urlParam('name');
    const structure = $.urlParam('structure');
    let index = $.urlParam('index');
    let image_div = $("#image");
    $("#name").text(name);
    $("#structure").text(structure);
    image_div.attr('src', '/images?index=' + index);
  
    document.onkeyup = function (event) {
        let e = (!event) ? window.event : event;
        let choice;
        switch (e.keyCode) {
            //left arrowkey
            case 37:
                // prevImage();
                choice = false;
                break;
            //right arrowkey
            case 39:
                // nextImage();
                choice = true;
                break;
        }
        $.post("annotate", {imageid : index, user: name, annotation: choice, feature: structure})
            .done( data => {
                index = nextImage(index)
            })
            .fail( err => {
                alert("Something went wrong...\n" + err.responseText);
            })
    };

    image_div.click( ()=> {
        // nextImage();
    });
});

function nextImage(index) {
    index++;
    if (index > 10) window.location.href = 'export';
    else $("#image").attr('src', '/images?index=' + index);
    return index
}

function prevImage() {
    index--;
    if (index < 0) index = 9;
    $("#image").attr('src', '/images?index=' + index);
}


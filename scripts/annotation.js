/*
 jQuery module to get URL parameters.
 Copied from: http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
 Minified.
 */
$.urlParam = function (a) {
    let b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null;
    } else {
        return b[1] || 0;
    }
};

//Our stuff
$(document).ready( ()=> {
    const name = $.urlParam('name');
    const feature = $.urlParam('feature');
    const image_div = $("#image");



    let batchID = $.urlParam('batchid');
    let choice;
    let batch_status;
    let image;

    $("#user").text(name);
    $("#feature").text(feature);

    // acquire image status (testing)
    $.post("/test-img", {batchid: batchID, user: name, feature: feature}, (data) => { batch_status = data;});

    image_div.attr('src', '/images?id=' + image);

    document.onkeyup = function (event) {
        let e = (!event) ? window.event : event;
        switch (e.keyCode) {
            //left arrowkey
            case 37:
                choice = false;
                add_annotation();
                break;
            //right arrowkey
            case 39:
                choice = true;
                add_annotation();
                break;
        }
    };

    let good_classification = function() {
        choice = true;
        add_annotation();
    };
    let bad_classification = function() {
        choice = false;
        add_annotation();
    };

    let good = $("#good");
    let bad = $("#bad");
    let polaroid = $("#polaroid");

    bad.hover( ()=> {
        polaroid.css("border-color", "red");
        polaroid.css("border-width", "5px");
    }, ()=> {
        polaroid.css("border-color", "whitesmoke");
        polaroid.css("border-width", "1px");
    });

    good.hover( ()=> {
        polaroid.css("border-color", "green");
        polaroid.css("border-width", "5px");

    }, ()=> {
        polaroid.css("border-color", "whitesmoke");
        polaroid.css("border-width", "1px");
    });

    let good_button = $("#good-button");
    let bad_button = $("#bad-button");

    bad.click(bad_classification);
    bad_button.click(bad_classification);
    //takes image_div and applies "swipeleft" event
    //to the image
    image_div.hammer().on("swipeleft", bad_classification);

    good.click(good_classification);
    good_button.click(good_classification);
    //Takes image_div and applies "swiperight" event
    //to the image
    image_div.hammer().on("swiperight", good_classification);

    function add_annotation() {
        $.post("annotate", {imageid : batchID, user: name, annotation: choice, feature: feature})
            .done( data => {
                batchID = nextImage(batchID)
            })
            .fail( err => {
                alert("Something went wrong...\n" + err.responseText);
            })
    }

    function nextImage(batchID) {
        // TODO: refactor to retrieve new image
        batchID++;
        if (batchID > 12) window.location.href = 'complete';
        else $("#image").attr('src', '/images?batchid=' + batchID);
        return batchID
    }
});



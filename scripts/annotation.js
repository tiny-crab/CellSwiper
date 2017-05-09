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
        return decodeURI(b[1]) || 0;
    }
};

//Our stuff
$(document).ready( ()=> {
    const batchID = $.urlParam('batchid');
    const name = $.urlParam('name');
    const feature = $.urlParam('feature');
    let image_div = $("#image");
    let seadragon = $("#openseadragon");
    let viewer;

    let choice;
    let batch_status;
    let image;

    $("#user").text(name);
    $("#feature").text(feature);

    // acquire image status (testing)
    $.get("/batch-status", {batchid: batchID, user: name, feature: feature}, (data) => {
        batch_status = data;
        // now we can pull the first image
        getNextImage();
    })
    .fail((err) => {
        showModalServerError(err, true);
    });

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
        if (image) {
            $.post("annotate", {imageid: image, user: name, annotation: choice, feature: feature, batchid: batchID})
                .done(() => {
                    getNextImage()
                })
                .fail(err => {
                    showModalServerError(err, true);
                })
        }
        else {
            window.location.href = '/complete'
        }
    }

    function getNextImage() {
        // set current image to 1 i.e. annotated
        if (image) {
            batch_status.find((item) => {
                return item.id === image;
            }).status = 1;
        }
        // get next unannotated image
        image = batch_status.find((item) => {
            return item.status === 0;
        });
        if (image === undefined) {
            // batch done, do something here
            window.location.href = '/complete'
        }
        else {
            image = image.id;
            if (viewer) {
                viewer.destroy();
                viewer = null;
                seadragon.hide();
                image_div.show();
            }
            let imgURL = '/images?id=' + image;
            image_div
                .on("error", (err) => {
                    // if the image failed to retrieve, find out why
                    $.get(imgURL)
                        .done(() => {
                            // this should never happen, but if it does we'll just try again
                            image_div.attr('src', imgURL);
                        })
                        .fail(err => { showModalServerError(err) });
                })
                .attr('src', imgURL);
        }
    }

    image_div.dblclick(e => {
        e.preventDefault();
        let imgURL = `/images?id=${image}&large=${true}`;
        // don't need to check if image exists, as default is downsampled and it will be caught before
        // user can double click
        image_div.hide();
        viewer = OpenSeadragon({
            id: "openseadragon",
            prefixUrl: '/scripts/openseadragon_images/',
            tileSources: {
                type: 'image',
                url: imgURL
            },
            autoHideControls: false,
            defaultZoomLevel: 0,
            minZoomLevel: 0.5,
            maxZoomLevel: 5
        });
        seadragon.show();
    });
});



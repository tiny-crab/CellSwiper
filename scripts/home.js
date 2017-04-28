/**
 * Created by zach on 3/31/17.
 */

$.urlParam = function (a) {
    let b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null;
    } else {
        return b[1] || 0;
    }
};

$(document).ready( ()=> {
    const name = $.urlParam("name");
    $("#name").text(name);
    let feature_dropdown = $("#feature-dropdown");
    let feature;
    // get the feature list
    $.get({
        url: '/feature-list',
        success: (feature_list) => {
            console.log(feature_list);
            for (i =0; i < feature_list.length; i++) {
                let item = document.createElement('li');
                // Set its contents:
                item.append(document.createTextNode(feature_list[i]));
                feature_dropdown.append(item);
            }
        }
    });


    post_to_annotation = function() {
        let structure = $.urlParam("structure");
        $.post("insert_name", {name: name})
            .done(() => {
                window.location.href = `annotation?index=1&name=${name}&structure=${structure}`;
            })
            .fail(() => {
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `annotation?index=1&name=${name}&structure=${structure}`;
            });
    };

    post_to_admin = function() {
        $.post("insert_name", {name: name})
            .done(() => {
                window.location.href = `admin?name=${name}`;
            })
            .fail(() => {
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `admin?name=${name}`;
            });
    };

    $(`#new-batch`).click(post_to_annotation);
    $(`#continue-batch`).click(post_to_annotation);
    $(`#account-info`).click(post_to_admin);
});
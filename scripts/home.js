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

    post_to_annotation = function() {
        let feature = $.urlParam("feature");
        $.post("insert_name", {name: name})
            .done(() => {
                window.location.href = `annotation?batchid=1&name=${name}&feature=${feature}`;
            })
            .fail(() => {
                // what would be the fail condition here?
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `annotation?batchid=1&name=${name}&feature=${feature}`;
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
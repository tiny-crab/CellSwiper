/**
 * Created by zach on 4/11/17.
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
    const name = $.urlParam('name');
    $("#name").text(name);

    post_to_home = function () {
        let structure = $.urlParam("structure");
        $.post("insert_name", {name: name})
            .done(() => {
                window.location.href = `home?name=${name}`;
            })
            .fail(() => {
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `home?name=${name}`;
        });
    };

    $("#logo").click(post_to_home);
});
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

    // get the feature list
    $.get({
        url: '/feature-list',
        success: (feature_list) => {
            console.log(feature_list);
            for (i =0; i < feature_list.length; i++) {
                let feature = feature_list[i];
                let item = document.createElement('li');
                // Set its contents:
                item.append(document.createTextNode(feature));
                item.onclick = change_drop_text(feature);
                feature_dropdown.append(item);
            }
        }
    });

    function change_drop_text(structure) {
        $("#dropdown-button").text(structure);
    }

    function post_to_annotation(){
        let structure = $.urlParam("structure");
        $.post("insert_name", {name: name})
            .done(() => {
                window.location.href = `annotation?index=1&name=${name}&structure=${structure}`;
            })
            .fail(() => {
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `annotation?index=1&name=${name}&structure=${structure}`;
            });
    }

    function post_to_admin() {
        $.post("insert_name", {name: name})
            .done(() => {
                window.location.href = `admin?name=${name}`;
            })
            .fail(() => {
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `admin?name=${name}`;
            });
    }

    $(`#new-batch`).click(post_to_annotation);
    $(`#continue-batch`).click(post_to_annotation);
    $(`#account-info`).click(post_to_admin);
});
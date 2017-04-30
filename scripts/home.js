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
    let featureDropdown = $("#feature-dropdown");

    // get the feature list
    $.get({
        url: '/feature-list',
        success: (featureList) => {
            for (i =0; i < featureList.length; i++) {
                let feature = featureList[i];
                let listItem = document.createElement('li');
                let item = document.createElement('a');
                item.setAttribute("class", "dropdown-item");
                item.setAttribute("href", "#");
                // Set its text contents
                item.append(document.createTextNode(feature));
                // on click, change the main dropdown button to show the structure name
                item.onclick = changeDropText(feature);
                listItem.append(item);
                featureDropdown.append(listItem);
            }
        }
    });

    function changeDropText(structure) {
        $("#dropdownMenuButton").text(structure);
    }

    function postToAnnotation(){
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

    function postToAdmin() {
        $.post("insert_name", {name: name})
            .done(() => {
                window.location.href = `admin?name=${name}`;
            })
            .fail(() => {
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `admin?name=${name}`;
            });
    }

    $(`#new-batch`).click(postToAnnotation);
    $(`#continue-batch`).click(postToAnnotation);
    $(`#account-info`).click(postToAdmin);
});
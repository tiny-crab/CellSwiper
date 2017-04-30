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
    let dropdownMenuButton = $("#dropdownMenuButton");
    let defaultDropDown = dropdownMenuButton.text();

    // get the feature list
    $.get({
        url: '/feature-list',
        success: (featureList) => {
            for (i = 0; i < featureList.length; i++) {
                let listCounter = "list-item-" + i.toString();
                let listItem = document.createElement('li');
                listItem.setAttribute("id", listCounter);

                let feature = featureList[i];
                $(listCounter).click({ftr: feature}, changeDropdownText);
                let item = document.createElement('a');
                item.setAttribute("class", "dropdown-item");
                item.setAttribute("href", "#");
                // Set its text contents
                item.append(document.createTextNode(feature));
                // on click, change the main dropdown button to show the feature name
                listItem.append(item);
                featureDropdown.append(listItem);
            }
        }
    });

    function changeDropdownText(event) {
        let ftr = event.data.ftr;
        dropdownMenuButton.text(ftr);
    }

    function postToAnnotation() {
        let ftr = dropdownMenuButton.text();
        if ( ftr === defaultDropDown) {
            alert("Feature not selected from dropdown list.");
        } else {
            $.post("insert_name", {name: name})
                .done(() => {
                    window.location.href = `annotation?index=1&name=${name}&feature=${ftr}`;
                })
                .fail(() => {
                    alert(`Name is already in use, continuing as "${name}"`);
                    window.location.href = `annotation?index=1&name=${name}&feature=${ftr}`;
                });
        }

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
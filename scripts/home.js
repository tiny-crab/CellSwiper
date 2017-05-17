$.urlParam = function (a) {
    let b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null;
    } else {
        return decodeURI(b[1]) || 0;
    }
};

let beginAnnotation; // expose this function for use in batch_list.js

$(document).ready( () => {
    // load batch ui
    createBatchUI("batch-wrapper");
    let featureDropdown = $("#feature-dropdown");
    let dropdownMenuButton = $("#dropdownMenuButton");
    let defaultDropDown = dropdownMenuButton.text();

    function changeDropdownText(event) {
        let ftr = event.data.ftr;
        dropdownMenuButton.text(ftr);
        if (ftr !== defaultDropDown) {
            $(".batch-button").removeClass('disabled').attr('title', '');
            $("#batch-wrapper").css("visibility", "visible").animate({
                opacity: 1,
            }, 500);
        }
        else {
            $(".batch-button").addClass('disabled').attr('title', 'Select a feature to continue');
        }
    }

    beginAnnotation = (id) => {
        let ftr = dropdownMenuButton.text();
        let name = $("#name").val();
        if ( ftr === defaultDropDown) {
            showModalClientError("Feature not selected from dropdown list.");
        }
        else if (!name) {
            showModalClientError("Name is not specified")
        }
         else {
            $.post("insert-name", {name: name})
                .done(() => {
                    window.location.href = `annotation?batchid=${id}&name=${name}&feature=${ftr}`;
                })
                .fail((err) => { showModalServerError(err) });
        }
    };

    function postToAdmin() {
        $.post("insert-name", {name: name})
            .done(() => {
                window.location.href = `admin?name=${name}`;
            })
            .fail(() => {
                alert(`Name is already in use, continuing as "${name}"`);
                window.location.href = `admin?name=${name}`;
            });
    }

    // get the feature list
    $.get({
        url: '/feature-list',
        success: (featureList) => {
            for (i = 0; i < featureList.length; i++) {
                let listCounter = "list-item-" + i.toString();
                let listItem = document.createElement('li');
                listItem.setAttribute("id", listCounter);

                let item = document.createElement('a');
                item.setAttribute("class", "dropdown-item");
                item.setAttribute("href", "#");
                let feature = featureList[i];
                // Set its text contents
                item.append(document.createTextNode(feature));
                // on click, change the main dropdown button to show the feature name
                listItem.append(item);
                featureDropdown.append(listItem);
                $("#" + listCounter).click({ftr: feature}, changeDropdownText);
            }
        }
    })
    .fail(err => { showModalServerError(err) });

    $(`#account-info`).click(postToAdmin);
});
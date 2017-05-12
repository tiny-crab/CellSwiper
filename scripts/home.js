$.urlParam = function (a) {
    let b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null;
    } else {
        return decodeURI(b[1]) || 0;
    }
};

let beginAnnotation; // expose this function for use in batch_list.js

$(document).ready( ()=> {
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
            window.location.href = `annotation?batchid=${id}&name=${name}&feature=${ftr}`;
        }
    };

    function postToAnnotation() {
        let ftr = dropdownMenuButton.text();
        if ( ftr === defaultDropDown) {
            alert("Feature not selected from dropdown list.");
        } else {
            // this will need to be changed to be batch specific
            // window.location.href = `annotation?batchid=2&name=${name}&feature=${ftr}`;
            console.log("HI")
        }

    }

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

    $(`#new-batch`).click(postToAnnotation);
    $(`#continue-batch`).click(postToAnnotation);
    $(`#account-info`).click(postToAdmin);
});
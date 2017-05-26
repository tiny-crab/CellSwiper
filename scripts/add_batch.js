// set that contains all of the folders currently added as batches
let batchDirs = new Set();
// reference to the autocomplete object
let autocomplete;
// iterator used to give all batch UI's distinct ID's
let i = 0;
// reference to fadeOut timeout for the resultText, used for cancelling the timeout if another result text needs to
// be shown before the last result text has faded
let fadeTimeout;

$(function() {    
    // matches strings for top level directories
    let parentDirReg = /^\/\w+\/$/;
    $.getJSON("scripts/folders.json").done(function(dirObject) {
        let input = document.getElementById('folder-input');
        autocomplete = new Awesomplete(input, {
            list: dirObject.folders,
            autoFirst: true,
            filter: function(text, input) {
                if (batchDirs.has(text.value)) {
                    return false;
                }
                // if input is empty, list top level dirs
                if (input.length == 0) {
                    return parentDirReg.test(text.label);
                }
                else if (input.endsWith("/")) {
                    return (new RegExp("^" + input + "\\w+\/$")).test(text.label);
                }
                else {
                    // default filter function
                    return Awesomplete.FILTER_CONTAINS(text, input);
                }
            },
            minChars: 0
        });
        $(input).focus(function(ev) {
            autocomplete.evaluate();
        });
    })
        .fail(err => { showModalServerError(err) });

    $("#add-directory-form").submit(function(ev) {
        ev.preventDefault();
        let dir = $("#folder-input").val()
        resultText(dir, addBatch(dir));
    })
});

function addBatch(dir) {
    if (dir.length > 0 && !batchDirs.has(dir)) {
        batchDirs.add(dir);
        let newBatch = $(createBatchUi(dir, i++));
        $(".container").append(newBatch);
        newBatch.fadeIn();
        return true;
    }
    return false;
}

function resultText(dir, suc) {
    // displays text when one batch is added
    let resText = $("#batch-response");
    let textClass, text;
    if (suc) {
        text = dir + " added as batch";
        textClass = 'text-success';
    }
    // dont print out empty dir names
    else if (dir.length > 0) {
        text = dir + " already exists";
        textClass = "text-warning";
    }
    else {
        return;
    }
    if (fadeTimeout) {
        clearTimeout(fadeTimeout);
        resText.css("display: none;");
    }
    resText.removeClass("text-success text-warning text-info");
    resText.addClass(textClass);
    resText.text(text);
    resText.fadeIn("fast");
    fadeTimeout = setTimeout(function() {
        resText.fadeOut();
        fadeTimeout = null;
    }, 5000);
}

function resultTextMult(suc, err) {
    // displays text when multiple batches are added at once
    let resText = $("#batch-response");
    let textClass, text;
    if (suc == 0 && err == 0) {
        text = "No batches added";
        textClass = "text-info";
    }
    else if (err == 0) {
        text = suc + " batches added";
        textClass = 'text-success';
    }
    else if (suc == 0) {
        text = err + " folders ignored, all already exist as batches";
        textClass = 'text-warning';
    }
    else {
        text = suc + " batches added, " + err + " ignored";
    }
    if (fadeTimeout) {
        clearTimeout(fadeTimeout);
        resText.css("display: none;");
    }
    resText.removeClass("text-warning text-success text-info");
    resText.addClass(textClass);
    resText.text(text);
    resText.fadeIn("fast");
    fadeTimeout = setTimeout(function() {
        resText.fadeOut();
        fadeTimeout = null;
    }, 5000);
}

function createBatchUi(folder, num) {
    return `<span data-batch="${num}" class="col-xs-12 col-md-6" style="display: none;">
            <div class="batch panel panel-primary">
            <div class="panel-heading">
                <h3 id="batch-dir-${num}" class="panel-title">${folder}</h3>
            </div>
            <div class="panel-body">
                <div class="row">
                    <span class="col-xs-12 col-md-5">
                        <div class="row">
                            <span class="col-sm-4 col-xs-12">
                                <label for="name-input-${num}">Batch Name</label>
                            </span>
                            <span class="col-sm-8 col-xs-12">
                                <input id="name-input-${num}" class="form-control" type="text" placeholder="Batch name..." value="${folder}">
                            </span>
                            <div class="checkbox col-sm-8 col-xs-12">
                                <label for="recursive-check-${num}"><input id="recursive-check-${num}" type="checkbox">Add recursively</label>
                            </div>
                        </div>
                    </span>
                    <span class="col-xs-6 col-md-3 col-md-offset-1">
                        <button id="batch-submit-${num}" class="btn btn-success" onclick="submitBatch(${num})"><span class="hidden rotating glyphicon glyphicon-repeat"></span>Create</button>
                    </span>
                    <span class="col-xs-6 col-md-3">
                        <button id="batch-cancel-${num}" class="btn btn-danger" onclick="deleteBatch(${num})">Cancel</button>
                    </span>
                </div>
                <div class="alert-wrapper" id="alert-wrapper-${num}" class="row"></div>
            </div>
        </div></span>`;
}

function submitBatch(n) {
    let batchReq = {
        batch_name: $("#name-input-" + n).val().trim(),
        recursive: $("#recursive-check-" + n)[0].checked,
        batch_dir: $("#batch-dir-" + n).text()
    };
    let buttons = $(`[data-batch=${n}] button`);
    buttons.toggleClass("disabled");
    $(".glyphicon", buttons).toggleClass("hidden");
    // eventually this will make an actual post request
    $.get("/test-add", batchReq, function(res) {
        let resAlert = "<div class='col-xs-10 col-xs-offset-1 alert ";
        switch (res.result) {
            case "PASS":
                resAlert += "alert-success'><strong>Success:</strong> Batch Created</div>";
                buttons.each(function(i, b) { b.onclick = undefined;});
                break;
            case "ERROR":
                resAlert += `alert-warning'><strong>Success:</strong> Batch created, some images skipped.
                 Errors hashing ${res.img_errs.map(img_err => makeImgErrorHover(img_err.image, img_err.err)).join("")}.</div>`;
                buttons.each(function(i, b) { b.onclick = undefined;});
                break;
            case "FAIL":
                resAlert += `alert-danger'><strong>Failed: </strong>${res.err_msg.client}</div>`;
                console.log(res.err_msg.server);
                $(buttons[0]).text("Retry");
                buttons.toggleClass("disabled");
                break;
            default:
                showModalClientError("Unexpected response from server: " + res.result);
                break;
        }
        $("#alert-wrapper-" + n).html($(resAlert));
        // activate tooltips
        $("#alert-wrapper-" + n + ' [data-toggle="tooltip"]').tooltip();
        $(".glyphicon", buttons).toggleClass("hidden");
    })
        .fail(err => { showModalServerError(err) });
}

function makeImgErrorHover(img, err) {
    return `<a href="#" data-toggle="tooltip" title="${err}">${img}</a>`;
}

function deleteBatch(n) {
    $(`[data-batch=${n}]`).fadeOut("slow", function() {
        batchDirs.delete($("h3", this).text());
        $(this).remove();
    });
}

function addSubfolders() {
    let parentDir = $("#folder-input").val();
    let filterReg = new RegExp(`^${parentDir}\\w+\/?$`);
    // get all folders that are direct children of the parent folder (by regex) and create
    // batches for all of them
    let res = autocomplete._list.filter(filterReg.test.bind(filterReg)).map(addBatch);
    // get all true values from array
    let successes = res.filter(b => b).length;
    resultTextMult(successes, res.length - successes);
}

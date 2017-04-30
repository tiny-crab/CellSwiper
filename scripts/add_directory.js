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
    let parentDirReg = /^\w+\/$/;
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
    });

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
        $("#add-directory-wrapper").append(newBatch);
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
    resText[0].className = textClass;
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
    resText[0].className = textClass;
    resText.text(text);
    resText.fadeIn("fast");
    fadeTimeout = setTimeout(function() {
        resText.fadeOut();
        fadeTimeout = null;
    }, 5000);
}

function createBatchUi(folder, num) {
    return `<div data-batch="${num}" style="display: none;" class="batch panel panel-primary">
            <div class="panel-heading">
                <h3 id="batch-dir-${num}" class="panel-title">${folder}</h3>
            </div>
            <div class="panel-body">
                <div class="row">
                    <span class="col-xs-5">
                        <div class="row">
                            <span class="col-sm-4 col-xs-12">
                                <label for="name-input-${num}">Batch Name</label>
                            </span>
                            <span class="col-sm-8 col-xs-12">
                                <input id="name-input-${num}" type="text" placeholder="Batch name..." value="${folder}">
                            </span>
                        </div>
                    </span>
                    <span class="col-xs-4">
                        <input id="recursive-check-${num}" type="checkbox">
                        <label for="recursive-check-${num}">Add recursively</label>
                    </span>
                    <span class="col-xs-3">
                        <div class="row">
                            <span class="col-sm-6 col-xs-12">
                                <button id="batch-submit-${num}" class="btn btn-success" onclick="submitBatch(${num})"><span class="hidden rotating glyphicon glyphicon-repeat"></span>Create</button>
                            </span>
                            <span class="col-sm-6 col-xs-12">
                                <button id="batch-cancel-${num}" class="btn btn-danger" onclick="deleteBatch(${num})">Cancel</button>
                            </span>
                        </div>
                    </span>
                </div>
                <div class="alert-wrapper" id="alert-wrapper-${num}" class="row"></div>
            </div>
        </div>`;
}

function submitBatch(n) {
    let batchReq = {
        batch_dir: $("#name-input-" + n).val(),
        recursive: $("#recursive-check-" + n)[0].checked,
        batch_name: $("#batch-dir-" + n).text()
    };
    let buttons = $(`[data-batch=${n}] button`);
    buttons.toggleClass("disabled");
    $(".glyphicon", buttons).toggleClass("hidden");
    // eventually this will make an actual post request
    setTimeout(function() {
        res = [{result: "PASS", err_msg: null, img_errs: []},
            {result: "ERROR", err_msg: "Unhashable images detected", img_errs: ["02_98.png", "03_98.png"]},
            {result: "FAIL", err_msg: "Database unreachable", img_errs: []}
            ][Math.floor(Math.random() * 100) % 3];
        let resAlert = "<div class='col-xs-10 col-xs-offset-1 alert ";
        switch (res.result) {
            case "PASS":
                resAlert += "alert-success'><strong>Success:</strong> Batch Created</div>";
                buttons.each(function(i, b) { b.onclick = undefined;});
                break;
            case "ERROR":
                resAlert += `alert-warning'><strong>Success:</strong> Batch created, some images skipped. Errors hashing ${res.img_errs.join(", ")}.</div>`;
                buttons.each(function(i, b) { b.onclick = undefined;});
                break;
            case "FAIL":
                resAlert += `alert-danger'><strong>Failed: </strong>${res.err_msg}</div>`;
                $(buttons[0]).text("Retry");
                buttons.toggleClass("disabled");
                break;
            default:
                console.log("Unexpected response");
                break;
        }
        $("#alert-wrapper-" + n).html($(resAlert));
        $(".glyphicon", buttons).toggleClass("hidden");
    }, 1000)
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

/*// iterator used to give unique id to each folder in makeFolder
let f_i = 0

// list of folders that have been selected by the user
// updated during runtime
let selectedFolders = [];

function makeFolder(folderObj) {
    let parent = document.createElement('ul');
    parent.classList.add('list-group');
    for (let f in folderObj) {
        if (f == "files") {
            for (let fileName of folderObj.files) {
                let file = document.createElement('li');
                file.classList = "list-group-item file";
                file.innerText = fileName;
                parent.appendChild(file);
            }
        }
        else {
            let folder = $('<li class="folder list-group-item" id="folder-' + f_i + '">' +
            '<a class="folder-link collapsed" role="button" href="#folder-' + 
            f_i + '-content" data-toggle="collapse" aria-expanded="false"><span class="caret"></span>' + 
            f + '</a><div class="folder-list collapse" id="folder-' + f_i++ + '-content"></div></li>');
            // Refer to add_directory.js for more information on recursion
            $('div', folder).append(makeFolder(folderObj[f]));
            $(parent).append(folder);
        }
    }
    return parent;
}

$(function() {
    $.getJSON('scripts/folder.json').done(function(folderObj) {
        $("#dir-list-wrapper").append(makeFolder(folderObj));
        $('.folder').click(function(ev) {
            // dont do anything if a child of the folder was clicked on
            if (ev.target !== this) {
                return;
            }
            // inner text will usually grab the children text too,
            // this just grabs the parent text
            let tarText = ev.target.innerText.split("\n")[0];
            if ($(ev.target).hasClass('selected')) {
                // find it in the selected list, remove it
                for (let f in selectedFolders) {
                    if (selectedFolders[f][0] == tarText) {
                        $(".selected-pill:eq(" + f + ")").remove();
                        selectedFolders.splice(f, 1);
                        break;
                    }
                }
                $(ev.currentTarget).removeClass('selected');
            }
            else {
                let c = $('<span class="selected-pill"><span pos="' + selectedFolders.length 
                + '" class="selected-pill-close glyphicon glyphicon-remove"></span>' + 
                tarText + '</span>');
                $(".selected-pill-close", c).click(function(ev) {
                    // callback that deletes the selections when you click on the x
                    for (let n in selectedFolders) {
                        if (selectedFolders[n][0] == $(this).parent().text()) {
                            $("#" + selectedFolders[n][1]).removeClass('selected');
                            selectedFolders.splice(n, 1);
                            $("#selected-list .selected-pill:eq(" + n + ")").remove();
                        }
                    }
                });
                $("#selected-list").append(c);
                selectedFolders.push([tarText, ev.target.id])
                $(ev.currentTarget).addClass('selected');
            }
            // don't let it propagate to the parent elements
            ev.stopPropagation();
        });
    });
});
*/
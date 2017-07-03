months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// call this one to create the batch ui
// pass in the id of the element you want filled with
// the ui
function createBatchUI(container_id) {
    $.get('/all-batch-info').done(function(data) {
        batch_dict = {};
        let date_reg = /^(\d{4})-(\d{2})/;
        for (let batch of data) {
            let reg_match = date_reg.exec(batch.date_added);
            let year = reg_match[1]; 
            let month = reg_match[2];
            if (!batch_dict[year]) {
                batch_dict[year] = {};
            }
            if (!batch_dict[year][month]) {
                batch_dict[year][month] = [];
            }
            batch_dict[year][month].push(batch);
        }
        let batch_list = "<ul class='list-group'>";
        for (let y in batch_dict) {
            batch_list += makeYear(y, batch_dict[y]);
        }
        $("#" + container_id).html(batch_list + "</ul>");
    }).fail(err => {
        showModalServerError(err);
    });
}

function makeYear(year, obj) {
    let year_html = `<li data-toggle="collapse" data-target="#${year}-list" 
    class="year list-group-item collapsed">
    <span class="expand-glyph glyphicon glyphicon-chevron-down"></span>2017</li>
    <div data-year="${year}" id="${year}-list" class="collapse year-list">`;
    for (let m in obj) {
        year_html += makeMonth(year, parseInt(m) - 1, obj[m]);
    }
    year_html += "</div>";
    return year_html;

}

function makeMonth(year, month, month_list) {
    let month_html = `<li data-toggle="collapse" data-target="#${year}-${month}-list" class="month list-group-item collapsed">
    <span class="expand-glyph glyphicon glyphicon-chevron-down"></span>${months[month]}</li>
    <div id="${year}-${month}-list" class="collapse month-list">`;
    for (let b of month_list) {
        month_html += `<li class="batch list-group-item row">
        <span class="col-xs-7">${b.batch_name}<small class="batch-path">${b.original_dir}</small></span>
        <span class="col-xs-3 checkbox" style="margin-top: 0px"><label><input type="checkbox" value="" id="batch-random-${b.id}">Randomize</label></span>
        <span class="col-xs-2"><button id="batch-button-${b.id}" title="Select a feature to continue" onclick="startBatch(${b.id})" class="disabled btn btn-sm btn-primary batch-button">Start batch</button></span></li>`
    }
    month_html += '</div>';
    return month_html;
}

function startBatch(id) {
    if ($("#batch-button-" + id).hasClass("disabled"))
        return;
    beginAnnotation(id, $("#batch-random-" + id).is(":checked"));
}
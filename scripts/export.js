$(document).ready(() => {
    // set max date for date select to be today
    $.get('/export-users', data => {
        let name_select = $("#user-select");
        $.each(data, (val, text) => {
            name_select.append(
                $('<option></option>').val(text).html(text)
            );
        });
    });

    $.get('/all-batch-info', data => {
        let batch_select = $("#batch-select");
        $.each(data, (i, batch) => {
            batch_select.append(
                $(`<option value="${batch.id}">${batch.batch_name}</option>`)
            );
        });
    });

    $.get('/feature-list', data => {
        let feature_select = $("#feature-select");
        $.each(data, (i, feature) => {
            feature_select.append(
                $(`<option value="${feature}">${feature}</option>`)
            );
        });  
    })

    document.getElementById('date-select').max = (new Date()).toISOString().substring(0, 10);
    $('#export-form').submit((ev) => {
        ev.preventDefault();
        let options = [];
        if (document.getElementById('user-check').checked) {
            options.push('name=' + $('#user-select option:selected')[0].value)
        }
        if (document.getElementById('date-check').checked) {
            options.push('before=' + $('#before-select option:selected')[0].value);
            options.push('date=' + document.getElementById('date-select').value);
        }
        if (document.getElementById('batch-check').checked) {
            options.push('batch=' + $("#batch-select option:selected")[0].value);
        }
        if (document.getElementById('feature-check').checked) {
            options.push('feature=' + $("#feature-select option:selected")[0].value);
        }
        window.location.href = '/export?' + options.join('&');
    });
});


function changePanel(name) {
    let panel = $(`#${name}-panel`);
    panel.toggleClass("panel-default panel-primary");
    let inputs = $("select, input[type!='checkbox']", panel);
    if (inputs.attr('disabled') === undefined) {
        inputs.attr('disabled', true);
    }
    else {
        inputs.removeAttr('disabled');
    }
}
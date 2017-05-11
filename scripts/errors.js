/**
 * Created by Matthew Bowden on 5/4/17.
 */
$.urlParam = function (a) {
    let b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null;
    } else {
        return decodeURI(b[1]) || 0;
    }
};

let modalDivServerContent = `
<div class="modal fade" id="err-modal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="alert alert-danger modal-header" style="margin-bottom: 0;">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h3 class="modal-title alert-danger">Something went wrong...</h3>
            </div>
            <div id="err-body" class="modal-body text-center lead">
            </div>
            <div id="err-panel" class="panel panel-warning" style="margin-bottom: 0;">
                <div class="panel-heading">
                    <h5 class="panel-title">
                        <a data-toggle="collapse" href="#err-panel-content">Server Output</a>
                    </h5>
                </div>
                <div id="err-panel-content" class="panel-collapse collapse">
                    <div class="panel-body">
                        <pre id="err-pre-text">Panel body</pre>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="err-dismiss" type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
`;

let showModalServerError;

// Author: Matthew
// Purpose: Create a common modal dialog that will display errors from the server
// Actions:
//      - add a modal component to the DOM
//      - change its text to the error message
//      - display the modal
// Inputs: jqXHR response error, redirect to homepage flag
// Outpus: None
showModalServerError = function(err, redirect) {
    if ($('#err-modal').length === 0) {
        $('body').append(modalDivServerContent);
    }
    if (redirect) {
        let homeAnchor = '/home';
        let name = $.urlParam('name');
        if (name) { homeAnchor += `?name=${name}`}
        $('#err-modal').on('hidden.bs.modal', function() {
            window.location.href = homeAnchor;
        })
    }
    try {
        let response = JSON.parse(err.responseText);
        let errMsg = response.client;
        let serverOutput = response.server;
        if (!errMsg && !serverOutput) {
            $('#err-body').text("Unexpected error response from server");
            $("#err-pre-text").text(JSON.stringify(err).replace(/,/g, ",\n"))
        }
        else {
            $('#err-body').text(errMsg);
            if (serverOutput) {
                $("#err-pre-text").text(JSON.stringify(serverOutput).replace(/,/g, ",\n"))
            }
            else {
                $("#err-panel").hide()
            }
        }
    }
    catch (exception) {
        $('#err-body').text("Unexpected error response from server");
        $("#err-pre-text").text(JSON.stringify(err).replace(/,/g, ",\n"))
    }
    finally {
        $('#err-modal').modal('show');
    }
};

let modalDivClientContent = `
<div class="modal fade" id="warn-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="alert alert-warning modal-header" style="margin-bottom: 0;">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h3 class="modal-title alert-warning">Something went wrong...</h3>
            </div>
            <div id="warn-body" class="modal-body text-center lead">
            </div>
            <div class="modal-footer">
                <button id="warn-dismiss" type="button" class="btn btn-warning" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
`;

let showModalClientError;

// Author: Matthew
// Purpose: Create a common modal dialog that will display errors from the client side in the form of warnings
// Actions:
//      - add a modal component to the DOM
//      - change its text to the error message
//      - display the modal
// Inputs: error message string
// Outpus: None
showModalClientError = function(errMsg, redirect) {
    if ($('#warn-modal').length === 0) {
        $('body').append(modalDivClientContent);
    }
    if (redirect) {
        console.log("Here");
        let homeAnchor = '/home';
        let name = $.urlParam('name');
        if (name) { homeAnchor += `?name=${name}`}
        $('#warn-modal').on('hidden.bs.modal', function() {
            window.location.href = homeAnchor;
        })
    }
    if (!errMsg) {
        $('#warn-body').text("Unexpected error on page");
    }
    else {
        $('#warn-body').text(errMsg);
    }
    $('#warn-modal').modal('show');
};

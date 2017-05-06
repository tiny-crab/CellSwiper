/**
 * Created by Matthew Bowden on 5/4/17.
 */

let modalDivContent = `
<div class="modal fade" id="err-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
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
                <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
`;

let showModalError;

// Author: Matthew
// Purpose: Create a common modal dialog that will display errors from the server
// Actions:
//      - add a modal component to the DOM
//      - change its text to the error message
//      - display the modal
// Outpus: None
showModalError = function(err_msg, server_output) {
    // let response = err.responseText;
    if ($('#err-modal').length === 0) {
        $('body').append(modalDivContent);
    }
    $('#err-body').text(err_msg);
    if (server_output) { $("#err-pre-text").text(server_output)}
    else { $("#err-panel").hide()}
    $('#err-modal').modal('show');
};
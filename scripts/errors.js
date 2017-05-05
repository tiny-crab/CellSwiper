/**
 * Created by Matthew Bowden on 5/4/17.
 */

let modalDivContent = `
<div class="modal fade" id="err-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="alert alert-danger modal-header" style="margin-bottom: 0;">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h3 class="modal-title alert-danger" id="myModalLabel">Something went wrong...</h3>
            </div>
            <div class="modal-body text-center">
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
showModalError = function(err) {
    // let response = err.responseText;
    if ($('#err-modal').length === 0) {
        $('body').append(modalDivContent);
    }
    $('#err-modal .modal-body').text(err);
    $('#err-modal').modal('show');
};
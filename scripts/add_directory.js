$(function() {
    $('.folder').click(function(ev) {
        if (ev.target !== this) {
            return;
        }
        $(ev.currentTarget).toggleClass('selected');
        ev.stopPropagation();
    });
});
months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

$(function() {
    $.get('/batch_list.json').fail(function(data) {
        data = [{original_dir: "home/aether/stuff", date_added: "2017-04-21 04:44:57.934", batch_name: "dstest"},
        {original_dir: "home/aether/other", date_added: "2017-03-21 04:44:57.934", batch_name: "evan-test"},
        {original_dir: "home/aether/whatever", date_added: "2016-06-21 04:44:57.934", batch_name: "other-test"}];

        batch_dict = {}
        let date_reg = /^(\d{4})-(\d{2})-(\d{2})/;
        for (let b of data) {

        }
    });
});
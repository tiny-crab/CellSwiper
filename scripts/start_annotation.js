//Logic for starting the annotation process

console.log("Start annotation script received");
var name;
var structure;

$(document).ready(() => {

    $("form").submit((e) => {
        e.preventDefault();
        if (!$("#name").val()) {
            alert("Name field not filled");
        }
        else if (!$("#structure").val()) {
            alert("Structure field not filled");
        }
        else {
            console.log("Form Filled");
            name = $("#name").val();
            structure = $("#structure").val();
            window.location.href = `annotation?index=0&name=${name}&structure=${structure}`;
        }
    });

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $("#sidebar").hide();
        let input_form = $(".submit-form");
        let form_container = $(".form-container");
        form_container.addClass("center-block");
        $("h1").css("font-size", "12vw");

    }

    $('input').blur(function () {

        // check if the input has any value (if we've typed into it)
        if ($(this).val())
            $(this).addClass('used');
        else
            $(this).removeClass('used');
    });
});

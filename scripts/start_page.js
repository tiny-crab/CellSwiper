//Logic for starting the annotation process

console.log("Start annotation script received");

$(document).ready(() => {
    $("form").submit((e) => {
        e.preventDefault();
        let name = $("#name").val();
        if (!name) {
            alert("Name field not filled");
        }
        else {
            console.log("Form Filled");
            $.post("insert_name", {name: name})
                .done(() => {
                    window.location.href = `home?&name=${name}&feature=${feature}`;
                })
                .fail(() => {
                    console.log(`Name is already in use, continuing as "${name}"`);
                    window.location.href = `home?name=${name}&feature=${feature}`;
                });
        }
    });

    // This block is activated when the client is on a mobile device.
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $("#sidebar").hide();
        let form_container = $(".form-container");
        form_container.addClass("center-block");
        $("h1").css("font-size", "12vw");

    }

    // This block is for the input values on the login screen, in order to keep the
    // masking text from falling back down once the user has typed in information.
    $('input').blur(function () {

        // check if the input has any value (if we've typed into it)
        if ($(this).val())
            $(this).addClass('used');
        else
            $(this).removeClass('used');
    });


});

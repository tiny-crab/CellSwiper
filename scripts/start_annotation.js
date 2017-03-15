//Logic for starting the annotation process

console.log("Start annotation script received");
var name;
var structure;

$(document).ready( ()=> {
	$("form").submit( (e)=> {
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
            $.post("insert_name", {name: name})
                .done((data) => {
                    window.location.href = `annotation?index=1&name=${name}&structure=${structure}`;
                })
                .fail(()=>{
                    alert(`Name is already in use, continuing as "${name}"`);
                    window.location.href = `annotation?index=1&name=${name}&structure=${structure}`;
                });
		}
	});

    // This block is activated when the client is on a mobile device.
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

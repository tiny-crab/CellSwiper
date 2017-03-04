//Logic for starting the annotation process

console.log("Start annotation script received");
var name;
var structure;

$(document).ready(() => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $("#sidebar").hide();
    }

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
});

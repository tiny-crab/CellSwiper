//Logic for starting the annotation process

console.log("Start annotation script received");
var name;
var structure;

$(document).ready( ()=> {
	$("#start").click( ()=> {
		if (!$("#name").val()) {
			alert("Name field not filled");
		}
		else if (!$("#structure").val()) {
			alert("Structure field not filled");
		}
		else {
			alert("Form Filled");
            name = $("#name").val();
            structure = $("#structure").val();
            window.open("annotation.html?index=0");
		}
	});
});


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
            window.location.href = `annotation?index=0&name=${name}&structure=${structure}`;
		}
	});
});

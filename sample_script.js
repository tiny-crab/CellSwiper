//test
console.log("Script received");
$(document).ready(function() {
	$("#yes").click(function() {
		console.log("Yes, clicked");
		$.get("confirm", function(data) {
			$("#stuff").html(data);
		});
	});
	$("#no").click(function() {
		console.log("No, clicked");
		$.get("deny", function(data) {
			$("#stuff").html(data);
		});
	});
	setInterval(function() {
		var marq = document.getElementsByTagName('marquee');
		for (let m of marq) {
			m.scrollAmount=Math.floor(Math.random() * 1000);
			m.direction = ['up','down','left','right'][Math.floor(Math.random() * 100) % 4];
		}
	}, 500);
});

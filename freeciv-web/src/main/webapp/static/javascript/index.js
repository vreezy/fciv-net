$(document).ready(function () { 

	(function ($) {
	
		$(function () {

			if (!Detector.webgl) {
	          $("#webgl_button").addClass("disabled");
	          $("#webgl_button").html("WebGL not enabled!");
			}
		});
	

	
	})($)
});

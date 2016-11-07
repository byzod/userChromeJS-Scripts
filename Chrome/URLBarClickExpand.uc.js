// ==UserScript==
// @id             URLBarClickExpand
// @version        0.1.0.20130517
// @namespace      URLBarClickExpand@Byzod.UC.js
// @author         Byzod
// @description    Click Url bar to expand...by hide others
// ==/UserScript==

var expandURLBar = function(isExpand){
	var toolbarItems = document.getElementById('nav-bar-customization-target').children;
	for(var i=0; i < toolbarItems.length; i++){
		if(toolbarItems[i].id !== "urlbar-container" 
			&& toolbarItems[i].id !=="btn_undoclose"){
			toolbarItems[i].style.display = (isExpand ? "none" : "");
		}
	}
}
document.getElementById("urlbar").addEventListener("focus", function(){expandURLBar(true)});
document.getElementById("urlbar").addEventListener("blur", function(){expandURLBar(false)});
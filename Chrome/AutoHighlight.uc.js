// ==UserScript==
// @name            AutoHighlight
// @namespace       AutoHighlight@Byzod.UC.js
// @description     查找时自动高亮
// @author          Byzod
// @version         0.3.0
// ==/UserScript==

var AutoHighlight = {
	HIGHLIGHT_THRESHOLD : 3,// Enable highlight when text length >= this value
	register: function(){
		window.addEventListener("TabFindInitialized", e=>{
			if(e.target._findBar){
				e.target._findBar._findField.addEventListener("input", this.observer, false);
			}else{
				alert("AutoHighlight: Can't bind observer, _findBar is null");
			}
		}, false);
	},
	observer: function(){
		if(gFindBar === null){
			alert("AutoHighlight: Can't highlight, gFindBar is null");
		}else{
			gFindBar.toggleHighlight(
				gFindBar._findField.value.length >= AutoHighlight.HIGHLIGHT_THRESHOLD
			);
		}
	}
}

if (location == "chrome://browser/content/browser.xul") {
	AutoHighlight.register();
}
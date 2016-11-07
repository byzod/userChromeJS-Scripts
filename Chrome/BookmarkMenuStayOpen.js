// ==UserScript==
// @name           BookmarkMenuStayOpen
// @version        0.1.0.20140321
// @namespace      BookmarkMenuStayOpen@Byzod.UC.js
// @author         custom.firefox.lady
// @modifier       Byzod
// @description    Stay open after click on bookmark menu
// ==/UserScript==

var BookmarkMenuStayOpen = function(){
	// derives new function from the fx in-built js one, but with the menu closing removed
	var origBMEH = BookmarksEventHandler.onClick.toString();
	// alert(origBMEH); //uncomment to quickly view what we got
	var menuClosingStr = "node.hidePopup();";
	if (origBMEH.indexOf("function BEH_onClick(aEvent, aView)") !== -1 && origBMEH.indexOf(menuClosingStr) !== -1) {
		origBMEH = origBMEH.replace("function BEH_onClick(aEvent, aView)", "");
		origBMEH = origBMEH.replace(menuClosingStr, "if (aEvent.button === 0) {node.hidePopup();}");
		BookmarksEventHandler.onClick = new Function("aEvent", "aView", origBMEH);
	}
	// alert(origBMEH); //uncomment to quickly view if we changed it successfully
	
	// Clear TMP undo close tab menu's handler
	if(TMP_ClosedTabs && TMP_ClosedTabs.checkForMiddleClick){
		origBMEH = TMP_ClosedTabs.checkForMiddleClick.toString();
		// alert(origBMEH); //uncomment to quickly view what we got
		menuClosingStr = "closeMenus(aEvent.target);";
		if (origBMEH.indexOf("function ct_checkForMiddleClick(aEvent)") !== -1 && origBMEH.indexOf(menuClosingStr) !== -1) {
			origBMEH = origBMEH.replace("function ct_checkForMiddleClick(aEvent)", "");
			origBMEH = origBMEH.replace(menuClosingStr, "{}");
			TMP_ClosedTabs.checkForMiddleClick = new Function("aEvent", origBMEH);
		}
		// alert(origBMEH); //uncomment to quickly view if we changed it successfully
	}
}

window.setTimeout( BookmarkMenuStayOpen, 100 );
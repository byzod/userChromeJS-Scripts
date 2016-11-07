// ==UserScript==
// @id             RetainSessionHistoryInNewTab
// @version        0.1.0.20130612
// @namespace      RetainSessionHistoryInNewTab@Byzod.UC.js
// @author         Byzod
// @modifiedfrom   ithinc
// @description    Retain Session History In New Tab
// ==/UserScript==

var SessionHistoryRetainer = {
	copyHistory : function(fromTab, newTab){
		try{
			
		let currentHistory = fromTab.linkedBrowser.sessionHistory;
		let newHistory = newTab.linkedBrowser.sessionHistory.QueryInterface(Ci.nsISHistoryInternal);
		/*TODO: linkedBrowser.sessionHistory is null*/
		for (let i = 0; i <= currentHistory.index; i++) {
			newHistory.addEntry(currentHistory.getEntryAtIndex(i, false), true);
		}
		
		} catch(ex){
			console.error(ex);
		}
	},
	
	initialize : function (e) {
		// Hack
		eval(
			"gBrowser.loadOneTab="
			+ gBrowser.loadOneTab.toString()
				.replace("{", "{\nvar currentTab = this.mCurrentTab;")
				.replace("return tab;",
						"if (aReferrerURI) {SessionHistoryRetainer.copyHistory(currentTab, tab);}"
						+ "\nreturn tab;")
		)
	},
};

if (window.location == "chrome://browser/content/browser.xul") {
	SessionHistoryRetainer.initialize();
}
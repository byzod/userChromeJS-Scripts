// ==UserScript==
// @id             GeneralMod
// @version        0.1.0.20140426
// @namespace      GeneralMod@Byzod.UC.js
// @author         Byzod
// @description    General modification
// ==/UserScript==

var GeneralMod = function(){
	// Use Ctrl+left/right to change tab
	this.CtrlPlusArrowKeyToChangeTab = function (event){
		if((event.keyCode == event.DOM_VK_LEFT || event.keyCode == event.DOM_VK_RIGHT)
			&& (event.ctrlKey && !event.shiftKey && !event.altKey)){
			event.stopPropagation();
			if(event.type == "keypress"){
				gBrowser.mTabContainer.advanceSelectedTab(event.keyCode == event.DOM_VK_LEFT ? -1 : 1, true);
				event.preventDefault();
			}
		}
	}
	
	// Session History On Tab Left Click
	this.SessionHistoryOnTabClick = function (event, self){
		var timeout = setTimeout(self.DelayedHistoryContextMenu, 333, event);
		event.target.onmouseout = function(){
			clearTimeout(timeout);
			this.onmouseout = null;
		};
	}
	this.DelayedHistoryContextMenu = function (event){
		if (event.button == 0){
			var backForwardMenu = document.getElementById("backForwardMenu");
			backForwardMenu.openPopupAtScreen(event.screenX, event.screenY, true);
		}
	}
	
	// Shift + click = force in current tab
	this.ShiftClickOpenLinksInCurrentTabListener = function (event) {
		if (event.shiftKey && event.button == 0) {
			event.preventDefault();
			let target = event.target;
			while (target.nodeType == Node.ELEMENT_NODE) {
				try {
					if ((target instanceof HTMLAnchorElement && target.href) ||
						(target instanceof HTMLAreaElement && target.href) ||
						target instanceof HTMLLinkElement){
						gBrowser.loadURI(target.href)
						break;
					} /*DEBUG*/ else{
						console.log(target.nodeName + ": " + target.href);
						/*TODO: first e.target is not content element but tabbrowser itself*/
					}
				} catch (ex) {
					console.error(ex); 
				}
				target = target.parentNode;
			}
		}
	}
	
	// Put edit bookmart panel in the center (before #aup-toolbarbutton)
	this.CenterEditBookmarkPanel = function(){
		var ebp = document.querySelector("#editBookmarkPanel");
		if(ebp){
			var ebpOpenPopupSource = ebp.openPopup.toString();
			if(ebpOpenPopupSource.match(/popupBox.openPopup\(aAnchorElement,/)){
				ebp.openPopup = new Function(
									"aAnchorElement",
									"aPosition",
									"aX",
									"aY",
									"aIsContextMenu",
									"aAttributesOverride",
									"aTriggerEvent",
									ebpOpenPopupSource
										.substr(ebpOpenPopupSource.indexOf("{"))
										.replace(
											"popupBox.openPopup(aAnchorElement",
											"popupBox.openPopup(document.querySelector(\"#aup-toolbarbutton\")"
										)
								);
			}else{
				/* Changed, we should update this script */
				alert("GeneralMod.CenterEditBookmarkPanel\nInjection failed, openPopup's signature is changed.\nIt's content:\n\n"
					+ ebpOpenPopupSource
				);
			}
		}else{
			// Edit bookmark panel is not found
			alert("GeneralMod.CenterEditBookmarkPanel\nEdit bookmark panel is not found.");
		}
	}
	
	// Prevent accidentally batch open bookmarks
	this.ConfirmCtrlOrShiftClickOnBookmarkFolder = function(){
		document.getElementById("PlacesToolbarItems").onclick = e=>{
			// debug
			// window.ee = e;
			if(((e.button == 0 && !e.altKey && (e.ctrlKey || e.shiftKey)) || (e.button == 1)) /* open with ctrl/shift+LMB or MMB*/
				&& e.target.getAttribute("container") === "true"){ /* is it click on bookmark folder */
				if(!confirm("是否要" + (e.shiftKey?"在新窗口":"") + "一次打开全部标签页？")){
					e.preventDefault();
					e.stopPropagation();
				}
			}
		}
	}
	
	// Change accesskey of dTa OneClick
	this.ChangedTaOneClickAccessKey = function(e, self){
		var dtaClickOneKey = document.getElementById("dtaCtxSaveLinkT-direct");
		if(dtaClickOneKey && dtaClickOneKey.getAttribute("accesskey") !== "d"){
			document.removeEventListener("contextmenu", self.ChangedTaOneClickAccessKey);
			document.getElementById("dtaCtxSaveLinkT-direct").setAttribute("accesskey", "d");
		}
	}
	
	// Change default white page background to grey
	this.GreyOutWhitePageBackground = function(e){
		bgColor = window.getComputedStyle(e.target.body).backgroundColor;
		if(bgColor != "transparent"){
			var RGBValuesArray = bgColor.match(/\d+/g); //get rgb values
			var red   = RGBValuesArray[0];
			var green = RGBValuesArray[1];
			var blue  = RGBValuesArray[2];
			if(red > 240 && green > 240 && blue > 240){
				e.target.body.style.backgroundColor = "rgb(233, 233, 233)";
			}
		}else{
			// Let's grey it out anyway
			e.target.body.style.backgroundColor = "rgb(233, 233, 233)";
		}
	}
	
	// Misc simple modification
	this.MiscChange = function(){
		// Small icon
		document.getElementById("aup-toolbarbutton").classList.remove("toolbarbutton-1");
		document.getElementById("btn_undoclose").classList.remove("toolbarbutton-1");
		// Change access key of view to use alt+V keytweak
		document.getElementById("view-menu").setAttribute("accesskey", "K");
	}
	
	// Tweak grease monkey
	this.GreaseMoneyPlus = function(){
		// Change GM button behavior
		var gmBtn = document.querySelector("#greasemonkey-tbb");
		document.getAnonymousElementByAttribute(
			gmBtn,
			"anonid",
			"button"
		).onclick = function(event){
						if(event.button == 2){
							event.stopPropagation();
							event.preventDefault();
							this.parentNode.firstChild.showPopup();
						}
					};
		// Change 'get scripts' behavior (open greasyfork)
		var gmGetScripts = gmBtn.querySelector("menuitem[label='获取用户脚本']");
		gmGetScripts.setAttribute("oncommand", "GM_BrowserUI.openTab('https://greasyfork.org/');");
	}
	
	// Initialize
	this.Init = function (){
		var self = this;
		window.addEventListener("keypress", this.CtrlPlusArrowKeyToChangeTab, true);
		window.addEventListener("keyup", this.CtrlPlusArrowKeyToChangeTab, true);
		window.addEventListener("keydown", this.CtrlPlusArrowKeyToChangeTab, true);
		gBrowser.tabContainer.addEventListener("click", e=>{this.SessionHistoryOnTabClick(e, self);}, false);
		gBrowser.addEventListener("click", this.ShiftClickOpenLinksInCurrentTabListener, true);
		this.CenterEditBookmarkPanel();
		this.ConfirmCtrlOrShiftClickOnBookmarkFolder();
		this.GreaseMoneyPlus();
		document.getElementById("contentAreaContextMenu")
			.addEventListener("popupshowing", e=>{this.ChangedTaOneClickAccessKey(e, self);}, false);
		window.addEventListener("DOMContentLoaded", this.GreyOutWhitePageBackground, true);
		
		this.MiscChange();
	}
}

if (window.location == "chrome://browser/content/browser.xul") {
	new GeneralMod().Init();
}
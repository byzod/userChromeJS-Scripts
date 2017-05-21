// ==UserScript==
// @id             GeneralMod
// @version        0.2.1.201704017
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
	
	// Shift + click = force in current tab #BAD
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
						// console.log(target.nodeName + ": " + target.href);
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
			dtaClickOneKey.setAttribute("accesskey", "d");
		}
	}
	
	// Change accesskey of send xxx to device
	this.ChangeSendToDeviceAccessKey = function(e, self){
		var sendLinkKey = document.getElementById("context-sendlinktodevice");
		var sendPageKey = document.getElementById("context-sendpagetodevice");
		if(sendLinkKey && sendPageKey){
			document.removeEventListener("contextmenu", self.ChangeSendToDeviceAccessKey);
			sendLinkKey.setAttribute("accesskey", "t");
			sendPageKey.setAttribute("accesskey", "t");
		}
	}
	
	// Tweak grease monkey #BAD
	this.GreaseMoneyPlus = function(){
		// Change GM button behavior
		var tb = document.querySelector("#TabsToolbar");
		tb.addEventListener(
			"contextmenu",
			function(e){
				if(e.target.id == "greasemonkey-tbb" && e.button == 2){
					e.stopPropagation();
					e.preventDefault();
					e.target.firstChild.showPopup();
				}
			},
			false
		);
		
		// Change 'get scripts' behavior (open greasyfork)
		var gmBtn = document.querySelector("#greasemonkey-tbb");
		var gmGetScripts = gmBtn.querySelector("menuitem[label='获取用户脚本']");
		gmGetScripts.setAttribute("oncommand", "GM_BrowserUI.openTab('https://greasyfork.org/');");
	}
	
	// Add copy tab title to tab context menu
	this.AddCopyTabTitleMenuitem = function(){
		var menu = document.getElementById("tabContextMenu");
		var item = document.createElement("menuitem");
		item.setAttribute("id", "bv-copyTabTitle");
		item.setAttribute("accesskey", "X");
		item.setAttribute("label", "复制标签页标题");
		item.setAttribute("oncommand", "Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper).copyString(TabContextMenu.contextTab.linkedBrowser.contentTitle);");
		menu.appendChild(item);
	}
	
	// Close current tab when double click RMB
	this.CloseCurrentTabByDoubleClickRMB = function(){
		// gBrowser.mPanelContainer.addEventListener(
			// 'dblclick', 
			// (e)=>{
				// if(e.button == 2){
					// e.preventDefault();
					// e.stopPropagation();
					// if (gBrowser.selectedTab.getAttribute("pinned") !== "true") {
						// gBrowser.removeCurrentTab();
						// document.getElementById("contentAreaContextMenu").hidePopup();
						// setTimeout(e=>document.getElementById("contentAreaContextMenu").hidePopup(), 50);
					// }
				// }
			// }, 
			// true
		// );
		
		(new RightClickTabKiller()).Init(gBrowser.mPanelContainer);
		
		function RightClickTabKiller(){
			var self = this;
			this.isDblClicked = false;
			this.DbclickListener = e=>{
				if(e.button === 2){
					self.isDblClicked = true;
					// console.log(Date.now() + " dblclick: isDblClicked = true");//DEBUG
				}
			}
			this.ContextmenuListener = e=>{
				// console.log(Date.now() + " contextmenu: isDblClicked == " + self.isDblClicked);//DEBUG
				if(self.isDblClicked && e.button === 2){
					e.preventDefault();
					e.stopPropagation();
					if (gBrowser.selectedTab.getAttribute("pinned") !== "true") {
						gBrowser.removeCurrentTab();
						document.getElementById("contentAreaContextMenu").hidePopup();
						// console.log(Date.now() + " contextmenu: hidePopup()");//DEBUG
					}
				}
				self.isDblClicked = false;
			}
			this.Init = contentContainer=>{
				contentContainer.addEventListener("dblclick", self.DbclickListener, true);
				contentContainer.addEventListener("contextmenu", self.ContextmenuListener, true);
			}
		}
	}
	
	// Add context item: open current page in private window
	this.AddOpenInPrivateWindowContextMenuItem = function(){
		var menu = document.querySelector('#contentAreaContextMenu');
		var item = document.createElement("menuitem");
		item.setAttribute("id", "bv-context-opencurrenttabprivate");
		item.setAttribute("label", "在隐私窗口打开当前页");
		item.setAttribute("oncommand", 'openLinkIn(gBrowser.contentWindow.location.href,"window",gContextMenu._openLinkInParameters({"private": "true"}));');
		// menu.insertBefore(item, document.querySelector('#context-openlinkprivate'));
		menu.appendChild(item);
	}
	
	// Misc simple modification
	this.MiscChange = function(){
		// Small icon
		document.getElementById("aup-toolbarbutton").classList.remove("toolbarbutton-1");
		document.getElementById("btn_undoclose").classList.remove("toolbarbutton-1");
		// Change access key of view to use alt+V keytweak
		document.getElementById("view-menu").setAttribute("accesskey", "K");
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
		this.AddCopyTabTitleMenuitem();
		document.getElementById("contentAreaContextMenu")
			.addEventListener("popupshowing", e=>{this.ChangedTaOneClickAccessKey(e, self);}, false);
		document.getElementById("contentAreaContextMenu")
			.addEventListener("popupshowing", e=>{this.ChangeSendToDeviceAccessKey(e, self);}, false);
		this.CloseCurrentTabByDoubleClickRMB();
		this.AddOpenInPrivateWindowContextMenuItem();
		this.MiscChange();
	}
}

if (window.location == "chrome://browser/content/browser.xul") {
	new GeneralMod().Init();
}
// ==UserScript==
// @id             DragToGo #BAD
// @version        2017-5-22
// @namespace      DragToGo@ziyunfei
// @author         ziyunfei
// @modifier       Byzod
// @description    DragToGo
// ==/UserScript==
 
if(location == "chrome://browser/content/browser.xul"){
	(function(event) {
		var self = arguments.callee;
		// Drag timeout, ms
		self.DRAG_TIMEOUT = 300;
		// We're ready to handle a drop event
		self.readyForDrop = true;
		// Used for timeout
		self.dragTimeoutStart = function(){
			window.clearTimeout(self._Timer);
			self.readyForDrop = true;
			self._Timer = window.setTimeout(()=>{
					self.readyForDrop = false;
					// console.log("DragToGo: timeout(" + self._Timer + ") timeouted.");// DEBUG
					// console.log("DragToGo: timeout event, readyForDrop: " + self.readyForDrop);// DEBUG
				}, self.DRAG_TIMEOUT);
			// console.log("DragToGo: timeout(" + self._Timer + ") started.");// DEBUG
		}
		// URL guess
		self.seemAsURL = function (url) {
			// url test
			var DomainName = /(\w+(\-+\w+)*\.)+\w{2,7}/;
			var HasSpace = /\S\s+\S/;
			var KnowNameOrSlash = /^(www|bbs|forum|blog)|\//;
			var KnowTopDomain1 = /\.(com|net|org|gov|edu|info|mobi|mil|asia)$/;
			var KnowTopDomain2 = /\.(de|uk|eu|nl|it|cn|be|us|br|jp|ch|fr|at|se|es|cz|pt|ca|ru|hk|tw|pl|me|tv|cc)$/;
			var IsIpAddress = /^([1-2]?\d?\d\.){3}[1-2]?\d?\d/;
			var seemAsURL = !HasSpace.test(url) 
							&& DomainName.test(url) 
							&& (KnowNameOrSlash.test(url) 
								|| KnowTopDomain1.test(url) 
								|| KnowTopDomain2.test(url) 
								|| IsIpAddress.test(url)
								);
			return seemAsURL;
		}
		
		if (!event) {
			["dragstart", "dragover", "drop"].forEach(function(type) {
				gBrowser.mPanelContainer.addEventListener(type, self, false);
			});
			window.addEventListener("unload", function() {
				["dragstart", "dragover", "drop"].forEach(function(type) {
					gBrowser.mPanelContainer.removeEventListener(type, self, false);
				});
			}, false);
			return;
		}
		switch (event.type) {
			case "dragstart":
				{
					self.startPoint = [event.screenX, event.screenY];
					self.sourceNode = event.target;
					if(event.target.localName == "img"){
						event.dataTransfer.setData("application/x-moz-file-promise-url", event.target.src);
					}
					self.dragTimeoutStart();
					break;
				}
			case "dragover":
				{
					if(self.readyForDrop && self.startPoint) {
						Components.classes["@mozilla.org/widget/dragservice;1"]
							.getService(Components.interfaces.nsIDragService)
							.getCurrentSession().canDrop = true;
					}
					// Timeout check
					// console.log("DragToGo: Dragover event, readyForDrop: " + self.readyForDrop);// DEBUG
					break;
				}
			case "drop":
				{
					// Timeout check
					// console.log("DragToGo: Drop event, readyForDrop: " + self.readyForDrop);// DEBUG
					// console.dir(event);// DEBUG
					window.clearTimeout(self._Timer);
					
					// console.log("DTG: Drop");/*DEBUG*/
					if(self.readyForDrop == false){
						// Quit point
						self.startPoint = null;
						return;
					}
					
					// console.log("DTG: ReadyForDrop");/*DEBUG*/
					if (event.target.localName != "textarea" 
						&& !(event.target.localName == "input" 
								&& (event.target.type == "text" || event.target.type == "password")
							)
						&& event.target.contentEditable != "true"
					) {
						// console.log("DTG: sp %o", self.startPoint);/*DEBUG*/
						if(self.startPoint){
							event.preventDefault();
							event.stopPropagation();
							var [subX, subY] = [event.screenX - self.startPoint[0], event.screenY - self.startPoint[1]];
							var [distX, distY] = [(subX > 0 ? subX : (-subX)), (subY > 0 ? subY : (-subY))];
							var direction;
							if (distX > distY) direction = subX < 0 ? "L" : "R";
							else direction = subY < 0 ? "U" : "D";
							var aReferrerURI = gBrowser.currentURI;
							if (event.dataTransfer.types.contains("application/x-moz-file-promise-url")) {
								if (direction == "U") {
									//前台搜索相似图片(Google)
									gBrowser.loadOneTab(
										"https://www.google.com/searchbyimage?image_url=" 
											+ encodeURIComponent(event.dataTransfer.getData("application/x-moz-file-promise-url")),
										{
											referrerURI: aReferrerURI, 
											inBackground: false
										}
									);
								}
								if (direction == "D") {
									//保存图片到Q:\\Down
									var aSrc = event.dataTransfer.getData("application/x-moz-file-promise-url");
									var fileName = aSrc.substr(aSrc.lastIndexOf('/') + 1);
									var fileSaving = Components.classes["@mozilla.org/file/local;1"].
											createInstance(Components.interfaces.nsILocalFile);
									fileSaving.initWithPath("Q:\\Down");
									fileSaving.append(fileName.replace(/(\.\w+)[^\.]*$/g, "$1").replace(/[<>:"/\\\|\?\*]/gi, '_'));
									
									var options = {
										source: aSrc,
										target: fileSaving,
									};
									Cu.import("resource://gre/modules/Downloads.jsm");
									var downloadPromise = Downloads.createDownload(options);
									downloadPromise.then(function success(d) {
										d.start();
										Notification.requestPermission(()=>{
											var n = new Notification(fileName + "已下载");
											setTimeout(n.close.bind(n), 1500);
										});
									});
								}
								if (direction == "L") {
									//前台打开图片
									gBrowser.loadOneTab(
										event.dataTransfer
											.getData("application/x-moz-file-promise-url")
											.split("\n")[0],
										{
											referrerURI: aReferrerURI, 
											inBackground: false
										}
									);
								}
								if (direction == "R") {
									//后台打开图片链接
									if (event.dataTransfer.types.contains("text/x-moz-url")){
										gBrowser.loadOneTab(
											event.dataTransfer.getData("text/x-moz-url").split("\n")[0],
											{
												referrerURI: aReferrerURI, 
												inBackground: true
											}
										);
									}
								}
							} else if (event.dataTransfer.types.contains("text/x-moz-url")) {
								if (direction == "U") {
									//在当前标签打开链接
									loadURI(event.dataTransfer.getData("text/x-moz-url").split("\n")[0]);
								}
								if (direction == "D") {
									//链接另存为
									var doc = event.target.ownerDocument;
									var ref = makeURI(doc.location.href, doc.characterSet);
									saveURL(event.dataTransfer.getData("text/x-moz-url")
										.split("\n")[0], null, null, true, false, ref, doc
									);
								}
								if (direction == "L") {
									//前台打开链接
									gBrowser.loadOneTab(
										event.dataTransfer.getData("text/x-moz-url").split("\n")[0],
										{
											referrerURI: aReferrerURI, 
											inBackground: false
										}
									);
								}
								if (direction == "R") {
									//后台打开链接
									gBrowser.loadOneTab(
										event.dataTransfer.getData("text/x-moz-url").split("\n")[0],
										{
											referrerURI: aReferrerURI, 
											inBackground: true
										}
									);
								}
							} else {
								var dragStr = event.dataTransfer.getData("text/unicode");
								var searchStrInSite = "site:" + getTopWin().getBrowser().currentURI.host + " " + dragStr;
								var Ss = Components.classes["@mozilla.org/browser/search-service;1"]
										.getService(Components.interfaces.nsIBrowserSearchService);
								var engine = Ss.currentEngine;
								if (direction == "U") {
									//搜索并高亮文字
									gFindBar.onFindCommand();
									setTimeout(()=>{gFindBar.toggleHighlight(false)}, 10);
									setTimeout(()=>{gFindBar.toggleHighlight(true)}, 20);
								}
								if (direction == "D") {
									//复制文字
									Components.classes["@mozilla.org/widget/clipboardhelper;1"]
										.getService(Components.interfaces.nsIClipboardHelper)
										.copyString(dragStr);
								}
								if (direction == "L") {
									//站内前台搜索文字
									gBrowser.loadOneTab(
										engine.getSubmission(searchStrInSite, null).uri.spec,
										{
											referrerURI: aReferrerURI, 
											inBackground: false
										}
									);
								}
								if (direction == "R") {
									//后台搜索文字, 若看起来像URL，尝试后台打开
									if(self.seemAsURL(dragStr)){
										gBrowser.loadOneTab(
											dragStr,
											{
												referrerURI: aReferrerURI, 
												inBackground: true
											}
										);
									} else {
										gBrowser.loadOneTab(
											engine.getSubmission(dragStr, null).uri.spec,
											{
												referrerURI: aReferrerURI, 
												inBackground: true
											}
										);
									}
								}
							}
						} else {
							// Maybe it's external links
							// External link handler
							// console.dir(event);/*DEBUG*/
							
							// Contains files, let the browser handle it
							if (event.dataTransfer.types.contains("Files")){
								// Do nothing;
							} else if (event.dataTransfer.types.contains("text/plain")){
								// Contains text
								var dragStr = event.dataTransfer.getData("text/unicode");
								if(dragStr.length > 0){
									var Ss = Components.classes["@mozilla.org/browser/search-service;1"]
											.getService(Components.interfaces.nsIBrowserSearchService);
									var engine = Ss.currentEngine;
									//前台搜索文字, 若看起来像URL，尝试前台打开
									if(self.seemAsURL(dragStr)){
										gBrowser.loadOneTab(
											dragStr,
											{
												referrerURI: aReferrerURI, 
												inBackground: false
											}
										);
									} else {
										gBrowser.loadOneTab(
											engine.getSubmission(dragStr, null).uri.spec,
											{
												referrerURI: aReferrerURI, 
												inBackground: false
											}
										);
									}
									event.preventDefault();
									event.stopPropagation();
								} else {
									// 0 length string, wtf? ... let's skip it
									// Do nothing
								}
							}
							// else do nothing
						}
					}
					
					// Reset status
					self.startPoint = null;
					self.readyForDrop = true;
				}
		}
	})();
}
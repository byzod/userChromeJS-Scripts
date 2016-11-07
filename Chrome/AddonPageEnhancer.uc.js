// ==UserScript==
// @name           AddonPageEnhancer
// @version        0.1.13
// @namespace      AddonPageEnhancer@Byzod.UC.js
// @author         Byzod
// @description    Small enhance of the about:addon page
// ==/UserScript==

var AddonPageEnhancer = function(){
	this.TargetAddon = null;
	this.doc = null;
	
	this.OnContextmenuHandler = function(self, e){
		self.TargetAddon = e.target.mAddon;
		if(!self.doc.getElementById("context-openAddonPageOnAMO")){
			self.AddContextMenuItem(self);
		}
	}
	
	this.AddContextMenuItem = function(self){
		var pop = self.doc.getElementById("addonitem-popup");
		if(pop){
			var mOpenAddonPage = self.doc.createElement("menuitem");
			mOpenAddonPage.setAttribute("id", "context-openAddonPageOnAMO");
			mOpenAddonPage.setAttribute("label", "打开扩展AMO页面");
			mOpenAddonPage.addEventListener('mouseup', (e)=>self.OpenAddonPageOnAMO(self, e), false);
			pop.insertBefore(mOpenAddonPage, self.doc.getElementById("menuitem_enableItem"))
		}else{
			alert("AddonPageEnhancer is broken, addonitem-popup is missing");
		}
	}
	
	this.OpenAddonPageOnAMO = function(self, e){
		if(self.TargetAddon !== null){
			gBrowser.addTab(self.TargetAddon.reviewURL.replace(/\/reviews\/\?src=api/,""));
		}
	}
	
	this.PageLoadHandler = function(self, e){
		if(["about:addons","chrome://mozapps/content/extensions/extensions.xul"].indexOf(e.target.URL) > -1){
			self.doc = e.target;
			self.doc.addEventListener('contextmenu', (e)=>self.OnContextmenuHandler(self, e), false);
		}
	}
	
	this.Init = function(){
		var self = this;
		document.addEventListener("DOMContentLoaded", (e)=>this.PageLoadHandler(self, e), false);
	}
}

if (location == "chrome://browser/content/browser.xul") {
	var APE = new AddonPageEnhancer();
	APE.Init();
}
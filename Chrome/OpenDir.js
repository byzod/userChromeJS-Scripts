// ==UserScript==
// @id             OpenDir
// @version        0.1.0.20130517
// @namespace      OpenDir@Byzod.UC.js
// @author         rmflow
// @modifier       Byzod
// @description    Open Local Folder for Windows
// ==/UserScript==

window.OpenDir = function(path)
{
    if (path == "")
    {
        alert("Directory not defined");
        return;
    }
    if(navigator.userAgent.indexOf("Firefox") == -1)
    {
        alert("Currently active folder links supported only for Mozilla Firefox web browser");
        return;
    }
    var localFile = 
        Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);

    var env =
        Components.classes["@mozilla.org/process/environment;1"]
        .createInstance(Components.interfaces.nsIEnvironment);

    var systemRoot = env.get("SystemRoot");
    if (systemRoot == "")
    {
        alert("Unable to retrieve SystemRoot environment variable");
    }

    localFile.initWithPath(systemRoot + "\\explorer.exe");
    var process =
        Components.classes["@mozilla.org/process/util;1"]
        .createInstance(Components.interfaces.nsIProcess);
    process.init(localFile);
    process.run(false, Array(path), 1);
}
var viewTabId = 0;
chrome.browserAction.onClicked.addListener(function() {
    var n = chrome.extension.getURL("mainpage.html");
    if (viewTabId != 0) try {
        chrome.tabs.remove(viewTabId, function() {})
    } catch (t) {
        console.log(t)
    }
    chrome.tabs.create({
        url: n
    })
});

var mlog =  function(m) {
                console.log(m);
                if(localStorage.mlog){
                    localStorage.mlog += m + "\n";
                } else {
                    localStorage.mlog = m + "\n";
                }
            }

chrome.webRequest.onHeadersReceived.addListener(function(n) {
    mlog(n.url);
}, {
    urls: ["<all_urls>"]
}, ["responseHeaders"]);

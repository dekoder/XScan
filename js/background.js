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

var isEmptyObject = function(v){
    if(Object.prototype.toString.apply(v) !== '[object Object]') return false;
    for(var p in v) {
        if(v.hasOwnProperty(p)) return false;
    }
    return true;
};

var query2params = function(query) {
    var params = {};
    items = query.split("&");
    if (items[0] === "")
        return params;
    for (var i=0;i<items.length;i++) {
        sep = items[i].split("=");
        params[sep[0]] = sep[1];
    }
    return params;
}

var params2query = function(params) {
    var query = "";
    for (key in params) {
        query += key + "=" + params[key] + "&";
    }
    return query.substring(0, query.length-1);
}


var url2object = function(url) {
    /*
        /a/b
        /a/b#aabb
        /a/b#a=1&b=2
        /a/b#cc?a=1&b=2
        /a/b#?a=1&b=2
        /a/b?a=1&b=2
        /a/b?a=1&b=2#aabb
    */
    var url_object = {};
    var path = "";
    var fragment = "";
    var query = "";
    var fragment_first = false; // true: fragment first; false: query first
    var queries_tag = url.indexOf("?");
    var fragment_tag = url.indexOf("#");
    if (fragment_tag < queries_tag) {
        fragment_first = true;
        path = url.substring(0, fragment_tag);
        if (fragment_tag != -1) {
            fragment = url.substring(fragment_tag+1, queries_tag);
            query = url.substring(queries_tag+1);
        } else {
            if (queries_tag != -1) {
                query = url.substring(queries_tag+1);
            }
        }
    } else {
        if (queries_tag != -1) {
            path = url.substring(0, queries_tag);
            query = url.substring(queries_tag+1, fragment_tag);
            fragment = url.substring(fragment_tag+1);
        } else {
            path = url.substring(0, fragment_tag);
            if (fragment_tag != -1) {
                fragment = url.substring(fragment_tag+1);
            }
        }
    }
    if (fragment_tag === queries_tag) {
        path = url;
    }

    params = query2params(query);
    url_object.fragment_first = fragment_first;


    url_object.path = path;
    url_object.fragment = fragment;
    url_object.params = params;

    return url_object;
}

var object2url = function(url_object) {
    url = url_object.path
    if (url_object.fragment_first === true) {
        if (url_object.fragment) {
            url += "#" + url_object.fragment;
        }
        if (!isEmptyObject(url_object.params)) {
            console.log(url_object.params);
            url += "?" + params2query(url_object.params);
        }
    } else {
        if (!isEmptyObject(url_object.params)) {
            console.log(url_object.params);
            url += "?" + params2query(url_object.params);
        }
        if (url_object.fragment) {
            url += "#" + url_object.fragment;
        }
    }

    return url;
}

var test_object2url = function(url){
    furl = object2url(url2object(url));
    if (furl != url) {
        console.log("ourl:"+url);
        console.log("furl:"+furl);
    }
}

var mlog =  function(url) {
                console.log(m);
                if(localStorage.mlog){
                    localStorage.mlog += url + "\n";
                } else {
                    localStorage.mlog = url + "\n";
                }
            }

var action = function(url) {
    if(!localStorage.urls) 
        localStorage.urls = JSON.stringify({});
    urls = JSON.parse(localStorage.urls);
    console.log(url);
    var url_object = url2object(url);
    var changes = {params:[], fragment:false};
    if (url_object.path in urls) {
        var old_object = urls[url_object.path];
        for (key in url_object.params) {
            if (!(key in old_object.params)) {
                old_object.params[key] = url_object.params[key];
                changes.params.push(key);
            }
        }
        if (old_object.fragment == "" && url_object.fragment != ""){
            old_object.fragment = url_object.fragment;
            changes.fragment = true;
        }
        urls[url_object.path] = old_object;
    } else {
        urls[url_object.path] = url_object;
        for (key in url_object.params) {
            changes.params.push(key);
        }
        if (url_object.fragment != ""){
            changes.fragment = true;
        }
    }
    localStorage.urls = JSON.stringify(urls);
    console.log(changes);
}

chrome.webRequest.onHeadersReceived.addListener(function(n) {
    action(n.url);
}, {
    urls: ["<all_urls>"]
}, ["responseHeaders"]);

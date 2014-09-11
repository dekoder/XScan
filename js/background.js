var check_ref = function (url_object, changes) {
    //var poc = ["ti<lihrt", "ceqre>wre", "cferw\"gfw", "e3w'f4ff", "vrevr&ttrbg", "rfewvr\\brt"];
    if (changes.fragment === true) {
        check_char(url_object, changes.fragment, "fragment", "<");
    };
    if (changes.params.length > 0) {
        for(var i=0;i<changes.params.length;i++) {
            check_char(url_object, changes.params[i], "params", "<");
            check_quote(url_object, changes.params[i], "params");
        };
    };
}

var check_httponly = function(n) {
    var url = n.url;
    cookies = chrome.cookies.getAll({url:url}, function(cookies){
        var ho_cookies = {};
        for (var i = cookies.length - 1; i >= 0; i--) {
            if (cookies[i].httpOnly === true) {
                ho_cookies[cookies[i].name] = cookies[i].value;
            }
        };
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            var resp = xhr.responseText;
            var leaks = [];
            var unleaks = []
            for (name in ho_cookies) {
                if (resp.indexOf(ho_cookies[name]) > -1) {
                    leaks.push(name);
                } else {
                    unleaks.push(name);
                }
            }
            if (leaks.length != 0) {
                summary = leaks.join(",") + "||" + unleaks.join(",");
                obj = {type: "httpOnly", summary:summary};
                add_result(url, obj);
            }
          }
        };
        xhr.open("GET", url, true);
        xhr.send();
    });
}

//对于新url的检测
var check_newurl = function(n) {
    check_httponly(n);
}

var check_quote = function(url_object, mark, type) {
    var poc = "dasfrefr";
    var t = JSON.parse(JSON.stringify(url_object));
    if (type === "params") {
        t.params[mark] += poc;
    } else if (type === "fragment") {
        t.fragment += point;
    }
    var url = object2url(t);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        var resp = xhr.responseText;
        if (resp.indexOf(poc) > -1) {
            reg1 = RegExp('<[^>]+"[^>\'"]+'+poc);
            reg2 = RegExp("<[^>]+'[^>'\"]+"+poc);
            //console.log(reg1);
            //console.log(reg2);
            if (resp.search(reg1) > -1) {
                console.log("1true");
                console.log(resp.match(reg1));
                check_char(url_object, mark, "params", "\"");
            }
            if (resp.search(reg2) > -1) {
                console.log("2true");
                console.log(resp.match(reg2));
                check_char(url_object, mark, "params", "'");
            }
        }
      }
    };          
    xhr.open("GET", url, true);
    xhr.send();
};

var check_char = function(url_object, mark, type, lchar) {
    var poc = "ti"+lchar+"lihrt";
    var point = encodeURIComponent(poc);
    var t = JSON.parse(JSON.stringify(url_object));
    if (type === "fragment") {
        t.fragment += point;
    }
    if (type === "params") {
        t.params[mark] += point;
    }
    var url = object2url(t);
    check_char_weak(url, point);
};

var check_char_weak = function(url, point) {
    //console.log(url);
    var xhr = new XMLHttpRequest();
    var poc = decodeURIComponent(point);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        var resp = xhr.responseText;
        console.log(point);
        //console.log(resp);
        if (resp.indexOf(poc) > -1) {
            console.log("get");
            var obj = {type: "rXSS"};
            add_result(url, obj);
        }
      }
    };          
    xhr.open("GET", url, true);
    xhr.send();
}

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
    if (fragment_tag === queries_tag) {
        path = url;
    } else if (fragment_tag < queries_tag) {
        if (fragment_tag != -1) {
            path = url.substring(0, fragment_tag);
            fragment_first = true;
            fragment = url.substring(fragment_tag+1, queries_tag);
            query = url.substring(queries_tag+1);
        } else {
            path = url.substring(0, queries_tag);
            query = url.substring(queries_tag+1);
        }
    } else {
        if (queries_tag != -1) {
            path = url.substring(0, queries_tag);
            query = url.substring(queries_tag+1, fragment_tag);
            fragment = url.substring(fragment_tag+1);
        } else {
            path = url.substring(0, fragment_tag);
            fragment = url.substring(fragment_tag+1);
        }
    }

    params = query2params(query);
    url_object.fragment_first = fragment_first;


    url_object.path = path;
    url_object.fragment = fragment;
    url_object.params = params;

    return url_object;
}

var object2url = function(url_object) {
    var url = url_object.path
    if (url_object.fragment_first === true) {
        if (url_object.fragment) {
            url += "#" + url_object.fragment;
        }
        if (!isEmptyObject(url_object.params)) {
            //console.log(url_object.params);
            url += "?" + params2query(url_object.params);
        }
    } else {
        if (!isEmptyObject(url_object.params)) {
            //console.log(url_object.params);
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

var add_result = function(url, object) {
    if(!localStorage.weaks) 
        localStorage.weaks = JSON.stringify({});
    weaks = JSON.parse(localStorage.weaks);
    weaks[url] = object;
    localStorage.weaks = JSON.stringify(weaks);
}

var action = function(n) {
    var url = n.url;
    if(!localStorage.urls) 
        localStorage.urls = JSON.stringify({});
    urls = JSON.parse(localStorage.urls);
    console.log("ourl:"+url);
    var url_object = url2object(url);
    //console.log(url_object);
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
        check_newurl(n);
    }
    localStorage.urls = JSON.stringify(urls);
    console.log(changes);

    if (["main_frame", "sub_frame", "object", "xmlhttprequest", "other"].join("").indexOf(n.type) > -1) {
        headers = n.responseHeaders;
        for (var i=0;i<headers.length;i++) {
            if (headers[i].name === "Content-Type") {
                if (headers[i].value.indexOf("json") === -1 && headers[i].value.indexOf("javascript") === -1){
                    check_ref(url_object, changes);
                } else {
                    console.log("json or javascript");
                }
            }
        }
    }

}

var viewTabId = 0;
chrome.browserAction.onClicked.addListener(function() {
    var n = chrome.extension.getURL("show.html");
    if (viewTabId != 0) try {
        chrome.tabs.remove(viewTabId, function() {})
    } catch (t) {
        console.log(t)
    }
    chrome.tabs.create({
        url: n
    })
});


chrome.webRequest.onHeadersReceived.addListener(function(n) {
    console.log(n.type);
    action(n);

}, {
    urls: ["<all_urls>"]
}, ["responseHeaders"]);

/*
chrome.webRequest.onSendHeaders.addListener(function(n){
    var url = n.url;
    if(!localStorage.urls) 
        localStorage.urls = JSON.stringify({});
    urls = JSON.parse(localStorage.urls);
    var url_object = url2object(url);
    if (!(url_object.path in urls)) {
        check_newurl(n);
    }
},{urls: ["<all_urls>"]},["requestHeaders"]);
*/
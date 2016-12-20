var port = chrome.runtime.connect();

window.addEventListener("message", function(event) {
   if (event.source != window)
       return;
    if (event.data.type && (event.data.type == "FROM_PAGE")) {
        chrome.runtime.sendMessage({c: event.data.text}, function(response) {});
    }
}, false);

//var sendMsg = function(msg) {
//}

var init = function() {
    var keys = location.search.split("&").map(
        function (x){
            var index = x.indexOf("=");
            if (index > -1)
                return x.substr(index+1);
            return "";
        });
    keys =
        (function (x) {
            var tmp = [];
            for (var i = 0; i < x.length; i++) {
                if (x[i].length > 10) {
                    tmp.push(x[i]);
                    tmp.push(decodeURIComponent(x[i]));
                }
            }
            return tmp;
        })(keys);
    if (location.search.length > 11) {
        keys.push(location.search.substr(1));
        keys.push(decodeURIComponent(location.search.substr(1)));
    }
    window.oldEval_ext = window.eval;
    window.eval = function(x) {

        //console.log('args: ' + x + ' args_end');
        for (var i = 0; i < keys.length; i++) {
            var index = x.indexOf(keys[i]);
            if (index > -1) {
                console.log(x);
                if (x.length > 100)
                    x = x.substr(index-50>0?index-50:0, 100);
                var msg = "{arg: " + x + " args_end, " + "url: " + keys[i] + "}";
                window.postMessage({ type: "FROM_PAGE", text: msg  }, "*");
                console.log(msg);
            }
        }
        return window.oldEval_ext(x);
    }

}

var insertScript = function (code) {
    var script = document.createElement('script');
    script.textContent = '(' + code + ')()';
    (document.head||document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
}

insertScript(init)

var init = function() {
    window.oldEval_ext = window.eval;
    window.eval = function(x) {
        console.log('args: ' + x + ' args_end');
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

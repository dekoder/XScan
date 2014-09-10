window.onload = function(){
var div = document.getElementById("log");
var weaks = JSON.parse(localStorage.weaks);
var string = ""
for (key in weaks) {
    string += key + "\n";
}
div.innerText = string;
}

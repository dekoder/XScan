window.onload = function(){
var div = document.getElementById("log");
var weaks = JSON.parse(localStorage.weaks);
var string = ""
for (key in weaks) {
    string += key + " " +weaks[key].type;
    if (weaks[key].summary != undefined) {
        string += " " + weaks[key].summary;
    }
    string += "\n";
}
div.innerText = string;
}

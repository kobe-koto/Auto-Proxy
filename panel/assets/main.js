async function CheckPassword (Element) {

    //location.host = "empty-union-b2cc.adminkoto.workers.dev";

    document.getElementById("PasswordStatus").innerText = "Checking"

    let Password = Element.previousElementSibling.value;
    let res = await fetch("https://" + "empty-union-b2cc.adminkoto.workers.dev" + "/panel/check?password=" + Password).then(r=>r.text())
    if (res === "true") {
        document.getElementById("PasswordStatus").innerText = "CORRECT"
    } else {
        document.getElementById("PasswordStatus").innerText = "INCORRECT"
    }
}
function SetConfig () {
    let HostDomain =
            document.getElementById("HostDomain").value.toArray(),
        BlockRegion =
            document.getElementById("BlockRegion").value.toArray(),
        BlockIP =
            document.getElementById("BlockIP").value.toArray(),
        ShowAvailableList =
            document.getElementById("ShowAvailableList").checked,
    AllowList = (function (){
        if (document.getElementById("AllowList").checked) {
            return undefined
        } else {
            return document.getElementById("AllowListTextarea").value.toArray()
        }
    })(),
        BlockList = (function (){
        if (document.getElementById("BlockList").checked) {
            return undefined
        } else {
            return document.getElementById("BlockListTextarea").value.toArray()
        }
    })()

}
function RadioChanged (element) {
    if (element.checked) {
        document.getElementById(element.id+"Textarea").style.display = "block"
        if (element.id === "AllowList") {
            document.getElementById("BlockListTextarea").style.display = "none"
        } else {
            document.getElementById("AllowListTextarea").style.display = "none"
        }
    }
}

String.prototype.toArray = function(){
    let Array = this
        .replace(/\r/gi, "")
        .replace(/\n/gi, "")
        .replace(/ /gi, "")
        .split(",");
    if (Array.length === 1 || Array.length === 0) {
        return false
    } else {
        return Array;
    }
}


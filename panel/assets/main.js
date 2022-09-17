async function CheckPassword (Element) {
    Element.previousElementSibling = Element.previousElementSibling || {};

    //location.host = "empty-union-b2cc.adminkoto.workers.dev";

    document.getElementById("PasswordStatus").innerText = "Checking"

    if (Element.previousElementSibling.value.length === 0) {
        document.getElementById("PasswordStatus").innerText = "Can't Be Blank";
        return false;
    }

    let Password = Element.previousElementSibling.value;
    fetch("https://" + location.host + "/api/check?password=" + Password)
        .then(r => r.text())
        .catch(()=>{return "CheckFailed"})
        .then(r => {
            if (r === "true") {
                document.getElementById("PasswordStatus").innerText = "CORRECT"
            } else if (r === "CheckFailed") {
                document.getElementById("PasswordStatus").innerText = "CheckFailed"
            } else {
                    document.getElementById("PasswordStatus").innerText = "INCORRECT"
            }
        })
}
function GetConfig () {
    let Config = {};

    Config.HostDomain =
        document.getElementById("HostDomain").value.toArray();

    Config.BlockRegion =
        document.getElementById("BlockRegion").value.toArray();

    Config.ShowAvailableList =
        document.getElementById("ShowAvailableList").checked;

    Config.DisableCache =
        document.getElementById("DisableCache").checked;

    Config.BlockIP =
        document.getElementById("BlockIP").value.toArray();

    Config.ShowAvailableList =
        document.getElementById("ShowAvailableList").checked;

    Config.URLProtocol =
        (function (){
            if (document.getElementById("URLProtocol").checked) {
                return document.getElementById("URLProtocolInput").value;
            } else {
                return false;
            }
        })()

    Config.AllowList =
        (function (){
            if (document.getElementById("AllowList").checked) {
                return undefined
            } else {
                return document.getElementById("AllowListTextarea").value.toArray()
            }
        })();

    Config.BlockList =
        (function (){
            if (document.getElementById("AllowList").checked) {
                return undefined
            } else {
                return document.getElementById("BlockListTextarea").value.toArray()
            }
        })();

    Config.AllowList =
        (function (){
            if (document.getElementById("BlockList").checked) {
                return undefined
            } else {
                return document.getElementById("AllowListTextarea").value.toArray()
            }
        })();

    Config.DomainMap =
        (function () {
            let DomainMapArray = document.getElementById("DomainMap").value.toArray(), TempDomainMap = {};
            for (let r=0;r<DomainMapArray.length;r++) {
                TempDomainMap[DomainMapArray[r].split(":")[0]] = DomainMapArray[r].split(":")[1]
            }
            return TempDomainMap
        })();

    return Config;

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
document.getElementById("PushConfig").onclick = function () {

    document.getElementById("PushConfigStatus").innerText = "Try To Push"

    let Config = btoa(GetConfig()); // to base64.
    let Password = document.getElementById("Password").value;

    fetch(
        "https://" + "empty-union-b2cc.adminkoto.workers.dev" +
        "/api/config?password=" + Password +
        "&b64config=" + Config
    )
        .then(r => r.text())
        .catch(()=>{return "NetworkFailed"})
        .then(r => {
            if (r === "true") {
                document.getElementById("PushConfigStatus").innerText = "Successful"
            } else if (r === "WrongPassword") {
                document.getElementById("PushConfigStatus").innerText = "Password is INCORRECT"
            } else if (r === "NetworkFailed") {
                document.getElementById("PushConfigStatus").innerText = "Failed because network issue."
            } else {
                document.getElementById("PushConfigStatus").innerText = "Sorry, something is going wrong."
            }
        })

}

String.prototype.toArray = function(){
    if (this.length === 0) {
        return false
    } else {
        return (
            this
                .replace(/\r/gi, "")
                .replace(/\n/gi, "")
                .replace(/ /gi, "")
                .split(",")
        );
    }
}

document.getElementById("URLProtocol").onclick = function () {
    if (document.getElementById("URLProtocol").checked) {
        document.getElementById("URLProtocolInput").style.display = "block";
    } else {
        document.getElementById("URLProtocolInput").style.display = "none";
    }
}
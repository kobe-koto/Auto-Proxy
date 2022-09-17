window.LocationHost = location.host;
async function CheckPassword () {
    let Password = document.getElementById("Password").value,
        PasswordStatus = document.getElementById("PasswordStatus");

    PasswordStatus.innerText = "Checking"

    if (Password.length === 0) {
        PasswordStatus.innerText = "Can't Be Blank";
        return false;
    }

    fetch("https://" + window.LocationHost + "/api/check?password=" + Password)
        .then(r => r.text())
        .catch(()=>{return "CheckFailed"})
        .then(r => {
            if (r === "true") {
                PasswordStatus.innerText = "CORRECT"
            } else if (r === "CheckFailed") {
                PasswordStatus.innerText = "(CheckFailed because network issue)"
            } else if (r === "WrongPassword") {
                PasswordStatus.innerText = "INCORRECT"
            } else {
                PasswordStatus.innerText = "(Something went wrong...)"
            }
        })
}
async function SyncConfig () {
    let SyncStatus = document.getElementById("SyncStatus"),
        Password = document.getElementById("Password").value;

    SyncStatus.innerText = "Checking"

    if (Password === 0) {
        SyncStatus.innerText = "Can't Be Blank";
        return false;
    }
    fetch("https://" + window.LocationHost + "/api/sync?password=" + Password)
        .then(r => r.text())
        .catch(()=>{return "NetworkFailed"})
        .then(r => {
            if (r === "NetworkFailed") {
                SyncStatus.innerText = "Failed because network issue."
            } else if (r === "WrongPassword") {
                SyncStatus.innerText = "Password is INCORRECT"
            } else {
                try {
                    let Config = JSON.parse(r);

                    console.log(Config)
                    window.Config = Config;

                    document.getElementById("ShowAvailableList").checked = Config.ShowAvailableList;
                    document.getElementById("DisableCache").checked = Config.DisableCache;

                    document.getElementById("HostDomain").value = Config.HostDomain.toArrayString();
                    document.getElementById("BlockRegion").value = Config.BlockRegion.toArrayString();
                    document.getElementById("BlockIP").value = Config.BlockIP.toArrayString();

                    document.getElementById("URLProtocol").checked = Config.URLProtocol;
                    URLProtocolChecked()

                    document.getElementById("AllowList").checked = !!Config.AllowList;
                    document.getElementById("AllowListTextarea").value = Config.AllowList
                    document.getElementById("BlockList").checked = !!Config.BlockList;
                    document.getElementById("BlockListTextarea").value = Config.BlockList;
                    RadioChanged()

                    document.getElementById("DomainMap").value =
                        JSON.stringify(Config.DomainMap)
                            .replace(/"/gi,"")
                            .replace(/}/gi,"")
                            .replace(/{/gi,"")
                            .replace(/:/gi,": ")
                            .replace(/,/gi,", \r\n")
                    SyncStatus.innerText = "Successful";
                } catch (e) {
                    SyncStatus.innerText = "Sorry, something is going wrong."
                    console.warn(e);
                }
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
function RadioChanged () {
    if (document.getElementById("AllowList").checked) {
        document.getElementById("AllowListTextarea").style.display = "block"
        document.getElementById("BlockListTextarea").style.display = "none"
    } else if (document.getElementById("BlockList").checked) {
        document.getElementById("AllowListTextarea").style.display = "none"
        document.getElementById("BlockListTextarea").style.display = "block"
    }
}
document.getElementById("PushConfig").onclick = function () {

    document.getElementById("PushConfigStatus").innerText = "Try To Push"

    let Config = btoa(JSON.stringify(GetConfig()));
    let Password = document.getElementById("Password").value;
    console.log(Config)

    fetch(
        "https://" + window.LocationHost +
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
Array.prototype.toArrayString = function(){
    return (this.toString().replace(/,/gi,", \r\n") || "");
}

function URLProtocolChecked () {
    if (document.getElementById("URLProtocol").checked) {
        document.getElementById("URLProtocolInput").style.display = "block";
    } else {
        document.getElementById("URLProtocolInput").style.display = "none";
    }
}
document.getElementById("URLProtocol").onclick = URLProtocolChecked;
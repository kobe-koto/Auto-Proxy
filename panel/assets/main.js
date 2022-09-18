window.LocationHost = location.host;
if (window.location.protocol === "file:") {
    document.getElementById("FileProtocolWarn").style.display = "block";
}

async function CheckPassword () {
    let Password = document.getElementById("Password").value,
        PasswordStatus = document.getElementById("PasswordStatus");

    if (Password.length === 0) {
        PasswordStatus.innerText = "Can't Be Blank";
        return false;
    }

    PasswordStatus.innerText = "Checking"

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

    if (Password.length === 0) {
        PasswordStatus.innerText = "Can't Be Blank";
        return false;
    }

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
                }
            }
        })
}

function PushConfig () {
    let PushConfigStatus = document.getElementById("PushConfigStatus"),
        Password = document.getElementById("Password").value,
        Config = btoa(JSON.stringify(GenConfig()));

    if (Password.length === 0) {
        PasswordStatus.innerText = "Can't Be Blank";
        return false;
    }

    PushConfigStatus.innerText = "Try to push..."

    fetch(
        "https://" + window.LocationHost +
        "/api/config?password=" + Password +
        "&b64config=" + Config
    )
        .then(r => r.text())
        .catch(()=>{return "NetworkFailed"})
        .then(r => {
            if (r === "true") {
                PushConfigStatus.innerText = "Successful"
            } else if (r === "WrongPassword") {
                PushConfigStatus.innerText = "Password is incorrect"
            } else if (r === "NetworkFailed") {
                PushConfigStatus.innerText = "Failed because network issue."
            } else {
                PushConfigStatus.innerText = "Sorry, something is going wrong."
            }
        })
}

function GenConfig () {
    let Config = {};

    Config.HostDomain = document.getElementById("HostDomain").value.toArray();
    Config.BlockRegion = document.getElementById("BlockRegion").value.toArray();
    Config.BlockIP = document.getElementById("BlockIP").value.toArray();

    Config.ShowAvailableList = document.getElementById("ShowAvailableList").checked;
    Config.DisableCache = document.getElementById("DisableCache").checked;

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

function URLProtocolChecked () {
    if (document.getElementById("URLProtocol").checked) {
        document.getElementById("URLProtocolInput").style.display = "block";
    } else {
        document.getElementById("URLProtocolInput").style.display = "none";
    }
}
document.getElementById("URLProtocol").onclick = URLProtocolChecked;


String.prototype.toArray = function(){
    if (this.length === 0) {
        return []
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










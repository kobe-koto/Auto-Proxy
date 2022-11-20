window.LocationHost = location.host;
if (window.location.protocol === "file:") {
    document.getElementById("FileProtocolWarn").style.display = "block";
}
document.getElementById("URLProtocol").onclick = URLProtocolChecked;

function CheckPassword () {
    let Password = document.getElementById("Password").value,
        PasswordStatus = document.getElementById("PasswordStatus");

    if (Password.length === 0) {
        PasswordStatus.innerText = "Can't Be Blank";
        return false;
    }

    PasswordStatus.innerText = "Checking"

    let xhr = new XMLHttpRequest();
    xhr.open("GET", "https://" + window.LocationHost + "/api/check?password=" + Password, true);
    xhr.onerror = function () {
        xhr.onload = function(){};
        let ErrorMsg = (function (){
            if (xhr.response) {
                return "because "+xhr.response;
            } else {
                return "";
            }
        })()
        PasswordStatus.innerText = "Failed " + ErrorMsg;
    }
    xhr.onload = function () {
        xhr.onerror = function(){};
        if (xhr.response === "true") {
            PasswordStatus.innerText = "CORRECT"
        } else if (xhr.response === "WrongPassword") {
            PasswordStatus.innerText = "INCORRECT"
        } else {
            PasswordStatus.innerText = "(Something went wrong...) " + xhr.response;
        }
    }
    xhr.send();

}
function PullConfig () {
    let SyncStatus = document.getElementById("SyncStatus"),
        Password = document.getElementById("Password").value;

    if (Password.length === 0) {
        SyncStatus.innerText = "Can't Be Blank";
        return false;
    }

    SyncStatus.innerText = "Checking"



    let xhr = new XMLHttpRequest();
    xhr.open("GET", "https://" + window.LocationHost + "/api/sync?password=" + Password, true);
    xhr.onerror = function () {
        xhr.onload = function(){};
        let ErrorMsg = (function (){
            if (xhr.response) {
                return "because "+xhr.response;
            } else {
                return "";
            }
        })()
        SyncStatus.innerText = "Failed " + ErrorMsg;
    }
    xhr.onload = function () {
        xhr.onerror = function(){};
        if (xhr.response === "WrongPassword") {
            SyncStatus.innerText = "Password is INCORRECT"
        } else {
            try {
                ApplyConfig(JSON.parse(xhr.response))
                SyncStatus.innerText = "Successful";
            } catch (e) {
                SyncStatus.innerText = "Sorry, something is going wrong. " + xhr.response;
            }
        }
    }
    xhr.send();

}
function PushConfig () {
    let PushConfigStatus = document.getElementById("PushConfigStatus"),
        Password = document.getElementById("Password").value,
        Config = btoa(JSON.stringify(GenConfig()));

    if (Password.length === 0) {
        PushConfigStatus.innerText = "Can't Be Blank";
        return false;
    }

    PushConfigStatus.innerText = "Try to push..."


    let xhr = new XMLHttpRequest();
    xhr.open("GET",
        "https://" + window.LocationHost +
        "/api/config?password=" + Password +
        "&b64config=" + Config,
        true);
    xhr.onerror = function () {
        xhr.onload = function(){};
        let ErrorMsg = (function (){
            if (xhr.response) {
                return "because "+xhr.response;
            } else {
                return "";
            }
        })()
        PushConfigStatus.innerText = "Failed " + ErrorMsg;
    }
    xhr.onload = function () {
        xhr.onerror = function(){};
        if (xhr.response === "true") {
            PushConfigStatus.innerText = "Successful"
        } else if (xhr.response === "WrongPassword") {
            PushConfigStatus.innerText = "Password is incorrect"
        } else {
            PushConfigStatus.innerText = "Sorry, something is going wrong."
        }
    }
    xhr.send();
}

function ParseOldConfig (ConfigCommand) {
    document.getElementById("MigrateStatus").innerText = "Trying...";
    ConfigCommand =
        ConfigCommand + `
    
    let Config = {};
    try {
        HostDomain = DomainReplaceKey || [],
        AllowList = AllowList || undefined,
        BlockList = BlockList || undefined,
        BlockRegion = BlockRegion || [],
        BlockIP = BlockIP || [],
        ShowAvailableList = ShowAvailableList || false,
        URLProtocol = URLProtocol || false,
        DisableCache = DisableCache || false,
        DomainMap = DomainMap || {}; 
    } catch (e) {}

    Config.HostDomain = DomainReplaceKey;
    Config.AllowList = AllowList;
    Config.BlockList = BlockList;
    Config.BlockRegion = BlockRegion;
    Config.BlockIP = BlockIP;
    Config.ShowAvailableList = ShowAvailableList;
    Config.URLProtocol = URLProtocol;
    Config.DisableCache = DisableCache;
    Config.DomainMap = DomainMap;
    
    ApplyConfig (Config)
    
    document.getElementById("MigrateStatus").innerText = "Successful";
    alert("Successful To Convert Old Config. \\r\\nDon't forget to PUSH config!");
    document.getElementById("Config").checked = true;
    MigrateOrConfigRadioChanged()
    `
    Function(ConfigCommand)()
}

// base on these ShitCodes(LOL)

function ApplyConfig (Config) {

    document.getElementById("ShowAvailableList").checked = Config.ShowAvailableList;
    document.getElementById("DisableCache").checked = Config.DisableCache;

    document.getElementById("HostDomain").value = Config.HostDomain.toArrayString();
    document.getElementById("BlockRegion").value = Config.BlockRegion.toArrayString();
    document.getElementById("BlockIP").value = Config.BlockIP.toArrayString();

    document.getElementById("URLProtocol").checked = Config.URLProtocol;
    URLProtocolChecked();

    document.getElementById("AllowList").checked = !!Config.AllowList;
    document.getElementById("AllowListTextarea").value = (Config.AllowList || []).toArrayString();
    document.getElementById("BlockList").checked = !!Config.BlockList;
    document.getElementById("BlockListTextarea").value = (Config.BlockList || []).toArrayString();
    AllowOrBlockRadioChanged();

    document.getElementById("DomainMap").value =
        JSON.stringify(Config.DomainMap)
            .replace(/"/gi,"")
            .replace(/}/gi,"")
            .replace(/{/gi,"")
            .replace(/:/gi,": ")
            .replace(/,/gi,", \r\n")
}

function GenConfig () {
    let Config = {};

    Config.HostDomain = document.getElementById("HostDomain").value.toArray();
    Config.BlockRegion = document.getElementById("BlockRegion").value.toArray();
    Config.BlockIP = document.getElementById("BlockIP").value.toArray();

    Config.ShowAvailableList = document.getElementById("ShowAvailableList").checked;
    Config.DisableCache = document.getElementById("DisableCache").checked;

    Config.URLProtocol =
        document.getElementById("URLProtocol").checked
            ? document.getElementById("URLProtocolInput").value
            : false;

    Config.BlockList =
        document.getElementById("BlockList").checked
            ? document.getElementById("BlockListTextarea").value.toArray()
            : undefined;

    Config.AllowList =
        document.getElementById("AllowList").checked
            ? document.getElementById("AllowListTextarea").value.toArray()
            : undefined;

    Config.DomainMap = document.getElementById("DomainMap").value.toObject()
    //Config.ReplaceMap = document.getElementById("ReplaceMap").value.toObject()

    return Config;
}

function AllowOrBlockRadioChanged () {
    document.getElementById("AllowListTextarea").style.display =
        document.getElementById("AllowList").checked
            ? "block"
            : "none"
    document.getElementById("BlockListTextarea").style.display =
        document.getElementById("BlockList").checked
            ? "block"
            : "none"
}

function MigrateOrConfigRadioChanged () {
    if (document.getElementById("Migrate").checked) {
        document.getElementById("MigrateDiv").style.display = "block"
        document.getElementById("ConfigDiv").style.display = "none"
    } else if (document.getElementById("Config").checked) {
        document.getElementById("MigrateDiv").style.display = "none"
        document.getElementById("ConfigDiv").style.display = "block"
    }
}

function URLProtocolChecked () {
    document.getElementById("URLProtocolInput").style.display =
        document.getElementById("URLProtocol").checked
            ? "block"
            : "none";
}

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
String.prototype.toObject = function(){
    let TempArray = this.toArray(), Object = {};
    for (let t=0;t<this.length;t++) {
        Object[TempArray[t].split(":")[0]] = TempArray[t].split(":")[1]
    }
    return Object ? Object : {};
}

Array.prototype.toArrayString = function(){
    return (this.toString().replace(/,/gi,", \r\n") || "");
}










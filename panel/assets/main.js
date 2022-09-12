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
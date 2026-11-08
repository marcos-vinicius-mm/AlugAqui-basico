function obterUsuario(){
    try{
        return JSON.parse(sessionStorage.getItem("usuario"))
    }catch{
        return null
    }
}

function renderAcesso(){

    var usuario = obterUsuario()
    const container = document.getElementById("usuario-deslogado")

    if(!container) return

    return container.style.display = usuario ? "none":"flex"
}

renderAcesso();
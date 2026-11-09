import { obterUsuario } from "./auth.js"


function renderAcesso(){

    var usuario = obterUsuario()
    const container = document.getElementById("usuario-deslogado")

    if(!container) return

    return container.style.display = usuario ? "none":"flex"
}

renderAcesso();
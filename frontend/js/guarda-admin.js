import { obterUsuario } from "./auth.js";


// Protege página de administrador (teste).
// Lembrar de passar a verificacao para o back
(function () {

    let usuario = obterUsuario();
    
    if (!usuario) {
        location.replace("login.html");    // não logado
    } else if (usuario.tipo !== "admin") {
        location.replace("index.html");    // logado, usuario normal
    }
})();
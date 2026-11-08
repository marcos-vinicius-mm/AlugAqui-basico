// Protege página de administrador (teste).
// Lembrar de passar a verificacao para o back
(function () {
    let usuario = null;
    try {
        usuario = JSON.parse(sessionStorage.getItem("usuario"));
    } catch { /* ignora */ }

    if (!usuario) {
        location.replace("login.html");    // não logado
    } else if (usuario.tipo !== "admin") {
        location.replace("index.html");    // logado, usuario normal
    }
})();
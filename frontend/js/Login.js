import { login } from "./auth.js";
import { obterUsuario } from "./auth.js";

try { sessionStorage.removeItem("usuario"); } catch {}

const form = document.getElementById("form-login");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const msgErro = document.getElementById("msg-erro");

function mostrarErro(texto, campos) {
    msgErro.textContent = texto;
    msgErro.hidden = false;
    [campoEmail, campoSenha].forEach(c => c.classList.remove("invalido"));
    campos.forEach(c => c.classList.add("invalido"));
}

function limparErro() {
    msgErro.hidden = true;
    [campoEmail, campoSenha].forEach(c => c.classList.remove("invalido"));
}

(function redirecionarSeLogado() {
    try {
        const usuario = obterUsuario();
        if (usuario) location.replace(usuario.role.type === "admin" ? "Admin.html" : "index.html");
    } catch { /* ignora inválidos */ }
})();

form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparErro();

    const email = campoEmail.value.trim().toLowerCase();
    const senha = campoSenha.value;

    if (!email || !senha) {
        mostrarErro("Preencha e-mail e senha.", [!email ? campoEmail : campoSenha]);
        return;
    }

    const conta = await login(email, senha)

    if (!conta) {
        mostrarErro("E-mail ou senha incorretos.", [campoEmail, campoSenha]);
        return;
    }


    location.href = conta.role.type === "admin" ? "Admin.html" : "index.html";
});

campoEmail.addEventListener("input", limparErro);
campoSenha.addEventListener("input", limparErro);
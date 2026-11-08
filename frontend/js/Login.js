// Login apenas para testes: as contas ficam fixas aqui, sem backend.

const CONTAS_TESTE = [
    { nome: "Usuário Teste", email: "usuario@teste.com", senha: "123456",   tipo: "comum" },
    { nome: "Administrador", email: "admin@teste.com",   senha: "admin123", tipo: "admin" },
];

// Limpa sessão antiga que ficou salva no localStorage
try { localStorage.removeItem("usuario"); } catch {}

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
        const usuario = JSON.parse(sessionStorage.getItem("usuario"));
        if (usuario) location.replace(usuario.tipo === "admin" ? "Admin.html" : "index.html");
    } catch { /* ignora inválidos */ }
})();

form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limparErro();

    const email = campoEmail.value.trim().toLowerCase();
    const senha = campoSenha.value;

    if (!email || !senha) {
        mostrarErro("Preencha e-mail e senha.", [!email ? campoEmail : campoSenha]);
        return;
    }

    const conta = CONTAS_TESTE.find(c => c.email === email && c.senha === senha);

    if (!conta) {
        mostrarErro("E-mail ou senha incorretos.", [campoEmail, campoSenha]);
        return;
    }

    sessionStorage.setItem("usuario", JSON.stringify({
        nome: conta.nome,
        email: conta.email,
        tipo: conta.tipo,
    }));

    location.href = conta.tipo === "admin" ? "Admin.html" : "index.html";
});

campoEmail.addEventListener("input", limparErro);
campoSenha.addEventListener("input", limparErro);
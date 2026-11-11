import { request } from "./api.js";
import { obterUsuario } from "./auth.js";

(function redirecionarSeLogado() {
    const usuario = obterUsuario();
    if (usuario) location.replace(usuario.role?.type === "admin" ? "Admin.html" : "index.html");
})();

const form = document.getElementById("form-cadastro");
const campos = {
    username:  document.getElementById("username"),
    email:     document.getElementById("email"),
    telefone:  document.getElementById("telefone"),
    senha:     document.getElementById("senha"),
    confirmar: document.getElementById("confirmar"),
};
const msgErro = document.getElementById("msg-erro");
const msgSucesso = document.getElementById("msg-sucesso");
const botao = document.getElementById("btn-cadastrar");
const mostrarSenha = document.getElementById("mostrar-senha");

const REGRAS = {
    usernameMin: 3,
    usernameMax: 30,
    emailMin: 6,
    senhaMin: 6,
};

/* mensagens */

function limparMensagens() {
    msgErro.hidden = true;
    msgSucesso.hidden = true;
    Object.values(campos).forEach(c => c.classList.remove("invalido"));
}

function mostrarErro(texto, ...camposInvalidos) {
    limparMensagens();
    msgErro.textContent = texto;
    msgErro.hidden = false;
    camposInvalidos.forEach(c => c.classList.add("invalido"));
    (camposInvalidos[0] || campos.username).focus();
}

/* telefone */

function somenteDigitos(texto) {
    return texto.replace(/\D/g, "");
}

// (88) 99999-9999 ou (88) 9999-9999
function formatarTelefone(texto) {
    const d = somenteDigitos(texto).slice(0, 11);
    if (d.length <= 2) return d ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

campos.telefone.addEventListener("input", () => {
    campos.telefone.value = formatarTelefone(campos.telefone.value);
});

/* validação */

function validar(dados) {
    if (dados.username.length < REGRAS.usernameMin) {
        return { texto: `O nome de usuário precisa ter pelo menos ${REGRAS.usernameMin} caracteres.`, campo: campos.username };
    }
    if (!/^[\w.-]+$/.test(dados.username)) {
        return { texto: "Use só letras, números, ponto, hífen ou sublinhado no nome de usuário.", campo: campos.username };
    }
    if (dados.email.length < REGRAS.emailMin || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
        return { texto: "Informe um e-mail válido.", campo: campos.email };
    }
    if (dados.telefone) {
        const tamanho = somenteDigitos(dados.telefone).length;
        if (tamanho !== 10 && tamanho !== 11) {
            return { texto: "Telefone inválido. Informe o DDD e o número.", campo: campos.telefone };
        }
    }
    if (dados.senha.length < REGRAS.senhaMin) {
        return { texto: `A senha precisa ter pelo menos ${REGRAS.senhaMin} caracteres.`, campo: campos.senha };
    }
    if (dados.senha !== dados.confirmar) {
        return { texto: "As senhas não conferem.", campo: campos.confirmar };
    }
    return null;
}

/* erros do servidor */

function traduzirErro(erro) {
    const msg = erro.message || "";
    if (/already taken/i.test(msg)) return "Este e-mail ou nome de usuário já está cadastrado.";
    if (/failed to fetch|networkerror|load failed/i.test(msg)) return "Não foi possível conectar ao servidor. Tente novamente.";
    return msg || "Não foi possível criar a conta.";
}

/* envio */

form.addEventListener("submit", async evento => {
    evento.preventDefault();
    limparMensagens();

    const dados = {
        username:  campos.username.value.trim(),
        email:     campos.email.value.trim().toLowerCase(),
        telefone:  campos.telefone.value.trim(),
        senha:     campos.senha.value,
        confirmar: campos.confirmar.value,
    };

    const problema = validar(dados);
    if (problema) {
        mostrarErro(problema.texto, problema.campo);
        return;
    }

    const corpo = { username: dados.username, email: dados.email, password: dados.senha };
    if (dados.telefone) corpo.telefone = dados.telefone;

    botao.disabled = true;
    botao.textContent = "Criando conta...";

    try {
        await request("/auth/local/register", { method: "POST", body: corpo, auth: false });

        msgSucesso.textContent = "Conta criada! Redirecionando para o login...";
        msgSucesso.hidden = false;
        setTimeout(() => location.replace("login.html"), 1500);
    } catch (erro) {
        mostrarErro(traduzirErro(erro));
        botao.disabled = false;
        botao.textContent = "Criar conta";
    }
});

/* detalhes de uso */

mostrarSenha.addEventListener("change", () => {
    const tipo = mostrarSenha.checked ? "text" : "password";
    campos.senha.type = tipo;
    campos.confirmar.type = tipo;
});

Object.values(campos).forEach(c => c.addEventListener("input", () => c.classList.remove("invalido")));
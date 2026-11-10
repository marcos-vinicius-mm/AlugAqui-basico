// Painel do administrador: proteção da página + dados vindos do Strapi.
// Substitui o guarda-admin.js (a verificação agora é a primeira etapa deste arquivo).
//
// Carregar no Admin.html com:  <script type="module" src="js/admin.js"></script>

import { request } from "./api.js";
import { obterUsuario } from "./auth.js";

const PERFIL_ADMIN = "admin";   // role.type do perfil de administrador no Strapi
const TAMANHO_PAGINA = "100";

let usuarioAtual = null;

/* ========================= utilidades ========================= */

function $(seletor, base = document) {
    return base.querySelector(seletor);
}

// Monta elementos com textContent (nunca innerHTML): título de anúncio, comentário
// e nome de usuário vêm de outras pessoas.
function criar(tag, classes, texto) {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (texto !== undefined && texto !== null) el.textContent = texto;
    return el;
}

function consulta(parametros) {
    return "?" + new URLSearchParams(parametros).toString();
}

function formatarData(iso) {
    return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

function formatarPreco(valor) {
    if (valor === null || valor === undefined) return "—";
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resumir(texto, max = 60) {
    if (!texto) return "—";
    return texto.length > max ? texto.slice(0, max - 1) + "…" : texto;
}

const MOTIVOS = {
    spam: "Spam",
    conteudo_inadequado: "Conteúdo inadequado",
    golpe_fraude: "Golpe ou fraude",
    informacao_falsa: "Informação falsa",
    outro: "Outro",
};

const SELO_DENUNCIA = {
    pendente:     ["selo-amarelo", "Pendente"],
    procedente:   ["selo-verde",   "Procedente"],
    improcedente: ["selo-cinza",   "Improcedente"],
};

const SELO_ANUNCIO = {
    ativo:   ["selo-verde",    "Ativo"],
    pausado: ["selo-cinza",    "Pausado"],
    alugado: ["selo-vermelho", "Alugado"],
};

function selo([classe, texto]) {
    return criar("span", `selo ${classe}`, texto);
}

/* ========================= tabela / botões ========================= */

function mensagemTabela(tbody, texto) {
    const colunas = tbody.closest("table").querySelectorAll("thead th").length;
    const td = criar("td", "vazio", texto);
    td.colSpan = colunas;
    const tr = criar("tr");
    tr.appendChild(td);
    tbody.replaceChildren(tr);
}

function linha(celulas) {
    const tr = criar("tr");
    celulas.forEach(conteudo => {
        const td = criar("td");
        td.append(conteudo);
        tr.appendChild(td);
    });
    return tr;
}

function botao(texto, cor, acao) {
    const b = criar("button", `btn ${cor}`, texto);
    b.type = "button";
    b.addEventListener("click", async () => {
        b.disabled = true;
        try {
            await acao();
        } catch (erro) {
            alert(erro.message || "Não foi possível concluir a ação.");
        } finally {
            b.disabled = false;
        }
    });
    return b;
}

// junta os botões com um espaço entre eles
function acoes(...botoes) {
    const caixa = document.createDocumentFragment();
    botoes.forEach((b, i) => {
        if (i > 0) caixa.append(" ");
        caixa.append(b);
    });
    return caixa;
}

function mostrarDetalhes(titulo, linhasDetalhe) {
    let modal = document.getElementById("modal-admin");

    if (!modal) {
        modal = criar("div", "modal fade");
        modal.id = "modal-admin";
        modal.tabIndex = -1;

        const dialogo = criar("div", "modal-dialog modal-dialog-centered modal-dialog-scrollable");
        const conteudo = criar("div", "modal-content");

        const cabecalho = criar("div", "modal-header");
        const fechar = criar("button", "btn-close");
        fechar.type = "button";
        fechar.dataset.bsDismiss = "modal";
        fechar.setAttribute("aria-label", "Fechar");
        cabecalho.append(criar("h5", "modal-title"), fechar);

        conteudo.append(cabecalho, criar("div", "modal-body"));
        dialogo.appendChild(conteudo);
        modal.appendChild(dialogo);
        document.body.appendChild(modal);
    }

    $(".modal-title", modal).textContent = titulo;

    const lista = criar("dl", "row mb-0");
    linhasDetalhe.forEach(([rotulo, valor]) => {
        lista.append(criar("dt", "col-sm-4", rotulo), criar("dd", "col-sm-8", valor || "—"));
    });
    $(".modal-body", modal).replaceChildren(lista);

    window.bootstrap.Modal.getOrCreateInstance(modal).show();
}

/* ========================= proteção da página ========================= */

function ehAdmin(usuario) {
    return usuario?.role?.type === PERFIL_ADMIN;
}

// 1) confere o usuário guardado na sessão
// 2) confirma com o servidor (o sessionStorage pode ser editado no navegador)
// A permissão de verdade continua sendo a do Strapi: o perfil admin precisa ter
// acesso às rotas usadas abaixo, e os outros perfis não.
async function verificarAdmin() {
    const local = obterUsuario();

    if (!local) {
        location.replace("login.html");     // não logado
        return null;
    }
    if (!ehAdmin(local)) {
        location.replace("index.html");     // logado, mas não é admin
        return null;
    }

    try {
        const servidor = await request("/users/me?populate=role");
        if (!ehAdmin(servidor)) {
            location.replace("index.html");
            return null;
        }
        sessionStorage.setItem("usuario", JSON.stringify(servidor));
        return servidor;
    } catch {
        location.replace("login.html");     // token inválido ou servidor fora do ar
        return null;
    }
}

/* ========================= resumo ========================= */

async function total(caminho, filtros) {
    const resposta = await request(caminho + consulta({ ...filtros, "pagination[pageSize]": "1" }));
    return resposta.meta.pagination.total;
}

async function carregarResumo() {
    const numeros = document.querySelectorAll("#resumo .card-numero");
    // numeros[0] = anúncios ativos, [1] = usuários (preenchido em carregarUsuarios), [2] = denúncias pendentes
    try {
        const [ativos, pendentes] = await Promise.all([
            total("/anuncios", { "filters[status_anuncio][$eq]": "ativo" }),
            total("/denuncias", { "filters[status_denuncia][$eq]": "pendente" }),
        ]);
        numeros[0].textContent = ativos;
        numeros[2].textContent = pendentes;
    } catch {
        numeros[0].textContent = "?";
        numeros[2].textContent = "?";
    }
}

/* ========================= denúncias ========================= */

function conteudoDenunciado(d) {
    if (d.anuncio) return d.anuncio.titulo;
    if (d.comentario) return d.comentario.texto;
    return null;
}

async function removerConteudoDenunciado(d) {
    const alvo = d.anuncio
        ? { caminho: "anuncios", id: d.anuncio.documentId, nome: "o anúncio" }
        : { caminho: "comentarios", id: d.comentario.documentId, nome: "o comentário" };

    if (!confirm(`Remover ${alvo.nome} denunciado? Esta ação não pode ser desfeita.`)) return;

    // marca a denúncia antes: ao apagar o conteúdo, o vínculo com ele se perde
    await request(`/denuncias/${d.documentId}`, {
        method: "PUT",
        body: { data: { status_denuncia: "procedente" } },
    });
    await request(`/${alvo.caminho}/${alvo.id}`, { method: "DELETE" });
    await recarregarTudo();
}

async function ignorarDenuncia(d) {
    if (!confirm("Marcar esta denúncia como improcedente?")) return;
    await request(`/denuncias/${d.documentId}`, {
        method: "PUT",
        body: { data: { status_denuncia: "improcedente" } },
    });
    await recarregarTudo();
}

function detalhesDenuncia(d) {
    mostrarDetalhes(`Denúncia #${d.id}`, [
        ["Tipo", d.anuncio ? "Anúncio" : d.comentario ? "Comentário" : "Conteúdo já removido"],
        ["Conteúdo", conteudoDenunciado(d)],
        ["Motivo", MOTIVOS[d.motivo] || d.motivo],
        ["Descrição", d.descricao],
        ["Denunciante", d.denunciante?.email || d.denunciante?.username],
        ["Data", formatarData(d.createdAt)],
        ["Status", (SELO_DENUNCIA[d.status_denuncia] || [])[1] || d.status_denuncia],
    ]);
}

function linhaDenuncia(d) {
    const pendente = d.status_denuncia === "pendente";
    const botoes = [botao("Ver", "btn-azul", () => detalhesDenuncia(d))];

    if (pendente) {
        if (d.anuncio || d.comentario) {
            botoes.push(botao("Remover", "btn-vermelho", () => removerConteudoDenunciado(d)));
        }
        botoes.push(botao("Ignorar", "btn-cinza", () => ignorarDenuncia(d)));
    }

    return linha([
        String(d.id),
        d.anuncio ? "Anúncio" : d.comentario ? "Comentário" : "—",
        resumir(conteudoDenunciado(d)),
        MOTIVOS[d.motivo] || d.motivo,
        d.denunciante?.email || d.denunciante?.username || "—",
        formatarData(d.createdAt),
        selo(SELO_DENUNCIA[d.status_denuncia] || ["selo-cinza", d.status_denuncia]),
        acoes(...botoes),
    ]);
}

async function carregarDenuncias() {
    const tbody = $("#denuncias tbody");
    mensagemTabela(tbody, "Carregando...");

    const filtro = $("#filtro-status").value;   // Pendentes | Analisadas | Todas
    const parametros = {
        sort: "createdAt:desc",
        "pagination[pageSize]": TAMANHO_PAGINA,
        "populate[denunciante]": "true",
        "populate[anuncio]": "true",
        "populate[comentario]": "true",
    };

    if (filtro === "Pendentes") {
        parametros["filters[status_denuncia][$eq]"] = "pendente";
    } else if (filtro === "Analisadas") {
        parametros["filters[status_denuncia][$in][0]"] = "procedente";
        parametros["filters[status_denuncia][$in][1]"] = "improcedente";
    }

    try {
        const { data } = await request("/denuncias" + consulta(parametros));
        if (!data.length) return mensagemTabela(tbody, "Nenhuma denúncia encontrada.");
        tbody.replaceChildren(...data.map(linhaDenuncia));
    } catch (erro) {
        mensagemTabela(tbody, `Erro ao carregar denúncias: ${erro.message}`);
    }
}

/* ========================= anúncios ========================= */

async function alterarStatusAnuncio(a, novoStatus) {
    await request(`/anuncios/${a.documentId}`, {
        method: "PUT",
        body: { data: { status_anuncio: novoStatus } },
    });
    await recarregarTudo();
}

async function removerAnuncio(a) {
    if (!confirm(`Remover o anúncio "${a.titulo}"? Esta ação não pode ser desfeita.`)) return;
    await request(`/anuncios/${a.documentId}`, { method: "DELETE" });
    await recarregarTudo();
}

function detalhesAnuncio(a) {
    const imovel = a.imovel;
    mostrarDetalhes(a.titulo, [
        ["Anunciante", a.usuario?.username],
        ["Preço", formatarPreco(a.preco)],
        ["Status", (SELO_ANUNCIO[a.status_anuncio] || [])[1] || a.status_anuncio],
        ["Descrição", a.descricao],
        ["Tipo do imóvel", imovel?.tipo],
        ["Bairro", imovel?.bairro],
        ["Endereço", [imovel?.rua, imovel?.numero].filter(Boolean).join(", ")],
        ["Publicado em", formatarData(a.createdAt)],
    ]);
}

function linhaAnuncio(a) {
    const pausado = a.status_anuncio === "pausado";

    return linha([
        String(a.id),
        a.titulo,
        a.usuario?.username || "—",
        formatarPreco(a.preco),
        selo(SELO_ANUNCIO[a.status_anuncio] || ["selo-cinza", a.status_anuncio]),
        acoes(
            botao("Ver", "btn-azul", () => detalhesAnuncio(a)),
            botao(pausado ? "Reativar" : "Ocultar", "btn-cinza",
                () => alterarStatusAnuncio(a, pausado ? "ativo" : "pausado")),
            botao("Remover", "btn-vermelho", () => removerAnuncio(a)),
        ),
    ]);
}

async function carregarAnuncios() {
    const tbody = $("#anuncios tbody");
    mensagemTabela(tbody, "Carregando...");

    const busca = $("#busca-anuncio").value.trim();
    const parametros = {
        sort: "createdAt:desc",
        "pagination[pageSize]": TAMANHO_PAGINA,
        "populate[usuario]": "true",
        "populate[imovel]": "true",
    };

    if (busca) {
        parametros["filters[$or][0][titulo][$containsi]"] = busca;
        parametros["filters[$or][1][imovel][bairro][$containsi]"] = busca;
    }

    try {
        const { data } = await request("/anuncios" + consulta(parametros));
        if (!data.length) return mensagemTabela(tbody, "Nenhum anúncio encontrado.");
        tbody.replaceChildren(...data.map(linhaAnuncio));
    } catch (erro) {
        mensagemTabela(tbody, `Erro ao carregar anúncios: ${erro.message}`);
    }
}

/* ========================= usuários ========================= */

async function alterarBloqueio(u, bloquear) {
    const verbo = bloquear ? "Suspender" : "Reativar";
    if (!confirm(`${verbo} a conta de ${u.username}?`)) return;

    // rota do users-permissions: o corpo não leva o envelope "data"
    await request(`/users/${u.id}`, { method: "PUT", body: { blocked: bloquear } });
    await recarregarTudo();
}

function detalhesUsuario(u) {
    mostrarDetalhes(u.username, [
        ["E-mail", u.email],
        ["Telefone", u.telefone],
        ["Papel", ehAdmin(u) ? "Administrador" : "Usuário"],
        ["Conta", u.blocked ? "Suspensa" : "Ativa"],
        ["Cadastro", formatarData(u.createdAt)],
    ]);
}

function linhaUsuario(u) {
    const botoes = [botao("Perfil", "btn-azul", () => detalhesUsuario(u))];

    // o administrador não suspende a si mesmo nem outros administradores
    if (u.id !== usuarioAtual.id && !ehAdmin(u)) {
        botoes.push(u.blocked
            ? botao("Ativar", "btn-verde", () => alterarBloqueio(u, false))
            : botao("Suspender", "btn-vermelho", () => alterarBloqueio(u, true)));
    }

    return linha([
        String(u.id),
        u.username,
        u.email,
        ehAdmin(u) ? "Administrador" : "Usuário",
        selo(u.blocked ? ["selo-vermelho", "Suspensa"] : ["selo-verde", "Ativa"]),
        formatarData(u.createdAt),
        acoes(...botoes),
    ]);
}

async function carregarUsuarios() {
    const tbody = $("#usuarios tbody");
    const contador = document.querySelectorAll("#resumo .card-numero")[1];
    mensagemTabela(tbody, "Carregando...");

    try {
        // a rota de usuários devolve uma lista simples (sem { data })
        const resposta = await request("/users" + consulta({ populate: "role", sort: "createdAt:desc" }));
        const lista = Array.isArray(resposta) ? resposta : (resposta.data || []);

        contador.textContent = lista.length;
        if (!lista.length) return mensagemTabela(tbody, "Nenhum usuário encontrado.");
        tbody.replaceChildren(...lista.map(linhaUsuario));
    } catch (erro) {
        contador.textContent = "?";
        mensagemTabela(tbody, `Erro ao carregar usuários: ${erro.message}`);
    }
}

/* ========================= início ========================= */

function recarregarTudo() {
    return Promise.all([
        carregarResumo(),
        carregarDenuncias(),
        carregarAnuncios(),
        carregarUsuarios(),
    ]);
}

function ligarEventos() {
    $("#denuncias .filtros").addEventListener("submit", e => {
        e.preventDefault();
        carregarDenuncias();
    });
    $("#filtro-status").addEventListener("change", carregarDenuncias);

    $("#anuncios .filtros").addEventListener("submit", e => {
        e.preventDefault();
        carregarAnuncios();
    });
}

async function iniciar() {
    const admin = await verificarAdmin();
    if (!admin) return;     // redirecionado: a página continua escondida

    usuarioAtual = admin;
    $("#logo-admin h2").textContent = `Olá, ${admin.username}`;

    ligarEventos();
    document.documentElement.style.visibility = "visible";
    await recarregarTudo();
}

iniciar();
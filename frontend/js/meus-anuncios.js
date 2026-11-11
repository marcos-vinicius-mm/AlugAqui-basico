import { obterUsuario } from "./auth.js";
import { request, urlMidia } from "./api.js";

const usuario = obterUsuario();
if (!usuario) location.replace("login.html");

const lista = document.getElementById("lista-meus-anuncios");
const resumo = document.getElementById("resumo-meus");
const msg = document.getElementById("msg-meus");

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function tipoTexto(tipo) {
  const mapa = { casa: "Casa", apartamento: "Apartamento", kitnet: "Kitnet", comercial: "Comercial" };
  return mapa[tipo] || tipo;
}

function mostrarAviso(texto, erro = false) {
  msg.textContent = texto;
  msg.className = `alert mt-3 mb-0 ${erro ? "alert-danger" : "alert-success"}`;
  msg.classList.remove("d-none");
}

function mostrarVazio() {
  lista.innerHTML = `
    <div class="text-center py-4 px-2">
      <p class="text-muted mb-3">Você ainda não publicou nenhum imóvel.</p>
      <a href="novo-anuncio.html" class="btn btn-primary">
        <i class="bi bi-plus-lg me-1" aria-hidden="true"></i> Criar o primeiro anúncio
      </a>
    </div>`;
}

function mostrarCarregando() {
  resumo.textContent = "Carregando…";
  lista.innerHTML = `
    <div class="d-flex align-items-center gap-2 text-muted small py-2">
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      Buscando seus anúncios…
    </div>`;
}

function criarCard(anuncio) {
  const imovel = anuncio.imovel || {};
  const id = anuncio.documentId;
  const urlEdicao = `novo-anuncio.html?id=${id}`;

  const card = document.createElement("article");
  card.className = "card border-0 shadow-sm card-anuncio-meus";

  const row = document.createElement("div");
  row.className = "row g-0 align-items-stretch";

  const colImg = document.createElement("div");
  colImg.className = "col-4 col-sm-3";

  const linkFoto = document.createElement("a");
  linkFoto.href = urlEdicao;
  linkFoto.className = "d-block h-100 text-decoration-none";

  const foto = anuncio.imagens?.[0];
  if (foto) {
    const img = document.createElement("img");
    img.src = urlMidia(foto);
    img.alt = "";
    img.className = "img-fluid rounded-start w-100 h-100 object-fit-cover";
    img.style.minHeight = "120px";
    img.style.maxHeight = "140px";
    linkFoto.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className =
      "d-flex align-items-center justify-content-center bg-light text-muted small rounded-start h-100";
    placeholder.style.minHeight = "120px";
    placeholder.textContent = "Sem foto";
    linkFoto.appendChild(placeholder);
  }
  colImg.appendChild(linkFoto);

  const colCorpo = document.createElement("div");
  colCorpo.className = "col-8 col-sm-9";

  const corpo = document.createElement("div");
  corpo.className = "card-body py-3 d-flex flex-column h-100";

  const titulo = document.createElement("h3");
  titulo.className = "h6 card-title mb-1";
  titulo.textContent = anuncio.titulo || "Sem título";

  const preco = document.createElement("p");
  preco.className = "mb-1 fw-bold text-primary";
  preco.textContent = formatarPreco(anuncio.preco);

  const info = document.createElement("p");
  info.className = "card-text small text-muted mb-2";
  const quartos = imovel.qtd_quartos ?? 0;
  const quartosLabel = quartos === 1 ? "1 quarto" : `${quartos} quartos`;
  info.textContent = `${tipoTexto(imovel.tipo)} · ${imovel.bairro || "—"} · ${quartosLabel}`;

  const acoes = document.createElement("div");
  acoes.className = "d-flex flex-wrap gap-2 mt-auto";

  const linkEditar = document.createElement("a");
  linkEditar.href = urlEdicao;
  linkEditar.className = "btn btn-sm btn-outline-primary";
  linkEditar.innerHTML = '<i class="bi bi-pencil me-1" aria-hidden="true"></i> Editar';

  const btnExcluir = document.createElement("button");
  btnExcluir.type = "button";
  btnExcluir.className = "btn btn-sm btn-outline-danger";
  btnExcluir.innerHTML = '<i class="bi bi-trash me-1" aria-hidden="true"></i> Excluir';
  btnExcluir.addEventListener("click", () => excluirAnuncio(anuncio, card, btnExcluir));

  acoes.append(linkEditar, btnExcluir);
  corpo.append(titulo, preco, info, acoes);
  colCorpo.appendChild(corpo);
  row.append(colImg, colCorpo);
  card.appendChild(row);

  return card;
}

function atualizarResumo() {
  const total = lista.querySelectorAll(".card-anuncio-meus").length;
  resumo.textContent =
    total === 0
      ? "Nenhum anúncio publicado."
      : `${total} anúncio${total > 1 ? "s" : ""} · mais recentes primeiro`;
}

async function excluirAnuncio(anuncio, card, botao) {
  const titulo = anuncio.titulo || "este anúncio";
  const ok = confirm(`Excluir "${titulo}"? Essa ação não pode ser desfeita.`);
  if (!ok) return;

  const textoOriginal = botao.innerHTML;
  botao.disabled = true;
  botao.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Excluindo…';

  try {
    await request(`/anuncios/${anuncio.documentId}`, { method: "DELETE" });
    card.remove();
    if (!lista.querySelector(".card-anuncio-meus")) {
      resumo.textContent = "Nenhum anúncio publicado.";
      mostrarVazio();
    } else {
      atualizarResumo();
    }
    mostrarAviso("Anúncio excluído.", false);
  } catch (erro) {
    botao.disabled = false;
    botao.innerHTML = textoOriginal;
    mostrarAviso(erro.message || "Não foi possível excluir.", true);
  }
}

async function carregar() {
  msg.classList.add("d-none");
  mostrarCarregando();

  try {
    const resposta = await request("/anuncios", {
      headersExtra: { "X-Meus-Anuncios": "1" },
    });
    const itens = resposta.data || [];

    lista.replaceChildren();
    if (!itens.length) {
      resumo.textContent = "Nenhum anúncio publicado.";
      mostrarVazio();
      return;
    }

    itens.forEach((a) => lista.appendChild(criarCard(a)));
    atualizarResumo();
  } catch (erro) {
    lista.replaceChildren();
    resumo.textContent = "Não foi possível carregar.";
    const texto =
      erro.message === "Failed to fetch"
        ? "Não consegui falar com o servidor. O Strapi está rodando em localhost:1337?"
        : erro.message || "Erro ao carregar anúncios.";
    mostrarAviso(texto, true);
  }
}

const params = new URLSearchParams(location.search);
if (params.get("salvo") === "1") {
  mostrarAviso("Anúncio salvo com sucesso.", false);
  history.replaceState(null, "", "meus-anuncios.html");
}

carregar();

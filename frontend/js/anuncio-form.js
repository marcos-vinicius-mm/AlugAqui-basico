import { obterUsuario } from "./auth.js";
import { request, uploadArquivos, urlMidia } from "./api.js";

const usuario = obterUsuario();
if (!usuario) location.replace("login.html");

const params = new URLSearchParams(location.search);
const anuncioId = params.get("id");

const form = document.getElementById("form-anuncio");
const msg = document.getElementById("msg-form");
const preview = document.getElementById("preview-fotos");
const inputImagens = document.getElementById("imagens");
const ajudaFotos = document.getElementById("ajuda-fotos");
const tituloForm = document.getElementById("titulo-form");
const btnSalvar = document.getElementById("btn-salvar");
const acoesForm = document.getElementById("acoes-form");

let imagensExistentesIds = [];
let imagensExistentesCache = [];
let documentoImovel = null;
let formularioAlterado = false;

function mostrarMsg(texto, erro = true) {
  msg.textContent = texto;
  msg.hidden = false;
  msg.classList.toggle("erro", erro);
  msg.classList.toggle("sucesso", !erro);
}

function limparMsg() {
  msg.hidden = true;
}

function definirFormularioAtivo(ativo) {
  form.classList.toggle("form-desabilitado", !ativo);
  for (const el of form.elements) {
    if (el === btnSalvar) continue;
    el.disabled = !ativo;
  }
  btnSalvar.disabled = !ativo;
}

function campo(formulario, nome) {
  return formulario.elements.namedItem(nome);
}

function apenasDigitosCep(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  return digitos || undefined;
}

function cepParaCampo(valor) {
  const digitos = apenasDigitosCep(valor);
  if (!digitos) return "";
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`;
}

function lerDados(formulario) {
  const titulo = campo(formulario, "titulo");
  const tipo = campo(formulario, "tipo");
  const bairro = campo(formulario, "bairro");
  const preco = campo(formulario, "preco");

  return {
    titulo: titulo?.value?.trim() ?? "",
    descricao: campo(formulario, "descricao")?.value?.trim() ?? "",
    preco: Number(preco?.value),
    tipo: tipo?.value ?? "",
    bairro: bairro?.value?.trim() ?? "",
    rua: campo(formulario, "rua")?.value?.trim() || undefined,
    numero: campo(formulario, "numero")?.value?.trim() || undefined,
    cep: apenasDigitosCep(campo(formulario, "cep")?.value),
    qtd_quartos: Number(campo(formulario, "qtd_quartos")?.value),
    qtd_banheiros: Number(campo(formulario, "qtd_banheiros")?.value),
    aceita_pets: campo(formulario, "aceita_pets")?.checked ?? false,
    mobiliado: campo(formulario, "mobiliado")?.checked ?? false,
    arquivosNovos: [...(inputImagens.files || [])],
  };
}

function validar(dados, editando) {
  if (!dados.titulo) return "Informe o título do anúncio.";
  if (!dados.tipo) return "Selecione o tipo do imóvel.";
  if (!dados.bairro) return "Informe o bairro.";
  if (!Number.isFinite(dados.preco) || dados.preco < 0) {
    return "Informe um preço válido.";
  }
  if (!editando && dados.arquivosNovos.length === 0) {
    return "Adicione pelo menos uma foto.";
  }
  if (editando && dados.arquivosNovos.length === 0 && imagensExistentesIds.length === 0) {
    return "O anúncio precisa de pelo menos uma foto.";
  }
  return null;
}

function montarPreviewExistente(imagens) {
  preview.replaceChildren();
  for (const img of imagens) {
    const el = document.createElement("img");
    el.src = urlMidia(img);
    el.alt = "Foto do anúncio";
    preview.appendChild(el);
  }
}

function montarPreviewNovas(arquivos) {
  preview.replaceChildren();
  for (const arquivo of arquivos) {
    const el = document.createElement("img");
    el.src = URL.createObjectURL(arquivo);
    el.alt = "Pré-visualização";
    preview.appendChild(el);
  }
}

inputImagens.addEventListener("change", () => {
  limparMsg();
  formularioAlterado = true;
  if (inputImagens.files.length) {
    montarPreviewNovas([...inputImagens.files]);
  } else if (imagensExistentesCache.length) {
    montarPreviewExistente(imagensExistentesCache);
  }
});

form.addEventListener("input", () => {
  formularioAlterado = true;
});

const linkCancelar = document.getElementById("link-cancelar");
if (linkCancelar) {
  linkCancelar.addEventListener("click", (evento) => {
    if (!formularioAlterado) return;
    const sair = confirm("Descartar as alterações?");
    if (!sair) evento.preventDefault();
  });
}

async function excluirAnuncioAtual() {
  const ok = confirm("Excluir este anúncio? Essa ação não pode ser desfeita.");
  if (!ok) return;

  definirFormularioAtivo(false);
  try {
    await request(`/anuncios/${anuncioId}`, { method: "DELETE" });
    location.href = "meus-anuncios.html";
  } catch (erro) {
    definirFormularioAtivo(true);
    mostrarMsg(erro.message || "Não foi possível excluir.");
  }
}

function adicionarBotaoExcluir() {
  if (document.getElementById("btn-excluir-anuncio")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btn-excluir-anuncio";
  btn.className = "btn btn-outline-danger me-auto";
  btn.textContent = "Excluir anúncio";
  btn.addEventListener("click", excluirAnuncioAtual);

  acoesForm.prepend(btn);
  acoesForm.classList.add("acoes-com-excluir");
}

async function carregarEdicao() {
  definirFormularioAtivo(false);
  tituloForm.textContent = "Editar anúncio";
  btnSalvar.textContent = "Salvar alterações";
  ajudaFotos.textContent = "Envie novas fotos só se quiser trocar as atuais. As imagens antigas são mantidas.";

  try {
  const resposta = await request(`/anuncios/${anuncioId}`);
  const item = resposta.data;

  if (!item) throw new Error("Anúncio não encontrado.");

  const imovel = item.imovel;
  if (!imovel?.documentId) throw new Error("Imóvel deste anúncio não foi encontrado.");

  documentoImovel = imovel.documentId;
  campo(form, "titulo").value = item.titulo || "";
  campo(form, "descricao").value = item.descricao || "";
  campo(form, "preco").value = item.preco ?? "";
  campo(form, "tipo").value = imovel.tipo || "";
  campo(form, "bairro").value = imovel.bairro || "";
  campo(form, "rua").value = imovel.rua || "";
  campo(form, "numero").value = imovel.numero || "";
  campo(form, "cep").value = cepParaCampo(imovel.cep);
  campo(form, "qtd_quartos").value = imovel.qtd_quartos ?? 1;
  campo(form, "qtd_banheiros").value = imovel.qtd_banheiros ?? 1;
  campo(form, "aceita_pets").checked = !!imovel.aceita_pets;
  campo(form, "mobiliado").checked = !!imovel.mobiliado;

  imagensExistentesCache = item.imagens || [];
  imagensExistentesIds = imagensExistentesCache.map((i) => i.id);
  montarPreviewExistente(imagensExistentesCache);
  adicionarBotaoExcluir();
  formularioAlterado = false;
  } finally {
    definirFormularioAtivo(true);
  }
}

function dadosImovel(dados) {
  const corpo = {
    tipo: dados.tipo,
    bairro: dados.bairro,
    qtd_quartos: dados.qtd_quartos,
    qtd_banheiros: dados.qtd_banheiros,
    aceita_pets: dados.aceita_pets,
    mobiliado: dados.mobiliado,
  };
  if (dados.rua) corpo.rua = dados.rua;
  if (dados.numero) corpo.numero = dados.numero;
  if (dados.cep) corpo.cep = dados.cep;
  return corpo;
}

async function salvar(evento) {
  evento.preventDefault();
  limparMsg();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const dados = lerDados(form);
  const erroValidacao = validar(dados, !!anuncioId);
  if (erroValidacao) {
    mostrarMsg(erroValidacao);
    return;
  }

  definirFormularioAtivo(false);
  btnSalvar.textContent = "Salvando…";

  try {
    let idsImagens = [...imagensExistentesIds];
    if (dados.arquivosNovos.length) {
      const enviadas = await uploadArquivos(dados.arquivosNovos);
      idsImagens = enviadas.map((f) => f.id);
    }

    const corpoImovel = { data: dadosImovel(dados) };
    const corpoAnuncio = {
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        preco: dados.preco,
        imagens: idsImagens,
        status_anuncio: "ativo",
      },
    };

    if (anuncioId) {
      await request(`/imoveis/${documentoImovel}?status=published`, {
        method: "PUT",
        body: corpoImovel,
      });
      await request(`/anuncios/${anuncioId}?status=published`, {
        method: "PUT",
        body: corpoAnuncio,
      });
    } else {
      const imovelCriado = await request("/imoveis?status=published", {
        method: "POST",
        body: corpoImovel,
      });
      corpoAnuncio.data.imovel = imovelCriado.data.documentId;
      await request("/anuncios?status=published", {
        method: "POST",
        body: corpoAnuncio,
      });
    }

    mostrarMsg(anuncioId ? "Alterações salvas!" : "Anúncio publicado!", false);
    formularioAlterado = false;
    setTimeout(() => {
      location.href = "meus-anuncios.html?salvo=1";
    }, 600);
  } catch (erro) {
    mostrarMsg(erro.message || "Não foi possível salvar.");
    definirFormularioAtivo(true);
    btnSalvar.textContent = anuncioId ? "Salvar alterações" : "Publicar anúncio";
  }
}

form.addEventListener("submit", salvar);

if (anuncioId) {
  carregarEdicao().catch((erro) => mostrarMsg(erro.message));
}

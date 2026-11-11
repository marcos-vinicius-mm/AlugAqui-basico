export const API_URL = "http://localhost:1337/api";
export const STRAPI_URL = "http://localhost:1337";

export function urlMidia(arquivo) {
    if (!arquivo?.url) return "";
    return arquivo.url.startsWith("http") ? arquivo.url : `${STRAPI_URL}${arquivo.url}`;
}

function getToken() {
    return sessionStorage.getItem("token");
}

function encerrarSessaoExpirada() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    location.replace("login.html");
    throw new Error("Sessão expirada");
}

export async function request(caminho, { method = "GET", body, auth = true, headersExtra = {} } = {}) {
    const headers = { "Content-Type": "application/json", ...headersExtra };
    const token = getToken();
    
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${caminho}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    // Valida o tempo de vida do token
    if (resposta.status === 401) encerrarSessaoExpirada();

    // Valida a resposta e lança uma mensagem em caso de erro
    if (!resposta.ok) {
        const erro = await resposta.json().catch(() => null);
        throw new Error(erro?.error?.message || `Erro ${resposta.status}`);
    }

    // retorna em caso de sucesso, caso a requisição possua body, retorna o conteúdo
    return resposta.status === 204 ? null : resposta.json();
}

export async function uploadArquivos(arquivos) {
  if (!arquivos?.length) return [];

  const token = getToken();
  const form = new FormData();
  for (const arquivo of arquivos) form.append("files", arquivo);

  const resposta = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (resposta.status === 401) encerrarSessaoExpirada();

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.error?.message || `Erro no upload (${resposta.status})`);
  }

  return resposta.json();
}
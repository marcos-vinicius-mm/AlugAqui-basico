export const API_URL = "http://localhost:1337/api";

export function getToken() {
    return sessionStorage.getItem("token");
}

// Função geral para realizar requisições para o BackEnd
export async function request(caminho, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${caminho}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    // Valida o tempo de vida do token
    if (resposta.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("usuario");
        location.replace("login.html");
        throw new Error("Sessão expirada");
    }

    // Valida a resposta e lança uma mensagem em caso de erro
    if (!resposta.ok) {
        const erro = await resposta.json().catch(() => null);
        throw new Error(erro?.error?.message || `Erro ${resposta.status}`);
    }

    // retorna em caso de sucesso, caso a requisição possua body, retorna o conteúdo
    return resposta.status === 204 ? null : resposta.json();
}
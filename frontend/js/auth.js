import { use } from "react";
import { request } from "./api.js";


export function obterUsuario(){
    try{
        const usuario = sessionStorage.getItem("usuario")
        return usuario ? JSON.parse(usuario) : null;
    }catch{
        return null
    }
}

export async function login(email, senha){
    const resposta = await request("/auth/local", {
        method: "POST",
        body: {identifier: email, password: senha},
        auth: false
    })

    console.log("Resposta da autenticação:", resposta);

    sessionStorage.setItem("token", resposta.jwt)
    console.log("Token armazenado:", sessionStorage.getItem("token"));
    const usuario = await request("/users/me?populate=role")
    sessionStorage.setItem("usuario", JSON.stringify(usuario));

    return usuario
}

export async function cadastro(username, email, password, telefone = null) {
    await request("/auth/local/register", {
        method: "POST",
        body: {username: username, email: email, password: password, telefone: telefone},
        auth: false
    })

    //envia o usuário para a tela de login
    location.replace("login.html")
}

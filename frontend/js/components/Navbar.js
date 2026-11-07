(function () {

    const itensMenu = [
        { id: "home",       texto: "Home",            href: "index.html",         icone: "bi-house",       perfis: ["comum", "admin"] },
        { id: "anunciar",   texto: "Anunciar imóvel", href: "novo-anuncio.html",  icone: "bi-plus-circle", perfis: ["comum", "admin"], destaque: true },
        { id: "anuncios",   texto: "Meus anúncios",   href: "meus-anuncios.html", icone: "bi-building",    perfis: ["comum", "admin"] },
        { id: "favoritos",  texto: "Favoritos",       href: "favoritos.html",     icone: "bi-heart",       perfis: ["comum", "admin"] },
        { id: "perfil",     texto: "Meu perfil",      href: "perfil.html",        icone: "bi-person",      perfis: ["comum", "admin"] },
        { id: "admin",      texto: "Painel admin",    href: "Admin.html",         icone: "bi-gear",        perfis: ["admin"] },
    ];

    // Função auxiliar para a criação dos elementos html
    function criar(tag, classes, texto) {
        const el = document.createElement(tag);
        if (classes) el.className = classes;
        if (texto) el.textContent = texto;
        return el;
    }

    function obterUsuario() {
        try {
            return JSON.parse(localStorage.getItem("usuario"));
        } catch {
            return null;
        }
    }

    // Função que define quais itens do menu aparecem com base nas permissões do tipo de usuário
    function filtrarItens(usuario, idsOcultos) {
        const paginaAtual = location.pathname.split("/").pop() || "index.html";

        return itensMenu.filter(item =>
            item.perfis.includes(usuario.tipo) &&   
            !idsOcultos.includes(item.id) &&        
            item.href !== paginaAtual               
        );
    }

    // ===== 4. PEÇAS DO MENU =====
    function criarLink(item) {
        const li = criar("li", "nav-item");
        const a = criar("a", "nav-link d-flex align-items-center gap-2");
        a.href = item.href;
        if (item.destaque) a.classList.add("link-destaque");

        a.appendChild(criar("i", `bi ${item.icone}`));
        a.appendChild(criar("span", "", item.texto));
        li.appendChild(a);
        return li;
    }

    function criarBotao() {
        const nav = criar("nav", "navbar");
        nav.dataset.bsTheme = "dark";

        const btn = criar("button", "btn-menu navbar-toggler");
        btn.type = "button";
        btn.dataset.bsToggle = "offcanvas";
        btn.dataset.bsTarget = "#menuLateral";
        btn.setAttribute("aria-controls", "menuLateral");
        btn.setAttribute("aria-label", "Abrir menu");
        btn.appendChild(criar("i", "bi bi-list"));

        nav.appendChild(btn);
        return nav;
    }

    function criarMenuLateral(usuario, itens) {
        const menu = criar("div", "offcanvas offcanvas-end");
        menu.id = "menuLateral";
        menu.tabIndex = -1;
        menu.setAttribute("aria-labelledby", "menuLateralLabel");

        const header = criar("div", "offcanvas-header");
        const titulo = criar("h5", "offcanvas-title", `Olá, ${usuario.nome}`);
        titulo.id = "menuLateralLabel";
        const fechar = criar("button", "btn-close");
        fechar.type = "button";
        fechar.dataset.bsDismiss = "offcanvas";
        fechar.setAttribute("aria-label", "Fechar");
        header.append(titulo, fechar);

        const body = criar("div", "offcanvas-body d-flex flex-column");
        const ul = criar("ul", "navbar-nav");
        itens.forEach(item => ul.appendChild(criarLink(item)));
        body.appendChild(ul);

        const sair = criar("button", "btn btn-cinza-sair rounded-pill mt-auto align-self-center", "Sair");
        sair.type = "button";
        sair.addEventListener("click", () => {
            localStorage.removeItem("usuario");
            location.href = "login.html";
        });
        body.appendChild(sair);

        menu.append(header, body);
        return menu;
    }

    // ===== 5. MONTAGEM =====
    function renderNavbar() {
        const container = document.getElementById("navbar");
        if (!container) return;

        const usuario = obterUsuario();
        if (!usuario) return;   // só aparece para usuário logado

        // lê o atributo data-ocultar da página: "anunciar,favoritos" -> ["anunciar", "favoritos"]
        const idsOcultos = (container.dataset.ocultar || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        const itens = filtrarItens(usuario, idsOcultos);

        container.replaceChildren(criarBotao());

        if (!document.getElementById("menuLateral")) {
            document.body.appendChild(criarMenuLateral(usuario, itens));
        }
    }

    renderNavbar();
})();
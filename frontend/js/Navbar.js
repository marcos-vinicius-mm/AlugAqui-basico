const navbarHTML = `
<nav class="navbar" data-bs-theme="dark">
        <button class="btn-menu navbar-toggler" type="button"
                data-bs-toggle="offcanvas" data-bs-target="#menuLateral"
                aria-controls="menuLateral" aria-label="Abrir menu">
            <i class="bi bi-list"></i>
        </button>
    </nav>

    <div class="offcanvas offcanvas-end" tabindex="-1" id="menuLateral" aria-labelledby="menuLateralLabel">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title" id="menuLateralLabel">Menu</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column">
            <ul class="navbar-nav">
                <li class="nav-item"><a class="nav-link active" href="#">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Link</a></li>
                
            </ul>
            <a href="#" class="btn btn-cinza-sair rounded-pill mt-auto align-self-center">Sair</a>
        </div>
    </div>
`;

document.getElementById("navbar").innerHTML = navbarHTML;
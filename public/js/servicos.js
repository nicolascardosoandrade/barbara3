document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const menuIcon = document.querySelector(".menu-icon");
  const userToggle = document.getElementById("userToggle");
  const userMenu = document.getElementById("userMenu");

  // Função para aplicar o estado inicial da sidebar com base no tamanho da tela
  function initializeSidebarState() {
    if (window.innerWidth >= 768) {
      // Em desktop, a sidebar começa colapsada
      sidebar.classList.add("collapsed");
      sidebar.classList.remove("active");
      document.body.classList.remove("no-scroll");
    } else {
      // Em mobile, a sidebar SEMPRE começa oculta
      sidebar.classList.remove("collapsed");
      sidebar.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }
  }

  // Chame a função ao carregar a página
  initializeSidebarState();

  // Toggle sidebar (collapsed for desktop, active for mobile)
  menuIcon.addEventListener("click", () => {
    if (window.innerWidth < 768) {
      sidebar.classList.toggle("active");
      document.body.classList.toggle("no-scroll");
    } else {
      sidebar.classList.toggle("collapsed");
      sidebar.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }
  });

  // Fecha a sidebar ao clicar em um item da lista em dispositivos móveis
  sidebar.querySelectorAll("nav ul li a").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768 && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
        document.body.classList.remove("no-scroll");
      }
    });
  });

  // Fecha a sidebar ao clicar fora dela em dispositivos móveis
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth < 768 &&
      sidebar.classList.contains("active") &&
      !sidebar.contains(e.target) &&
      !menuIcon.contains(e.target)
    ) {
      sidebar.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }
  });

  // Gerencia a sidebar ao redimensionar a janela
  window.addEventListener("resize", initializeSidebarState);

  // User dropdown
  userToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.style.display = userMenu.style.display === "flex" ? "none" : "flex";
  });

  // Fecha dropdown ao clicar fora
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target) && e.target !== userToggle) {
      userMenu.style.display = "none";
    }
  });

  // Logout function
  window.logout = () => {
    alert("Você saiu com sucesso!");
    // window.location.href = "login.html";
  };

  // === Dados dos serviços ===
  const dadosServicos = [
    ["AAPI", "Sessão de 1h", "1:00", "R$120,00", "30"],
    ["ABERTTA", "Sessão de 1h", "1:00", "R$84,26", "60"],
    ["ABERTTA", "1ª Sessão de 30 min", "0:30", "R$54,46", "60"],
    ["ABERTTA", "Sessão de 30 min", "0:30", "R$42,13", "60"],
    ["ALMOÇO", "Intervalo de 1:30 min", "1:30", "R$0,00", "-"],
    ["ALMOÇO", "Intervalo de 1 hora", "1:00", "R$0,00", "-"],
    ["AMIL", "Sessão de 30 min", "0:30", "R$40,00", "60"],
    ["CASAL", "Sessão de 1h", "1:00", "R$250,00", "30"],
  ];

  // === Inicializar DataTable ===
  if (window.jQuery && $.fn.dataTable) {
    const tabela = $("#tabela-servicos").DataTable({
      data: dadosServicos,
      columns: [
        { title: "CONVÊNIO", data: 0 },
        { title: "CONSULTA", data: 1 },
        { title: "DURAÇÃO", data: 2 },
        { title: "VALOR", data: 3 },
        { title: "PAGAMENTO", data: 4 },
      ],
      colReorder: true,
      paging: false,
      searching: false,
      info: false,
      language: {
        emptyTable: "Nenhum dado disponível",
        loadingRecords: "Carregando...",
        processing: "Processando...",
        zeroRecords: "Nenhum registro encontrado",
      },
      createdRow: (row, data, dataIndex) => {
        $(row)
          .find("td")
          .each(function (index) {
            const labels = ["CONVÊNIO", "CONSULTA", "DURAÇÃO", "VALOR", "PAGAMENTO"];
            $(this).attr("data-label", labels[index]);
          });
      },
    });

    // === Integração com campo de pesquisa do cabeçalho ===
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function () {
      tabela.search(this.value).draw();
    });
  } else {
    console.warn("jQuery ou DataTables não carregados corretamente.");
  }

  // === Botão Adicionar ===
  const btnAdicionar = document.getElementById("btnAdicionar");
  btnAdicionar.addEventListener("click", () => {
    alert("Funcionalidade de adicionar serviço será implementada aqui.");
  });

  // === Botão Filtrar ===
  const btnFiltrar = document.getElementById("btnFiltrar");
  btnFiltrar.addEventListener("click", () => {
    btnFiltrar.classList.toggle("active");
    alert("Funcionalidade de filtro será implementada aqui.");
  });

  // === Botão Selecionar ===
  const btnSelecionar = document.getElementById("btnSelecionar");
  let selectMode = false;
  btnSelecionar.addEventListener("click", () => {
    selectMode = !selectMode;
    btnSelecionar.classList.toggle("active");
    const icon = btnSelecionar.querySelector(".material-icons");
    icon.textContent = selectMode ? "check_box" : "check_box_outline_blank";

    if (selectMode) {
      alert("Modo de seleção ativado. Funcionalidade será implementada.");
    } else {
      alert("Modo de seleção desativado.");
    }
  });
});
let allPatients = [];
let dataTable;

document.addEventListener('DOMContentLoaded', async function () {
  // === CONFIGURAÇÃO DA SIDEBAR (Desktop/Mobile) ===
  const sidebar = document.querySelector(".sidebar");
  const menuIcon = document.querySelector(".menu-icon");
  const userToggle = document.getElementById("userToggle");
  const userMenu = document.getElementById("userMenu");

  function initializeSidebarState() {
    if (window.innerWidth >= 768) {
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('active');
      document.body.classList.remove("no-scroll");
    } else {
      sidebar.classList.remove('collapsed');
      sidebar.classList.remove('active');
      document.body.classList.remove("no-scroll");
    }
  }
  initializeSidebarState();

  menuIcon.addEventListener("click", () => {
    if (window.innerWidth < 768) {
      sidebar.classList.toggle("active");
      document.body.classList.toggle("no-scroll");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  });

  sidebar.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768 && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        document.body.classList.remove("no-scroll");
      }
    });
  });

  document.addEventListener('click', e => {
    if (window.innerWidth < 768 && sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && !menuIcon.contains(e.target)) {
      sidebar.classList.remove('active');
      document.body.classList.remove("no-scroll");
    }
  });

  window.addEventListener('resize', initializeSidebarState);

  // === DROPDOWN DO USUÁRIO ===
  userToggle.addEventListener("click", e => {
    e.stopPropagation();
    userMenu.style.display = userMenu.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", e => {
    if (!userMenu.contains(e.target) && e.target !== userToggle) {
      userMenu.style.display = "none";
    }
  });

  window.logout = () => {
    alert("Você saiu com sucesso!");
  };

  // === INICIALIZA DATATABLES ===
  dataTable = $('#tabela-aniversariantes').DataTable({
    colReorder: true,
    paging: true,
    pageLength: 10,
    lengthMenu: [10, 25, 50, 100],
    searching: true,
    info: true,
    order: [[1, 'desc']], // Ordena por idade (desc)
    language: {
      emptyTable: "Nenhum aniversariante nesta semana",
      zeroRecords: "Nenhum aniversariante encontrado",
      info: "Mostrando _START_ a _END_ de _TOTAL_ aniversariantes",
      infoEmpty: "Nenhum aniversariante",
      infoFiltered: "(filtrado de _MAX_ no total)",
      lengthMenu: "Mostrar _MENU_ aniversariantes",
      paginate: {
        previous: "Anterior",
        next: "Próximo"
      },
      search: "Buscar aniversariante:"
    },
    columnDefs: [
      { targets: 0, width: "50%" }, // Nome
      { targets: 1, width: "50%", className: "text-center" } // Idade
    ]
  });

  // === CARREGA PACIENTES DO BANCO ===
  await loadPatients();

  // === Integração com campo de pesquisa do cabeçalho ===
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      dataTable.search(this.value).draw();
    });
  }

  // === Botão Adicionar ===
  const btnAdicionar = document.getElementById("btnAdicionar");
  btnAdicionar.addEventListener("click", () => {
    alert("Funcionalidade de adicionar aniversariante será implementada aqui.");
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

// === FUNÇÃO: CARREGA PACIENTES DO MYSQL ===
async function loadPatients() {
  try {
    const response = await fetch('/api/pacientes');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const patients = await response.json();
    const today = new Date();

    allPatients = patients.map(p => {
      const birth = new Date(p.data_nascimento);
      const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());

      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      const isUpcomingBirthday = (nextBirthday - today) / (1000 * 60 * 60 * 24) <= 7;

      if (!isUpcomingBirthday) return null;

      const ageDiff = today - birth;
      const ageDate = new Date(ageDiff);
      const years = today.getFullYear() - birth.getFullYear();
      const months = today.getMonth() - birth.getMonth() + (today.getDate() < birth.getDate() ? -1 : 0);
      const days = today.getDate() - birth.getDate() + (today.getDate() < birth.getDate() ? new Date(today.getFullYear(), today.getMonth(), 0).getDate() : 0);

      const adjustedYears = months < 0 ? years - 1 : years;
      const adjustedMonths = months < 0 ? months + 12 : months;

      return {
        name: p.nome_completo.trim(),
        ageYears: adjustedYears,
        ageMonths: adjustedMonths,
        ageDays: days,
        birthdayDate: nextBirthday.toLocaleDateString('pt-BR')
      };
    }).filter(p => p !== null);

    // Exibe os aniversariantes da semana
    displayBirthdays();
  } catch (error) {
    console.error("Erro ao carregar pacientes:", error);
    alert("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
  }
}

// === FUNÇÃO: EXIBIR ANIVERSARIANTES DA SEMANA ===
function displayBirthdays() {
  dataTable.clear();
  if (allPatients.length === 0) {
    dataTable.draw();
    return;
  }

  allPatients.forEach(p => {
    const idadeTexto = `${p.ageYears} anos, ${p.ageMonths} meses, ${p.ageDays} dias (em ${p.birthdayDate})`;

    dataTable.row.add([
      p.name,
      idadeTexto
    ]);
  });

  dataTable.draw();
}
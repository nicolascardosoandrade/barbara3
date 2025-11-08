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
  dataTable = $('#ageFilterTable').DataTable({
    colReorder: true,
    paging: true,
    pageLength: 10,
    lengthMenu: [10, 25, 50, 100],
    searching: true,
    info: true,
    order: [[1, 'desc']], // Ordena por idade (desc)
    language: {
      emptyTable: "Nenhum paciente cadastrado",
      zeroRecords: "Nenhum paciente encontrado com esse filtro",
      info: "Mostrando _START_ a _END_ de _TOTAL_ pacientes",
      infoEmpty: "Nenhum paciente",
      infoFiltered: "(filtrado de _MAX_ no total)",
      lengthMenu: "Mostrar _MENU_ pacientes",
      paginate: {
        previous: "Anterior",
        next: "Próximo"
      },
      search: "Buscar paciente:"
    },
    columnDefs: [
      { targets: 0, width: "40%" }, // Nome
      { targets: 1, width: "30%", className: "text-center" }, // Idade
      { targets: 2, width: "30%", className: "text-center" }  // Situação
    ]
  });

  // === CARREGA PACIENTES DO BANCO ===
  await loadPatients();

  // === FILTRA AO DIGITAR ENTER NOS CAMPOS ===
  document.getElementById('minAge').addEventListener('keypress', e => {
    if (e.key === 'Enter') filterAges();
  });
  document.getElementById('maxAge').addEventListener('keypress', e => {
    if (e.key === 'Enter') filterAges();
  });

  // === Foco automático no campo minAge ===
  document.getElementById('minAge').focus();
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
      let years = today.getFullYear() - birth.getFullYear();
      let months = today.getMonth() - birth.getMonth();

      // Ajusta se o aniversário ainda não passou este ano
      if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        years--;
        months += 12;
      }

      return {
        name: p.nome_completo.trim(),
        ageYears: years,
        ageMonths: months,
        status: p.situacao || 'Ativo'
      };
    });

    // Exibe todos os pacientes ao carregar
    filterAges();
  } catch (error) {
    console.error("Erro ao carregar pacientes:", error);
    alert("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
  }
}

// === FUNÇÃO PRINCIPAL: FILTRAR IDADES ===
window.filterAges = function () {
  const minInput = document.getElementById('minAge');
  const maxInput = document.getElementById('maxAge');

  const min = parseInt(minInput.value) || 0;
  const max = parseInt(maxInput.value) || 150;

  // Validação simples
  if (min < 0) minInput.value = 0;
  if (max < min) {
    maxInput.value = min;
    return alert("Idade máxima não pode ser menor que mínima!");
  }

  const filtered = allPatients.filter(p => 
    p.ageYears >= min && p.ageYears <= max
  );

  // Limpa e recarrega a tabela
  dataTable.clear();
  if (filtered.length === 0) {
    dataTable.draw();
    return;
  }

  filtered.forEach(p => {
    const idadeTexto = p.ageYears === 1 
      ? `${p.ageYears} ano, ${p.ageMonths} meses`
      : `${p.ageYears} anos, ${p.ageMonths} meses`;

    const statusHtml = p.status === 'Ativo'
      ? '<span style="color:#2e7d32; font-weight:bold;">Ativo</span>'
      : '<span style="color:#c62828; font-weight:bold;">Inativo</span>';

    dataTable.row.add([
      p.name,
      idadeTexto,
      statusHtml
    ]);
  });

  dataTable.draw();
};

// === FILTRA AUTOMATICAMENTE AO MUDAR OS VALORES (OPCIONAL) ===
/*
document.getElementById('minAge').addEventListener('input', filterAges);
document.getElementById('maxAge').addEventListener('input', filterAges);
*/
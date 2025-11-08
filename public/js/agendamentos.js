document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar")
  const menuIcon = document.querySelector(".menu-icon")
  const userToggle = document.getElementById("userToggle")
  const userMenu = document.getElementById("userMenu")

  // -------------------------------------------------
  // Sidebar
  // -------------------------------------------------
  function initializeSidebarState() {
    if (window.innerWidth >= 768) {
      sidebar.classList.add("collapsed")
      sidebar.classList.remove("active")
      document.body.classList.remove("no-scroll")
    } else {
      sidebar.classList.remove("collapsed")
      sidebar.classList.remove("active")
      document.body.classList.remove("no-scroll")
    }
  }
  initializeSidebarState()

  menuIcon.addEventListener("click", () => {
    if (window.innerWidth < 768) {
      sidebar.classList.toggle("active")
      document.body.classList.toggle("no-scroll")
    } else {
      sidebar.classList.toggle("collapsed")
      sidebar.classList.remove("active")
      document.body.classList.remove("no-scroll")
    }
  })

  sidebar.querySelectorAll("nav ul li a").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768 && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active")
        document.body.classList.remove("no-scroll")
      }
    })
  })

  document.addEventListener("click", (e) => {
    if (
      window.innerWidth < 768 &&
      sidebar.classList.contains("active") &&
      !sidebar.contains(e.target) &&
      !menuIcon.contains(e.target)
    ) {
      sidebar.classList.remove("active")
      document.body.classList.remove("no-scroll")
    }
  })

  window.addEventListener("resize", initializeSidebarState)

  // -------------------------------------------------
  // User dropdown
  // -------------------------------------------------
  userToggle.addEventListener("click", (e) => {
    e.stopPropagation()
    userMenu.style.display = userMenu.style.display === "flex" ? "none" : "flex"
  })
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target) && e.target !== userToggle) {
      userMenu.style.display = "none"
    }
  })

  window.logout = () => {
    alert("Você saiu com sucesso!")
  }

  // -------------------------------------------------
  // Exportar Excel
  // -------------------------------------------------
  const btnExport = document.getElementById("btnExport")
  const XLSX = window.XLSX
  btnExport.addEventListener("click", () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.table_to_sheet(document.getElementById("appointmentsTable"))
    XLSX.utils.book_append_sheet(wb, ws, "Agendamentos")
    XLSX.writeFile(wb, "agendamentos.xlsx")
  })

  // -------------------------------------------------
  // Filtro
  // -------------------------------------------------
  const btnFiltrar = document.getElementById("btnFiltrar")
  const filterPanel = document.getElementById("filterPanel")
  const closeFilter = document.getElementById("closeFilter")
  const btnLimparFiltros = document.getElementById("btnLimparFiltros")
  const btnAplicarFiltros = document.getElementById("btnAplicarFiltros")

  async function carregarConveniosFiltro() {
    try {
      const response = await fetch("/api/convenios")
      const convenios = await response.json()
      const select = document.getElementById("filterConvenio")
      select.innerHTML = '<option value="">Todos</option>'
      convenios.forEach((c) => {
        const opt = document.createElement("option")
        opt.value = c.nome_convenio
        opt.textContent = c.nome_convenio
        select.appendChild(opt)
      })
    } catch (err) {
      console.error("Erro ao carregar convênios para filtro:", err)
    }
  }

  btnFiltrar.addEventListener("click", () => {
    btnFiltrar.classList.toggle("active")
    filterPanel.classList.toggle("show")
    if (filterPanel.classList.contains("show")) carregarConveniosFiltro()
  })
  closeFilter.addEventListener("click", () => {
    filterPanel.classList.remove("show")
    btnFiltrar.classList.remove("active")
  })

  btnLimparFiltros.addEventListener("click", () => {
    document.getElementById("filterNome").value = ""
    document.getElementById("filterConvenio").value = ""
    document.getElementById("filterData").value = ""
    $("#appointmentsTable").DataTable().search("").columns().search("").draw()
  })

  btnAplicarFiltros.addEventListener("click", () => {
    const filterNome = document.getElementById("filterNome").value.toUpperCase()
    const filterConvenio = document.getElementById("filterConvenio").value
    const filterData = document.getElementById("filterData").value

    const tabela = $("#appointmentsTable").DataTable()

    $.fn.dataTable.ext.search.pop() // Remove filtro anterior
    $.fn.dataTable.ext.search.push((settings, data) => {
      // ÍNDICES ATUALIZADOS (sem Telefone):
      // 0: Data, 1: Paciente, 2: Início, 3: Fim, 4: Convênio, 5: Consulta, 6: Frequência, 7: Valor
      const nome = (data[1] || "").toUpperCase()
      const convenio = data[4] || ""
      const dataConsulta = data[0] || ""

      const nomeOk = !filterNome || nome.includes(filterNome)
      const convenioOk = !filterConvenio || convenio === filterConvenio
      const dataOk = !filterData || dataConsulta === new Date(filterData).toLocaleDateString("pt-BR")

      return nomeOk && convenioOk && dataOk
    })

    tabela.draw()
  })

  // -------------------------------------------------
  // Tabela (SEM COLUNA TELEFONE)
  // -------------------------------------------------
  const tabela = $("#appointmentsTable").DataTable({
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json",
    },
    colReorder: true,
    paging: true,
    searching: true,
    info: true,
    lengthChange: true,
    order: [[0, "desc"]],
    columnDefs: [
      { orderable: false, targets: -1 },
      { className: "dt-center", targets: "_all" },
    ],
  })

  document.getElementById("searchInput").addEventListener("input", (e) => {
    tabela.search(e.target.value).draw()
  })

  async function carregarAgendamentos() {
    try {
      const response = await fetch("/api/agendamentos")
      if (!response.ok) throw new Error("Erro ao carregar agendamentos")
      const agendamentos = await response.json()

      tabela.clear()
      agendamentos.forEach((ag) => {
        const valorFormatado = ag.valor
          ? `R$ ${parseFloat(ag.valor).toFixed(2).replace(".", ",")}`
          : "R$ 0,00"

        const actions = `
          <button class="btn-ver-mais" data-agendamento='${JSON.stringify(ag)}'>
            <span class="material-icons">visibility</span>
          </button>
        `

        tabela.row.add([
          ag.data_consulta,
          ag.nome_paciente,
          // TELEFONE REMOVIDO
          ag.inicio,
          ag.fim,
          ag.convenio,
          ag.consulta,
          ag.frequencia,
          valorFormatado,
          actions,
        ])
      })
      tabela.draw()
    } catch (err) {
      console.error(err)
      alert("Erro ao carregar agendamentos")
    }
  }

  carregarAgendamentos()

  // -------------------------------------------------
  // Modal Adicionar/Editar
  // -------------------------------------------------
  const modal = document.getElementById("modal")
  const btnAdicionar = document.getElementById("btnAdicionar")
  const closeModal = document.getElementById("closeModal")
  const btnCancelar = document.getElementById("btnCancelar")
  const form = document.getElementById("appointmentForm")
  const modalTitle = document.getElementById("modalTitle")
  const btnSalvar = form.querySelector(".btn-salvar")

  let isEditMode = false
  let agendamentoId = null

  async function carregarPacientes() {
    try {
      const response = await fetch("/api/pacientes")
      const pacientes = await response.json()
      window.pacientes = pacientes; // Armazenar globalmente para lookup rápido
      const select = document.getElementById("nomePaciente")
      select.innerHTML = '<option value="">Procurar paciente...</option>'
      pacientes.forEach((p) => {
        const opt = document.createElement("option")
        opt.value = p.nome_completo
        opt.textContent = p.nome_completo
        select.appendChild(opt)
      })
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err)
    }
  }

  async function carregarConvenios() {
    try {
      const response = await fetch("/api/convenios")
      const convenios = await response.json()
      const select = document.getElementById("convenio")
      select.innerHTML = '<option value="">Selecionar convênio...</option>'
      convenios.forEach((c) => {
        const opt = document.createElement("option")
        opt.value = c.nome_convenio
        opt.textContent = c.nome_convenio
        select.appendChild(opt)
      })
    } catch (err) {
      console.error("Erro ao carregar convênios:", err)
    }
  }

  async function atualizarValorConvenio(convenioNome) {
    if (!convenioNome) {
      document.getElementById("valorConsulta").value = "R$ 0,00"
      return
    }
    try {
      const response = await fetch(`/api/convenios/nome/${convenioNome}`)
      const convenio = await response.json()
      const valor = convenio.valor || 0
      document.getElementById("valorConsulta").value = `R$ ${parseFloat(valor).toFixed(2).replace(".", ",")}`
    } catch (err) {
      document.getElementById("valorConsulta").value = "R$ 0,00"
    }
  }

  // Função para preencher telefone e convênio ao selecionar paciente
  function preencherDadosPaciente(nome) {
    if (nome && window.pacientes) {
      const paciente = window.pacientes.find(p => p.nome_completo === nome);
      if (paciente) {
        document.getElementById("telefone").value = paciente.telefone || "";
        const convenioSelect = document.getElementById("convenio");
        let found = false;
        for (let i = 0; i < convenioSelect.options.length; i++) {
          if (convenioSelect.options[i].value === paciente.convenio) {
            convenioSelect.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found && paciente.convenio) {
          const opt = document.createElement("option");
          opt.value = paciente.convenio;
          opt.textContent = paciente.convenio;
          opt.selected = true;
          convenioSelect.appendChild(opt);
        }
        // Atualizar valor do convênio
        atualizarValorConvenio(paciente.convenio);
      }
    }
  }

  // Event listener para mudança no select de paciente
  document.addEventListener("change", (e) => {
    if (e.target.id === "nomePaciente") {
      preencherDadosPaciente(e.target.value);
    }
  });

  btnAdicionar.addEventListener("click", async () => {
    isEditMode = false
    agendamentoId = null
    modalTitle.textContent = "Adicionar Agendamento"
    btnSalvar.textContent = "Salvar"
    form.reset()
    document.getElementById("valorConsulta").value = "R$ 0,00"
    document.getElementById("modalidade").value = "Presencial"

    await carregarPacientes()
    await carregarConvenios()

    modal.classList.add("show")
    document.body.style.overflow = "hidden"
  })

  closeModal.onclick = btnCancelar.onclick = () => {
    modal.classList.remove("show")
    document.body.style.overflow = "auto"
  }

  document.getElementById("convenio").addEventListener("change", (e) => {
    atualizarValorConvenio(e.target.value)
  })

  // Máscara de telefone
  document.getElementById("telefone").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "")
    if (v.length > 11) v = v.slice(0, 11)
    if (v.length > 10) {
      v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    } else if (v.length > 6) {
      v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
    } else if (v.length > 2) {
      v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2")
    }
    e.target.value = v
  })

  // -------------------------------------------------
  // Modal Detalhes
  // -------------------------------------------------
  const modalDetalhes = document.getElementById("modalDetalhes")
  const closeDetalhes = document.getElementById("closeDetalhes")
  const btnFecharDetalhes = document.getElementById("btnFecharDetalhes")
  const btnEditarAgendamento = document.getElementById("btnEditarAgendamento")
  const btnExcluirAgendamento = document.getElementById("btnExcluirAgendamento")

  let agendamentoAtual = null

  document.getElementById("appointmentsTable").addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-ver-mais")
    if (btn) {
      const agendamentoData = JSON.parse(btn.getAttribute("data-agendamento"))
      try {
        const response = await fetch(`/api/agendamentos/${agendamentoData.id}`)
        if (!response.ok) throw new Error("Erro ao buscar detalhes.")
        agendamentoAtual = await response.json()
        mostrarDetalhes(agendamentoAtual)
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error)
        alert("Não foi possível carregar os detalhes.")
      }
    }
  })

  function mostrarDetalhes(ag) {
    document.getElementById("detalheData").textContent = ag.data_consulta || "-"
    document.getElementById("detalheNome").textContent = ag.nome_paciente || "-"
    document.getElementById("detalheTelefone").textContent = ag.telefone || "-"
    document.getElementById("detalheInicio").textContent = ag.inicio || "-"
    document.getElementById("detalheFim").textContent = ag.fim || "-"
    document.getElementById("detalheConvenio").textContent = ag.convenio || "-"
    document.getElementById("detalheConsulta").textContent = ag.consulta || "-"
    const detalheModalidadeSpan = document.getElementById("detalheModalidade");
    detalheModalidadeSpan.textContent = ag.modalidade || "Presencial";
    if (ag.modalidade === "Online") {
      detalheModalidadeSpan.style.color = "#ff9800"; // Laranja de destaque
    } else {
      detalheModalidadeSpan.style.color = ""; // Reset para cor padrão
    }
    document.getElementById("detalheFrequencia").textContent = ag.frequencia || "-"
    document.getElementById("detalheObservacoes").textContent = ag.observacoes || "Nenhuma observação."

    const valorFormatado = ag.valor
      ? `R$ ${parseFloat(ag.valor).toFixed(2).replace(".", ",")}`
      : "R$ 0,00"
    document.getElementById("detalheValor").textContent = valorFormatado

    modalDetalhes.classList.add("show")
    document.body.style.overflow = "hidden"
  }

  closeDetalhes.onclick = btnFecharDetalhes.onclick = () => {
    modalDetalhes.classList.remove("show")
    document.body.style.overflow = "auto"
  }

  // -------------------------------------------------
  // Editar
  // -------------------------------------------------
  btnEditarAgendamento.addEventListener("click", async () => {
    if (!agendamentoAtual?.id) return

    isEditMode = true
    agendamentoId = agendamentoAtual.id
    btnSalvar.textContent = "Atualizar"
    modalDetalhes.classList.remove("show")

    await carregarPacientes()
    await carregarConvenios()

    let dataISO = ""
    if (agendamentoAtual.data_consulta) {
      const [d, m, a] = agendamentoAtual.data_consulta.split("/")
      dataISO = `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    }

    document.getElementById("dataConsulta").value = dataISO
    document.getElementById("inicio").value = agendamentoAtual.inicio || ""
    document.getElementById("fim").value = agendamentoAtual.fim || ""

    const nomePacienteSelect = document.getElementById("nomePaciente")
    let pacienteFound = false
    for (let i = 0; i < nomePacienteSelect.options.length; i++) {
      if (nomePacienteSelect.options[i].value === agendamentoAtual.nome_paciente) {
        nomePacienteSelect.selectedIndex = i
        pacienteFound = true
        break
      }
    }
    if (!pacienteFound && agendamentoAtual.nome_paciente) {
      const opt = document.createElement("option")
      opt.value = agendamentoAtual.nome_paciente
      opt.textContent = agendamentoAtual.nome_paciente
      opt.selected = true
      nomePacienteSelect.appendChild(opt)
    }

    // Preencher dados do paciente (telefone e convênio) e disparar change para auto-fill
    preencherDadosPaciente(agendamentoAtual.nome_paciente);
    // Sobrescrever telefone se houver no agendamento (caso editado previamente)
    document.getElementById("telefone").value = agendamentoAtual.telefone || "";

    const convenioSelect = document.getElementById("convenio")
    let convenioFound = false
    for (let i = 0; i < convenioSelect.options.length; i++) {
      if (convenioSelect.options[i].value === agendamentoAtual.convenio) {
        convenioSelect.selectedIndex = i
        convenioFound = true
        break
      }
    }
    if (!convenioFound && agendamentoAtual.convenio) {
      const opt = document.createElement("option")
      opt.value = agendamentoAtual.convenio
      opt.textContent = agendamentoAtual.convenio
      opt.selected = true
      convenioSelect.appendChild(opt)
    }

    document.getElementById("consulta").value = agendamentoAtual.consulta || ""
    const modalidadeSelect = document.getElementById("modalidade");
    let modalidadeFound = false;
    for (let i = 0; i < modalidadeSelect.options.length; i++) {
      if (modalidadeSelect.options[i].value === agendamentoAtual.modalidade) {
        modalidadeSelect.selectedIndex = i;
        modalidadeFound = true;
        break;
      }
    }
    if (!modalidadeFound) {
      modalidadeSelect.value = "Presencial"; // Default se não encontrado
    }
    document.getElementById("frequencia").value = agendamentoAtual.frequencia || ""
    document.getElementById("observacoes").value = agendamentoAtual.observacoes || ""

    // Preencher o valor do agendamento atual
    const valorFormatado = agendamentoAtual.valor
      ? `R$ ${parseFloat(agendamentoAtual.valor).toFixed(2).replace(".", ",")}`
      : "R$ 0,00"
    document.getElementById("valorConsulta").value = valorFormatado

    modal.classList.add("show")
    document.body.style.overflow = "hidden"
  })

  // -------------------------------------------------
  // Salvar (Adicionar ou Editar)
  // -------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    // Parsear o valor da consulta de forma robusta para formato brasileiro
    const valorInput = formData.get("valorConsulta") || "";
    let valorConsulta = null;
    const clean = valorInput.replace(/[^\d,]/g, ''); // Manter apenas dígitos e vírgula
    if (clean) {
      const withDot = clean.replace(',', '.');
      const num = parseFloat(withDot);
      if (!isNaN(num)) {
        valorConsulta = num;
      }
    }

    const data = {
      data_consulta: formData.get("dataConsulta"),
      inicio: formData.get("inicio"),
      fim: formData.get("fim"),
      nome_paciente: formData.get("nomePaciente"),
      telefone: formData.get("telefone").replace(/\D/g, ""),
      convenio: formData.get("convenio"),
      consulta: formData.get("consulta"),
      modalidade: formData.get("modalidade"),
      frequencia: formData.get("frequencia"),
      observacoes: formData.get("observacoes"),
      valor: valorConsulta
    }

    try {
      let url = "/api/agendamentos"
      let method = "POST"

      if (isEditMode && agendamentoId) {
        url += `/${agendamentoId}`
        method = "PUT"
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao salvar agendamento")
      }

      alert(isEditMode ? "Agendamento atualizado!" : "Agendamento criado!")
      modal.classList.remove("show")
      document.body.style.overflow = "auto"
      carregarAgendamentos()
    } catch (err) {
      alert(err.message)
    }
  })

  // -------------------------------------------------
  // Excluir
  // -------------------------------------------------
  btnExcluirAgendamento.addEventListener("click", async () => {
    if (!agendamentoAtual?.id) return
    if (!confirm(`Tem certeza que deseja excluir o agendamento de ${agendamentoAtual.nome_paciente}?`)) return

    try {
      const response = await fetch(`/api/agendamentos/${agendamentoAtual.id}`, { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir agendamento.")
      }
      alert("Agendamento excluído com sucesso!")
      modalDetalhes.classList.remove("show")
      document.body.style.overflow = "auto"
      carregarAgendamentos()
    } catch (err) {
      alert(err.message)
    }
  })

  // -------------------------------------------------
  // Socket.io: Atualização em tempo real
  // -------------------------------------------------
  const socket = io()
  socket.on("agendamento-updated", () => {
    carregarAgendamentos()
  })
})
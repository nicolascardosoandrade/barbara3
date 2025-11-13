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
  const XLSX = window.XLSX
  const btnExport = document.getElementById("btnExport")
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
    const $ = window.jQuery
    const tabela = $("#appointmentsTable").DataTable()
    tabela.search("").columns().search("").draw()
  })

  btnAplicarFiltros.addEventListener("click", () => {
    const filterNome = document.getElementById("filterNome").value.toUpperCase()
    const filterConvenio = document.getElementById("filterConvenio").value
    const filterData = document.getElementById("filterData").value

    const $ = window.jQuery
    const tabela = $("#appointmentsTable").DataTable()

    $.fn.dataTable.ext.search.pop()
    $.fn.dataTable.ext.search.push((settings, data) => {
      const nome = (data[2] || "").toUpperCase()
      const convenio = data[5] || ""
      const dataConsulta = data[1] || ""

      const nomeOk = !filterNome || nome.includes(filterNome)
      const convenioOk = !filterConvenio || convenio === filterConvenio
      const dataOk = !filterData || dataConsulta === new Date(filterData).toLocaleDateString("pt-BR")

      return nomeOk && convenioOk && dataOk
    })

    tabela.draw()
  })

  // -------------------------------------------------
  // Modo de seleção
  // -------------------------------------------------
  const btnSelecionar = document.getElementById("btnSelecionar")
  const btnExcluirSelecionados = document.getElementById("btnExcluirSelecionados")
  const selectAllCheckbox = document.getElementById("selectAll")
  const btnAdicionar = document.getElementById("btnAdicionar")
  let selectMode = false

  btnSelecionar.addEventListener("click", () => {
    selectMode = !selectMode
    btnSelecionar.classList.toggle("active")
    const icon = btnSelecionar.querySelector(".material-icons")
    icon.textContent = selectMode ? "check_box" : "check_box_outline_blank"

    const $ = window.jQuery
    const tabela = $("#appointmentsTable").DataTable()

    if (selectMode) {
      // Ativar modo de seleção - mostra coluna de checkbox
      tabela.column(0).visible(true)
      btnAdicionar.style.display = "none"
      btnFiltrar.style.display = "none"
      btnExport.style.display = "none"
      btnExcluirSelecionados.style.display = "flex"
    } else {
      // Desativar modo de seleção - oculta coluna de checkbox
      tabela.column(0).visible(false)
      btnAdicionar.style.display = "flex"
      btnFiltrar.style.display = "flex"
      btnExport.style.display = "flex"
      btnExcluirSelecionados.style.display = "none"

      // Desmarcar todos os checkboxes
      selectAllCheckbox.checked = false
      document.querySelectorAll(".row-checkbox").forEach((cb) => (cb.checked = false))
    }
  })

  // Selecionar todos os checkboxes
  selectAllCheckbox.addEventListener("change", (e) => {
    const checkboxes = document.querySelectorAll(".row-checkbox")
    checkboxes.forEach((checkbox) => {
      checkbox.checked = e.target.checked
    })
  })

  // Botão de excluir selecionados
  btnExcluirSelecionados.addEventListener("click", async () => {
    const checkboxesMarcados = document.querySelectorAll(".row-checkbox:checked")

    if (checkboxesMarcados.length === 0) {
      alert("Nenhum agendamento selecionado!")
      return
    }

    const ids = Array.from(checkboxesMarcados).map((cb) => cb.dataset.id)

    if (!confirm(`Tem certeza que deseja excluir ${ids.length} agendamento(s) selecionado(s)?`)) {
      return
    }

    try {
      const promises = ids.map((id) => fetch(`/api/agendamentos/${id}`, { method: "DELETE" }).then((res) => res.json()))

      const results = await Promise.all(promises)

      const sucessos = results.filter((r) => r.success || r.message).length
      const falhas = results.filter((r) => !r.success && !r.message).length

      if (sucessos > 0) {
        alert(`${sucessos} agendamento(s) excluído(s) com sucesso!${falhas > 0 ? ` ${falhas} falharam.` : ""}`)
        await carregarAgendamentos()
      } else {
        alert("Erro ao excluir agendamentos.")
      }
    } catch (error) {
      console.error("Erro ao excluir agendamentos:", error)
      alert("Erro ao conectar com o servidor.")
    }
  })

  // -------------------------------------------------
  // Tabela com coluna de checkbox
  // -------------------------------------------------
  const tabela = window.jQuery("#appointmentsTable").DataTable({
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json",
    },
    colReorder: true,
    paging: true,
    searching: true,
    info: true,
    lengthChange: true,
    order: [[1, "desc"]],
    columnDefs: [
      { orderable: false, targets: [0, -1] },
      { className: "dt-center", targets: "_all" },
      { targets: 0, visible: false }, // Coluna de checkbox inicia oculta
    ],
  })

  document.getElementById("searchInput").addEventListener("input", (e) => {
    tabela.search(e.target.value).draw()
  })

  let todosOsAgendamentos = []

  async function carregarAgendamentos() {
    try {
      const response = await fetch("/api/agendamentos")
      if (!response.ok) throw new Error("Erro ao carregar agendamentos")
      const agendamentos = await response.json()

      todosOsAgendamentos = agendamentos

      tabela.clear()
      agendamentos.forEach((ag) => {
        const valorFormatado = ag.valor ? `R$ ${Number.parseFloat(ag.valor).toFixed(2).replace(".", ",")}` : "R$ 0,00"

        const checkboxHtml = `<input type="checkbox" class="row-checkbox" data-id="${ag.id}">`

        const actions = `
          <button class="btn-ver-mais" onclick="verMaisAgendamento(${ag.id})">
            <span class="material-icons">visibility</span>
          </button>
        `

        tabela.row.add([
          checkboxHtml,
          ag.data_consulta,
          ag.nome_paciente,
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
      window.pacientes = pacientes
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
      document.getElementById("valorConsulta").value = `R$ ${Number.parseFloat(valor).toFixed(2).replace(".", ",")}`
    } catch (err) {
      document.getElementById("valorConsulta").value = "R$ 0,00"
    }
  }

  function preencherDadosPaciente(nome) {
    if (nome && window.pacientes) {
      const paciente = window.pacientes.find((p) => p.nome_completo === nome)
      if (paciente) {
        document.getElementById("telefone").value = paciente.telefone || ""
        const convenioSelect = document.getElementById("convenio")
        let found = false
        for (let i = 0; i < convenioSelect.options.length; i++) {
          if (convenioSelect.options[i].value === paciente.convenio) {
            convenioSelect.selectedIndex = i
            found = true
            break
          }
        }
        if (!found && paciente.convenio) {
          const opt = document.createElement("option")
          opt.value = paciente.convenio
          opt.textContent = paciente.convenio
          opt.selected = true
          convenioSelect.appendChild(opt)
        }
        atualizarValorConvenio(paciente.convenio)
      }
    }
  }

  document.addEventListener("change", (e) => {
    if (e.target.id === "nomePaciente") {
      preencherDadosPaciente(e.target.value)
    }
  })

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

  window.verMaisAgendamento = (agendamentoId) => {
    const agendamento = todosOsAgendamentos.find((a) => a.id === agendamentoId)
    if (!agendamento) {
      alert("Agendamento não encontrado!")
      return
    }

    agendamentoAtual = agendamento
    mostrarDetalhes(agendamento)
  }

  function mostrarDetalhes(ag) {
    document.getElementById("detalheData").textContent = ag.data_consulta || "-"
    document.getElementById("detalheNome").textContent = ag.nome_paciente || "-"
    document.getElementById("detalheTelefone").textContent = ag.telefone || "-"
    document.getElementById("detalheInicio").textContent = ag.inicio || "-"
    document.getElementById("detalheFim").textContent = ag.fim || "-"
    document.getElementById("detalheConvenio").textContent = ag.convenio || "-"
    document.getElementById("detalheConsulta").textContent = ag.consulta || "-"
    const detalheModalidadeSpan = document.getElementById("detalheModalidade")
    detalheModalidadeSpan.textContent = ag.modalidade || "Presencial"
    if (ag.modalidade === "Online") {
      detalheModalidadeSpan.style.color = "#ff9800"
    } else {
      detalheModalidadeSpan.style.color = ""
    }
    document.getElementById("detalheFrequencia").textContent = ag.frequencia || "-"
    document.getElementById("detalheObservacoes").textContent = ag.observacoes || "Nenhuma observação."

    const valorFormatado = ag.valor ? `R$ ${Number.parseFloat(ag.valor).toFixed(2).replace(".", ",")}` : "R$ 0,00"
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

    preencherDadosPaciente(agendamentoAtual.nome_paciente)
    document.getElementById("telefone").value = agendamentoAtual.telefone || ""

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
    const modalidadeSelect = document.getElementById("modalidade")
    let modalidadeFound = false
    for (let i = 0; i < modalidadeSelect.options.length; i++) {
      if (modalidadeSelect.options[i].value === agendamentoAtual.modalidade) {
        modalidadeSelect.selectedIndex = i
        modalidadeFound = true
        break
      }
    }
    if (!modalidadeFound) {
      modalidadeSelect.value = "Presencial"
    }
    document.getElementById("frequencia").value = agendamentoAtual.frequencia || ""
    document.getElementById("observacoes").value = agendamentoAtual.observacoes || ""

    const valorFormatado = agendamentoAtual.valor
      ? `R$ ${Number.parseFloat(agendamentoAtual.valor).toFixed(2).replace(".", ",")}`
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
    const valorInput = formData.get("valorConsulta") || ""
    let valorConsulta = null
    const clean = valorInput.replace(/[^\d,]/g, "")
    if (clean) {
      const withDot = clean.replace(",", ".")
      const num = Number.parseFloat(withDot)
      if (!isNaN(num)) {
        valorConsulta = num
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
      valor: valorConsulta,
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
  const socket = window.io()
  socket.on("agendamento-updated", () => {
    carregarAgendamentos()
  })
})

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar")
  const menuIcon = document.querySelector(".menu-icon")
  const userToggle = document.getElementById("userToggle")
  const userMenu = document.getElementById("userMenu")

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

  const btnAdicionar = document.getElementById("btnAdicionar")
  const modal = document.getElementById("modalPaciente")
  const closeModal = document.getElementById("closeModal")
  const btnCancelar = document.getElementById("btnCancelar")
  const formPaciente = document.getElementById("formPaciente")
  const nomeCompletoInput = document.getElementById("nomeCompleto")
  const responsavelInput = document.getElementById("responsavel")
  const cepInput = document.getElementById("cep")
  const numeroInput = document.getElementById("numero")
  const convenioSelect = document.getElementById("convenio")

  const modalDetalhes = document.getElementById("modalDetalhes")
  const closeModalDetalhes = document.getElementById("closeModalDetalhes")
  const btnFecharDetalhes = document.getElementById("btnFecharDetalhes")
  const btnEditarPaciente = document.getElementById("btnEditarPaciente")
  const btnExcluirPaciente = document.getElementById("btnExcluirPaciente")
  let pacienteAtual = null

  // Função para mapear gênero do frontend para o backend
  function mapearGenero(genero) {
    const mapa = {
      "Masculino": "M",
      "Feminino": "F",
      "Outro": "O",
      "Prefiro não dizer": "N"
    }
    return mapa[genero] || null
  }

  // Função para mapear gênero do backend para o <select>
  function mapearGeneroParaSelect(generoBackend) {
    const mapa = {
      "M": "Masculino",
      "F": "Feminino",
      "O": "Outro",
      "N": "Prefiro não dizer"
    }
    return mapa[generoBackend] || ""
  }

  // === FORMATAÇÃO EM TEMPO REAL DO TELEFONE ===
  function formatarTelefoneEmTempoReal(input) {
    let value = input.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)

    let formatado = ''

    if (value.length >= 11) {
      formatado = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`
    } else if (value.length >= 10) {
      formatado = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6, 10)}`
    } else if (value.length >= 7) {
      formatado = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`
    } else if (value.length >= 2) {
      formatado = `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else {
      formatado = value
    }

    input.value = formatado
  }

  // === SALVAR TELEFONE FORMATADO NO BANCO ===
  function formatarTelefoneParaBanco(telefone) {
    const numeros = telefone.replace(/\D/g, "")
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
    } else if (numeros.length === 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
    }
    return telefone
  }

  async function carregarConvenios() {
    try {
      const response = await fetch("/api/convenios")
      const convenios = await response.json()

      convenioSelect.innerHTML = '<option value="">Selecione</option>'

      convenios.forEach((convenio) => {
        const option = document.createElement("option")
        option.value = convenio.nome_convenio
        option.textContent = convenio.nome_convenio
        convenioSelect.appendChild(option)
      })
    } catch (error) {
      console.error("Erro ao carregar convênios:", error)
      alert("Erro ao carregar lista de convênios.")
    }
  }

  async function carregarConveniosFiltro() {
    try {
      const response = await fetch("/api/convenios")
      const convenios = await response.json()

      const filterConvenioSelect = document.getElementById("filterConvenio")
      filterConvenioSelect.innerHTML = '<option value="">Todos</option>'

      convenios.forEach((convenio) => {
        const option = document.createElement("option")
        option.value = convenio.nome_convenio
        option.textContent = convenio.nome_convenio
        filterConvenioSelect.appendChild(option)
      })
    } catch (error) {
      console.error("Erro ao carregar convênios para filtro:", error)
    }
  }

  btnAdicionar.addEventListener("click", () => {
    modal.classList.add("show")
    document.body.style.overflow = "hidden"
    formPaciente.reset()
    delete formPaciente.dataset.editMode
    delete formPaciente.dataset.pacienteId
    carregarConvenios()
  })

  closeModal.addEventListener("click", () => {
    modal.classList.remove("show")
    document.body.style.overflow = "auto"
    formPaciente.reset()
    delete formPaciente.dataset.editMode
    delete formPaciente.dataset.pacienteId
  })

  btnCancelar.addEventListener("click", () => {
    modal.classList.remove("show")
    document.body.style.overflow = "auto"
    formPaciente.reset()
    delete formPaciente.dataset.editMode
    delete formPaciente.dataset.pacienteId
  })

  closeModalDetalhes.addEventListener("click", () => {
    modalDetalhes.classList.remove("show")
    document.body.style.overflow = "auto"
    pacienteAtual = null
  })

  btnFecharDetalhes.addEventListener("click", () => {
    modalDetalhes.classList.remove("show")
    document.body.style.overflow = "auto"
    pacienteAtual = null
  })

  btnEditarPaciente.addEventListener("click", () => {
    if (!pacienteAtual) return

    modalDetalhes.classList.remove("show")

    document.getElementById("nomeCompleto").value = pacienteAtual.nome_completo
    document.getElementById("genero").value = mapearGeneroParaSelect(pacienteAtual.genero)
    document.getElementById("responsavel").value = pacienteAtual.responsavel || ""
    document.getElementById("telefone").value = formatarTelefoneParaBanco(pacienteAtual.telefone)
    document.getElementById("email").value = pacienteAtual.email

    let dataNascimento = pacienteAtual.data_nascimento
    if (dataNascimento.includes("T")) {
      dataNascimento = dataNascimento.split("T")[0]
    }
    document.getElementById("dataNascimento").value = dataNascimento

    document.getElementById("cpf").value = pacienteAtual.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    document.getElementById("cep").value = pacienteAtual.cep.replace(/(\d{5})(\d{3})/, "$1-$2")
    document.getElementById("logradouro").value = pacienteAtual.logradouro
    document.getElementById("numero").value = pacienteAtual.numero
    document.getElementById("bairro").value = pacienteAtual.bairro
    document.getElementById("cidade").value = pacienteAtual.cidade
    document.getElementById("estado").value = pacienteAtual.estado
    document.getElementById("situacao").value = pacienteAtual.situacao

    carregarConvenios().then(() => {
      document.getElementById("convenio").value = pacienteAtual.convenio
      modal.classList.add("show")
      document.body.style.overflow = "hidden"

      formPaciente.dataset.editMode = "true"
      formPaciente.dataset.pacienteId = pacienteAtual.id
    })
  })

  btnExcluirPaciente.addEventListener("click", async () => {
    if (!pacienteAtual) return;

    if (confirm("Tem certeza que deseja excluir este paciente?")) {
      try {
        const response = await fetch(`/api/pacientes/${pacienteAtual.id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          alert(result.message);
          modalDetalhes.classList.remove("show");
          document.body.style.overflow = "auto";
          pacienteAtual = null;
          await carregarPacientes();
        } else {
          alert("Erro: " + result.error);
        }
      } catch (error) {
        console.error("Erro ao excluir paciente:", error);
        alert("Erro ao conectar com o servidor.");
      }
    }
  });

  nomeCompletoInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase()
  })

  responsavelInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase()
  })

  cepInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 8) value = value.slice(0, 8)

    if (value.length > 5) {
      value = value.replace(/(\d{5})(\d{1,3})/, "$1-$2")
    }

    e.target.value = value

    if (value.replace(/\D/g, "").length === 8) {
      buscarEnderecoPorCep(value.replace(/\D/g, ""))
    }
  })

  numeroInput.addEventListener("input", (e) => {
    const value = e.target.value.replace(/\D/g, "")
    e.target.value = value
  })

  const telefoneInput = document.getElementById("telefone")
  telefoneInput.addEventListener("input", (e) => {
    formatarTelefoneEmTempoReal(e.target)
  })

  function calcularIdade(dataNasc) {
    let dataString = dataNasc
    if (dataNasc.includes("T")) {
      dataString = dataNasc.split("T")[0]
    }

    const [ano, mes, dia] = dataString.split("-").map(Number)
    const nascimento = new Date(ano, mes - 1, dia)
    const hoje = new Date()

    let anos = hoje.getFullYear() - nascimento.getFullYear()
    let meses = hoje.getMonth() - nascimento.getMonth()
    let dias = hoje.getDate() - nascimento.getDate()

    if (dias < 0) {
      meses--
      const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate()
      dias += ultimoDiaMesAnterior
    }

    if (meses < 0) {
      anos--
      meses += 12
    }

    return `${anos} anos, ${meses} meses, ${dias} dias`
  }

  function formatarDataBrasileira(dataNasc) {
    let dataString = dataNasc
    if (dataNasc.includes("T")) {
      dataString = dataNasc.split("T")[0]
    }

    const [ano, mes, dia] = dataString.split("-")
    return `${dia}/${mes}/${ano}`
  }

  formPaciente.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(formPaciente)
    const dados = Object.fromEntries(formData)

    if (!dados.genero || dados.genero === "") {
      alert("Por favor, selecione um gênero.")
      return
    }

    const isEditMode = formPaciente.dataset.editMode === "true"
    const pacienteId = formPaciente.dataset.pacienteId

    try {
      const url = isEditMode ? `/api/pacientes/${pacienteId}` : "/api/pacientes"
      const method = isEditMode ? "PUT" : "POST"

      const telefoneFormatado = formatarTelefoneParaBanco(dados.telefone)

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeCompleto: dados.nomeCompleto.toUpperCase(),
          responsavel: dados.responsavel ? dados.responsavel.toUpperCase() : null,
          telefone: telefoneFormatado,
          email: dados.email,
          dataNascimento: dados.dataNascimento,
          cpf: dados.cpf.replace(/\D/g, ""),
          convenio: dados.convenio,
          situacao: dados.situacao,
          cep: dados.cep.replace(/\D/g, ""),
          logradouro: dados.logradouro,
          numero: dados.numero,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado,
          genero: mapearGenero(dados.genero),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        await carregarPacientes()

        modal.classList.remove("show")
        document.body.style.overflow = "auto"
        formPaciente.reset()

        delete formPaciente.dataset.editMode
        delete formPaciente.dataset.pacienteId
        pacienteAtual = null
      } else {
        alert("Erro: " + result.error)
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error)
      alert("Erro ao conectar com o servidor.")
    }
  })

  const cpfInput = document.getElementById("cpf")
  cpfInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 11) value = value.slice(0, 11)

    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3")
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2")
    }

    e.target.value = value
  })

  async function buscarEnderecoPorCep(cep) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        document.getElementById("logradouro").value = data.logradouro || ""
        document.getElementById("bairro").value = data.bairro || ""
        document.getElementById("cidade").value = data.localidade || ""
        document.getElementById("estado").value = data.uf || ""
      } else {
        alert("CEP não encontrado!")
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    }
  }

  const btnFiltrar = document.getElementById("btnFiltrar")
  const filterPanel = document.getElementById("filterPanel")
  const closeFilter = document.getElementById("closeFilter")
  const btnLimparFiltros = document.getElementById("btnLimparFiltros")
  const btnAplicarFiltros = document.getElementById("btnAplicarFiltros")

  btnFiltrar.addEventListener("click", () => {
    btnFiltrar.classList.toggle("active")
    filterPanel.classList.toggle("show")
    if (filterPanel.classList.contains("show")) {
      carregarConveniosFiltro()
    }
  })

  closeFilter.addEventListener("click", () => {
    filterPanel.classList.remove("show")
    btnFiltrar.classList.remove("active")
  })

  btnLimparFiltros.addEventListener("click", () => {
    document.getElementById("filterNome").value = ""
    document.getElementById("filterConvenio").value = ""
    document.getElementById("filterSituacao").value = ""

    const tabela = window.$("#relatorio-pacientes").DataTable()
    tabela.search("").columns().search("").draw()
  })

  btnAplicarFiltros.addEventListener("click", () => {
    const filterNome = document.getElementById("filterNome").value.toUpperCase()
    const filterConvenio = document.getElementById("filterConvenio").value
    const filterSituacao = document.getElementById("filterSituacao").value

    const tabela = window.$("#relatorio-pacientes").DataTable()

    window.$.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
      const nome = data[0] || ""
      const convenio = data[3] || ""
      const situacao = data[4] || ""

      const nomeMatch = !filterNome || nome.toUpperCase().includes(filterNome)
      const convenioMatch = !filterConvenio || convenio === filterConvenio
      const situacaoMatch = !filterSituacao || situacao === filterSituacao

      return nomeMatch && convenioMatch && situacaoMatch
    })

    tabela.draw()

    window.$.fn.dataTable.ext.search.pop()

    filterPanel.classList.remove("show")
    btnFiltrar.classList.remove("active")
  })

  const btnSelecionar = document.getElementById("btnSelecionar")
  let selectMode = false
  btnSelecionar.addEventListener("click", () => {
    selectMode = !selectMode
    btnSelecionar.classList.toggle("active")
    const icon = btnSelecionar.querySelector(".material-icons")
    icon.textContent = selectMode ? "check_box" : "check_box_outline_blank"

    if (selectMode) {
      alert("Modo de seleção ativado. Funcionalidade será implementada.")
    } else {
      alert("Modo de seleção desativado.")
    }
  })

  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      if (window.jQuery && window.$ && window.$.fn.dataTable) {
        const tabela = window.$("#relatorio-pacientes").DataTable()
        tabela.search(this.value).draw()
      }
    })
  }

  if (window.jQuery && window.$ && window.$.fn.dataTable) {
    const tabela = window.$("#relatorio-pacientes").DataTable({
      colReorder: true,
      paging: true,
      searching: true,
      info: true,
      language: {
        emptyTable: "Nenhum paciente encontrado",
        loadingRecords: "Carregando...",
        processing: "Processando...",
        zeroRecords: "Nenhum registro encontrado",
        info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
        infoEmpty: "Mostrando 0 a 0 de 0 registros",
        infoFiltered: "(filtrado de _MAX_ registros no total)",
        paginate: {
          first: "Primeiro",
          last: "Último",
          next: "Próximo",
          previous: "Anterior",
        },
      },
      createdRow: (row, data, dataIndex) => {
        window
          .$(row)
          .find("td")
          .each(function (index) {
            const labels = ["PACIENTE", "IDADE", "CPF", "CONVÊNIO", "SITUAÇÃO", "AÇÕES"]
            window.$(this).attr("data-label", labels[index])
          })
      },
    })
  } else {
    console.warn("jQuery ou DataTables não carregados corretamente.")
  }

  window.verMaisPaciente = async (pacienteId) => {
    const paciente = window.todosOsPacientes.find((p) => p.id === pacienteId)
    if (!paciente) {
      alert("Paciente não encontrado!")
      return
    }

    pacienteAtual = paciente

    document.getElementById("detalheNome").textContent = paciente.nome_completo
    document.getElementById("detalheGenero").textContent = mapearGeneroParaSelect(paciente.genero) || "Não informado"
    document.getElementById("detalheResponsavel").textContent = paciente.responsavel || "Não informado"
    document.getElementById("detalheTelefone").textContent = formatarTelefoneParaBanco(paciente.telefone)
    document.getElementById("detalheEmail").textContent = paciente.email

    document.getElementById("detalheDataNascimento").textContent = formatarDataBrasileira(paciente.data_nascimento)
    document.getElementById("detalheIdade").textContent = calcularIdade(paciente.data_nascimento)

    document.getElementById("detalheCpf").textContent = paciente.cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4",
    )
    document.getElementById("detalheConvenio").textContent = paciente.convenio
    document.getElementById("detalheSituacao").textContent = paciente.situacao

    document.getElementById("detalheCep").textContent = paciente.cep.replace(/(\d{5})(\d{3})/, "$1-$2")
    document.getElementById("detalheLogradouro").textContent = paciente.logradouro
    document.getElementById("detalheNumero").textContent = paciente.numero
    document.getElementById("detalheBairro").textContent = paciente.bairro
    document.getElementById("detalheCidade").textContent = paciente.cidade
    document.getElementById("detalheEstado").textContent = paciente.estado

    modalDetalhes.classList.add("show")
    document.body.style.overflow = "hidden"
  }

  window.todosOsPacientes = []

  async function carregarPacientes() {
    try {
      const response = await fetch("/api/pacientes")
      const pacientes = await response.json()

      window.todosOsPacientes = pacientes

      const tabela = window.$("#relatorio-pacientes").DataTable()
      tabela.clear()

      pacientes.forEach((p) => {
        const statusHtml = p.situacao === 'Ativo'
          ? '<span style="color:#2e7d32; font-weight:bold;">Ativo</span>'
          : '<span style="color:#c62828; font-weight:bold;">Inativo</span>';

        tabela.row.add([
          p.nome_completo.toUpperCase(),
          calcularIdade(p.data_nascimento),
          p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
          p.convenio,
          statusHtml,
          `<button class="btn-ver-mais" onclick="verMaisPaciente(${p.id})" title="Ver Mais">
            <span class="material-icons">visibility</span>
          </button>`,
        ])
      })

      tabela.draw()
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error)
    }
  }

  carregarPacientes()
})
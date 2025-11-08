document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar")
  const menuIcon = document.querySelector(".menu-icon")
  const userToggle = document.getElementById("userToggle")
  const userMenu = document.getElementById("userMenu")

  // Função para aplicar o estado inicial da sidebar
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

  // Toggle sidebar
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

  // Fecha sidebar ao clicar em item (mobile)
  sidebar.querySelectorAll("nav ul li a").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768 && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active")
        document.body.classList.remove("no-scroll")
      }
    })
  })

  // Fecha sidebar ao clicar fora (mobile)
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

  // Gerencia sidebar ao redimensionar
  window.addEventListener("resize", initializeSidebarState)

  // User dropdown
  userToggle.addEventListener("click", (e) => {
    e.stopPropagation()
    userMenu.style.display = userMenu.style.display === "flex" ? "none" : "flex"
  })

  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target) && e.target !== userToggle) {
      userMenu.style.display = "none"
    }
  })

  // Logout
  window.logout = () => {
    alert("Você saiu com sucesso!")
    // window.location.href = "login.html";
  }

  // Modal e Formulário
  const modal = document.getElementById("modalConvenio")
  const btnAdicionar = document.getElementById("btnAdicionar")
  const closeModal = document.getElementById("closeModal")
  const btnCancelar = document.getElementById("btnCancelar")
  const formConvenio = document.getElementById("formConvenio")
  const inputDuracao = document.getElementById("duracao")
  const inputValor = document.getElementById("valor")
  const inputNomeConvenio = document.getElementById("nomeConvenio")

  btnAdicionar.addEventListener("click", () => {
    modal.classList.add("active")
    document.body.style.overflow = "hidden"
    formConvenio.reset()
    // Restaurar comportamento padrão do formulário para cadastro
    formConvenio.onsubmit = submitCadastro
  })

  function fecharModal() {
    modal.classList.remove("active")
    document.body.style.overflow = ""
    formConvenio.reset()
    formConvenio.onsubmit = submitCadastro // Resetar para cadastro ao fechar
  }

  closeModal.addEventListener("click", fecharModal)
  btnCancelar.addEventListener("click", fecharModal)

  // Forçar letras maiúsculas no campo nomeConvenio
  inputNomeConvenio.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase()
  })

  // Máscara para duração (hh:mm)
  inputDuracao.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 4) value = value.slice(0, 4)
    if (value.length >= 2) {
      value = value.substring(0, 2) + ":" + value.substring(2, 4)
    }
    e.target.value = value
  })

  // Máscara para valor (R$ 0,00)
  inputValor.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length === 0) value = "0"
    value = (Number.parseInt(value) / 100).toFixed(2).replace(".", ",")
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")
    e.target.value = `R$ ${value}`
  })

  // Função para cadastro de convênio
  async function submitCadastro(e) {
    e.preventDefault()

    const formData = new FormData(formConvenio)
    const dados = Object.fromEntries(formData)

    try {
      const response = await fetch("/api/convenios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeConvenio: dados.nomeConvenio.toUpperCase(), // Garantir maiúsculas
          consulta: dados.consulta,
          duracao: dados.duracao,
          valor: dados.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
          pagamento: Number.parseInt(dados.pagamento, 10),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        await carregarConvenios()
        fecharModal()
      } else {
        alert("Erro: " + result.error)
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error)
      alert("Erro ao conectar com o servidor.")
    }
  }

  // === Botão Filtrar ===
  const btnFiltrar = document.getElementById("btnFiltrar")
  const filterPanel = document.getElementById("filterPanel")
  const closeFilter = document.getElementById("closeFilter")
  const btnLimparFiltros = document.getElementById("btnLimparFiltros")
  const btnAplicarFiltros = document.getElementById("btnAplicarFiltros")
  const filterNome = document.getElementById("filterNome")
  const filterStatus = document.getElementById("filterStatus")
  const filterTipo = document.getElementById("filterTipo")

  btnFiltrar.addEventListener("click", () => {
    btnFiltrar.classList.toggle("active")
    filterPanel.classList.toggle("show")
  })

  closeFilter.addEventListener("click", () => {
    filterPanel.classList.remove("show")
    btnFiltrar.classList.remove("active")
  })

  btnLimparFiltros.addEventListener("click", () => {
    filterNome.value = ""
    filterStatus.value = ""
    filterTipo.value = ""

    const tabela = window.jQuery("#conveniosTable").DataTable()
    tabela.search("").columns().search("").draw()
  })

  btnAplicarFiltros.addEventListener("click", () => {
    const nomeFilter = filterNome.value.toUpperCase()
    const statusFilter = filterStatus.value
    const tipoFilter = filterTipo.value

    const tabela = window.jQuery("#conveniosTable").DataTable()

    window.jQuery.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
      const nome = data[0] || "" // Coluna "NOME DO CONVÊNIO"
      const status = data[1] || "" // Coluna "STATUS" (assumindo que será adicionada)
      const tipo = data[2] || "" // Coluna "TIPO" (assumindo que será adicionada)

      const nomeMatch = !nomeFilter || nome.toUpperCase().includes(nomeFilter)
      const statusMatch = !statusFilter || status === statusFilter
      const tipoMatch = !tipoFilter || tipo === tipoFilter

      return nomeMatch && statusMatch && tipoMatch
    })

    tabela.draw()

    window.jQuery.fn.dataTable.ext.search.pop()

    filterPanel.classList.remove("show")
    btnFiltrar.classList.remove("active")
  })

  // Botão Selecionar
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

  // Pesquisa no cabeçalho
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      if (window.jQuery && window.$ && window.$.fn.dataTable) {
        const tabela = window.$("#conveniosTable").DataTable()
        tabela.search(this.value).draw()
      }
    })
  }

  // === NOVO: Modal de Detalhes e Variáveis Globais ===
  const modalDetalhes = document.getElementById("modalDetalhes")
  const closeDetalhes = document.getElementById("closeModalDetalhes")
  const btnFecharDetalhes = document.getElementById("btnFecharDetalhes")
  const btnEditarConvenio = document.getElementById("btnEditarConvenio")
  const btnExcluirConvenio = document.getElementById("btnExcluirConvenio")
  let convenioAtual = null
  let todosOsConvenios = []

  closeDetalhes.addEventListener("click", () => {
    modalDetalhes.classList.remove("active")
    document.body.style.overflow = ""
    convenioAtual = null
  })

  btnFecharDetalhes.addEventListener("click", () => {
    modalDetalhes.classList.remove("active")
    document.body.style.overflow = ""
    convenioAtual = null
  })

  btnEditarConvenio.addEventListener("click", () => {
    if (!convenioAtual) return

    modalDetalhes.classList.remove("active")
    document.body.style.overflow = ""

    // Preencher o formulário com os dados do convênio
    document.getElementById("nomeConvenio").value = convenioAtual.nome_convenio.toUpperCase()
    document.getElementById("consulta").value = convenioAtual.consulta
    document.getElementById("duracao").value = convenioAtual.duracao
    document.getElementById("valor").value = `R$ ${Number.parseFloat(convenioAtual.valor).toFixed(2).replace(".", ",")}`
    document.getElementById("pagamento").value = convenioAtual.pagamento

    modal.classList.add("active")
    document.body.style.overflow = "hidden"

    formConvenio.onsubmit = async (e) => {
      e.preventDefault()
      const formData = new FormData(formConvenio)
      const dados = Object.fromEntries(formData)

      try {
        const response = await fetch(`/api/convenios/${convenioAtual.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nomeConvenio: dados.nomeConvenio.toUpperCase(),
            consulta: dados.consulta,
            duracao: dados.duracao,
            valor: dados.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
            pagamento: Number.parseInt(dados.pagamento, 10),
          }),
        })

        const result = await response.json()
        if (result.success) {
          alert(result.message)
          carregarConvenios()
          fecharModal()
        } else {
          alert("Erro: " + result.error)
        }
      } catch (error) {
        console.error("Erro ao editar convênio:", error)
        alert("Erro ao conectar com o servidor.")
      }
    }
  })

  btnExcluirConvenio.addEventListener("click", async () => {
    if (!convenioAtual) return

    if (confirm("Tem certeza que deseja excluir este convênio?")) {
      try {
        const response = await fetch(`/api/convenios/${convenioAtual.id}`, {
          method: "DELETE",
        })

        const result = await response.json()

        if (result.success) {
          alert(result.message)
          modalDetalhes.classList.remove("active")
          document.body.style.overflow = ""
          convenioAtual = null
          await carregarConvenios()
        } else {
          alert("Erro: " + result.error)
        }
      } catch (error) {
        console.error("Erro ao excluir convênio:", error)
        alert("Erro ao conectar com o servidor.")
      }
    }
  })

  // Função para carregar convênios
  async function carregarConvenios() {
    try {
      const response = await fetch("/api/convenios")
      const convenios = await response.json()

      todosOsConvenios = convenios

      const tabela = window.jQuery("#conveniosTable").DataTable()
      tabela.clear()
      convenios.forEach((c) => {
        tabela.row.add([
          c.nome_convenio.toUpperCase(),
          c.consulta,
          c.duracao,
          `R$ ${Number.parseFloat(c.valor).toFixed(2).replace(".", ",")}`,
          c.pagamento,
          `<button class="btn-ver-mais" onclick="verMaisConvenio(${c.id})" title="Ver Mais">
            <span class="material-icons">visibility</span>
          </button>`,
        ])
      })
      tabela.draw()
    } catch (error) {
      console.error("Erro ao carregar convênios:", error)
      alert("Erro ao carregar dados do servidor.")
    }
  }

  window.verMaisConvenio = (convenioId) => {
    const convenio = todosOsConvenios.find((c) => c.id === convenioId)
    if (!convenio) {
      alert("Convênio não encontrado!")
      return
    }

    convenioAtual = convenio

    // Preencher os dados no modal de detalhes
    document.getElementById("detalheNome").textContent = convenio.nome_convenio
    document.getElementById("detalheConsulta").textContent = convenio.consulta
    document.getElementById("detalheDuracao").textContent = convenio.duracao
    document.getElementById("detalheValor").textContent =
      `R$ ${Number.parseFloat(convenio.valor).toFixed(2).replace(".", ",")}`
    document.getElementById("detalhePagamento").textContent = convenio.pagamento

    modalDetalhes.classList.add("active")
    document.body.style.overflow = "hidden"
  }

  // Inicializa DataTable
  if (window.jQuery && window.$ && window.$.fn.dataTable) {
    const tabela = window.$("#conveniosTable").DataTable({
      colReorder: true,
      paging: true,
      searching: true,
      info: true,
      language: {
        emptyTable: "Nenhum convênio encontrado",
        loadingRecords: "Carregando...",
        processing: "Processando...",
        zeroRecords: "Nenhum registro encontrado",
        search: "Pesquisar:",
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
            const labels = ["NOME DO CONVÊNIO", "CONSULTA", "DURAÇÃO", "VALOR", "PAGAMENTO (DIAS)", "AÇÕES"]
            window.$(this).attr("data-label", labels[index])
          })
      },
    })

    // Carrega convênios ao inicializar
    carregarConvenios()
  } else {
    console.warn("jQuery ou DataTables não carregados corretamente.")
  }

  // Edit convênio function (MANTÉM A COMPATIBILIDADE ANTERIOR)
  window.editConvenio = async (id, icon) => {
    try {
      const response = await fetch(`/api/convenios`)
      const convenios = await response.json()
      const convenio = convenios.find((c) => c.id === id)

      if (convenio) {
        document.getElementById("nomeConvenio").value = convenio.nome_convenio.toUpperCase()
        document.getElementById("consulta").value = convenio.consulta
        document.getElementById("duracao").value = convenio.duracao
        document.getElementById("valor").value = `R$ ${Number.parseFloat(convenio.valor).toFixed(2).replace(".", ",")}`
        document.getElementById("pagamento").value = convenio.pagamento

        modal.classList.add("active")
        document.body.style.overflow = "hidden"

        formConvenio.onsubmit = async (e) => {
          e.preventDefault()
          const formData = new FormData(formConvenio)
          const dados = Object.fromEntries(formData)

          try {
            const response = await fetch(`/api/convenios/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                nomeConvenio: dados.nomeConvenio.toUpperCase(),
                consulta: dados.consulta,
                duracao: dados.duracao,
                valor: dados.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
                pagamento: Number.parseInt(dados.pagamento, 10),
              }),
            })

            const result = await response.json()
            if (result.success) {
              alert(result.message)
              carregarConvenios()
              fecharModal()
            } else {
              alert("Erro: " + result.error)
            }
          } catch (error) {
            console.error("Erro ao editar convênio:", error)
            alert("Erro ao conectar com o servidor.")
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do convênio:", error)
      alert("Erro ao carregar dados do convênio.")
    }
  }
})

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar")
  const menuIcon = document.querySelector(".menu-icon")
  const userToggle = document.getElementById("userToggle")
  const userMenu = document.getElementById("userMenu")
  const editBtn = document.getElementById("edit-btn")
  const clinicaSpan = document.getElementById("clinica-percent")
  const impostoSpan = document.getElementById("imposto-percent")
  const totalValueSpan = document.getElementById("total-value")
  const totalComDescontoSpan = document.getElementById("total-com-desconto-value")
  const receberValueSpan = document.getElementById("receber-value")
  const startDateInput = document.getElementById("start-date")
  const endDateInput = document.getElementById("end-date")
  let isEditing = false
  const currentCharts = {}

  // Socket.io
  const io = window.io
  const socket = io()
  socket.on("agendamento-updated", () => {
    console.log("[v0] Agendamento atualizado - recarregando financeiro")
    carregarDadosFinanceiros()
  })

  /* ---------- UTILIDADES ---------- */
  function parseMoney(str) {
    return Number.parseFloat(str.replace(/[^\d,]/g, "").replace(",", "."))
  }

  function formatMoney(num) {
    return "R$ " + num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  /**
   * Atualiza:
   *   Total c/ Desc. = Total s/ Desc. – (Total s/ Desc. × % CLÍNICA)
   *   Receber        = Total c/ Desc. – (Total c/ Desc. × % IMPOSTOS)
   */
  function atualizarTotalComDesconto() {
    const totalSemDesc = parseMoney(totalValueSpan.textContent)

    // % CLÍNICA
    let percClinica = 0
    const clinicaInput = document.querySelector("#clinica-item input")
    if (clinicaInput) {
      percClinica = Number.parseFloat(clinicaInput.value) || 0
    } else {
      const text = clinicaSpan.textContent.replace("%", "").trim()
      percClinica = Number.parseFloat(text) || 0
    }

    const descontoClinica = totalSemDesc * (percClinica / 100)
    const totalComDesc = totalSemDesc - descontoClinica
    totalComDescontoSpan.textContent = formatMoney(totalComDesc)

    // % IMPOSTOS
    let percImposto = 0
    const impostoInput = document.querySelector("#imposto-item input")
    if (impostoInput) {
      percImposto = Number.parseFloat(impostoInput.value) || 0
    } else {
      const text = impostoSpan.textContent.replace("%", "").trim()
      percImposto = Number.parseFloat(text) || 0
    }

    const imposto = totalComDesc * (percImposto / 100)
    const aReceber = totalComDesc - imposto
    receberValueSpan.textContent = formatMoney(aReceber)
  }

  /* ---------- CARREGAR PORCENTAGENS SALVAS ---------- */
  async function carregarPorcentagens() {
    try {
      const response = await fetch("/api/financeiro/porcentagens")
      if (!response.ok) throw new Error("Erro ao carregar porcentagens")
      const { clinica, imposto } = await response.json()

      clinicaSpan.textContent = `% ${Number(clinica).toFixed(2)}`
      impostoSpan.textContent = `% ${Number(imposto).toFixed(2)}`

      atualizarTotalComDesconto()
    } catch (error) {
      console.warn("[v0] Usando valores padrão (45% / 6%)", error)
      clinicaSpan.textContent = "% 45.00"
      impostoSpan.textContent = "% 6.00"
      atualizarTotalComDesconto()
    }
  }

  /* ---------- SALVAR PORCENTAGENS ---------- */
  async function salvarPorcentagens(clinica, imposto) {
    try {
      const response = await fetch("/api/financeiro/porcentagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinica, imposto }),
      })
      if (!response.ok) throw new Error("Erro ao salvar porcentagens")
      alert("Porcentagens salvas com sucesso!")
    } catch (error) {
      console.error("[v0] Erro ao salvar:", error)
      alert("Erro ao salvar porcentagens. Tente novamente.")
    }
  }

  /* ---------- DEFINIR DATAS DO MÊS (FUSO HORÁRIO DE BRASÍLIA) ---------- */
  function definirDatasDoMes() {
    const agora = new Date()
    const opcoes = { timeZone: "America/Sao_Paulo" }

    const primeiroDia = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const primeiroDiaStr = primeiroDia.toLocaleDateString("en-CA", opcoes)

    const ultimoDia = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
    const ultimoDiaStr = ultimoDia.toLocaleDateString("en-CA", opcoes)

    startDateInput.value = primeiroDiaStr
    endDateInput.value = ultimoDiaStr

    console.log("[v0] Datas definidas (Brasília):", { inicio: primeiroDiaStr, fim: ultimoDiaStr })
  }

  function inicializarValores() {
    definirDatasDoMes()

    const agendadoSpan = document.querySelector(".summary-item:nth-child(3) span")
    const atendidoSpan = document.querySelector(".summary-item:nth-child(4) span")
    const naoDesmarcadoSpan = document.querySelector(".summary-item:nth-child(5) span")

    agendadoSpan.textContent = formatMoney(0)
    agendadoSpan.style.color = "#22c55e"
    atendidoSpan.textContent = formatMoney(0)
    atendidoSpan.style.color = "#3b82f6"
    naoDesmarcadoSpan.textContent = formatMoney(0)
    naoDesmarcadoSpan.style.color = "#a855f7"
    totalValueSpan.textContent = formatMoney(0)

    totalComDescontoSpan.textContent = formatMoney(0)
    receberValueSpan.textContent = formatMoney(0)

    carregarPorcentagens()
  }

  /* ---------- CARREGAMENTO DE DADOS ---------- */
  async function carregarDadosFinanceiros() {
    try {
      const startDate = startDateInput.value
      const endDate = endDateInput.value

      console.log("[v0] Carregando dados financeiros:", { startDate, endDate })

      const response = await fetch(`/api/financeiro/resumo?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()

      if (!data || !data.resumo) {
        console.error("[v0] Erro: dados de resumo não encontrados")
        return
      }

      const agendadoSpan = document.querySelector(".summary-item:nth-child(3) span")
      const atendidoSpan = document.querySelector(".summary-item:nth-child(4) span")
      const naoDesmarcadoSpan = document.querySelector(".summary-item:nth-child(5) span")

      const agendadoValor = data.resumo.agendado || 0
      const atendidoValor = data.resumo.atendido || 0
      const naoDesmarcadoValor = data.resumo.naoDesmarcado || 0

      agendadoSpan.textContent = formatMoney(agendadoValor)
      agendadoSpan.style.color = "#22c55e"

      atendidoSpan.textContent = formatMoney(atendidoValor)
      atendidoSpan.style.color = "#3b82f6"

      naoDesmarcadoSpan.textContent = formatMoney(naoDesmarcadoValor)
      naoDesmarcadoSpan.style.color = "#a855f7"

      const totalSemDesconto = atendidoValor + naoDesmarcadoValor
      totalValueSpan.textContent = formatMoney(totalSemDesconto)

      atualizarTotalComDesconto()

      if (data.agendamentos && data.agendamentos.length > 0) {
        atualizarGraficosComDados(data.agendamentos)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar dados financeiros:", error)
      const agendadoSpan = document.querySelector(".summary-item:nth-child(3) span")
      const atendidoSpan = document.querySelector(".summary-item:nth-child(4) span")
      const naoDesmarcadoSpan = document.querySelector(".summary-item:nth-child(5) span")
      agendadoSpan.textContent = formatMoney(0)
      atendidoSpan.textContent = formatMoney(0)
      naoDesmarcadoSpan.textContent = formatMoney(0)
      totalValueSpan.textContent = formatMoney(0)
      atualizarTotalComDesconto()
    }
  }

  /* ---------- PREPARAÇÃO DE GRÁFICOS ---------- */
  function atualizarGraficosComDados(agendamentos) {
    const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
    const dataAtual = new Date(hoje)

    const diaAgendamentos = agendamentos.filter(
      (a) => new Date(a.data_consulta).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) === hoje,
    )

    const inicioSemana = new Date(dataAtual)
    inicioSemana.setDate(dataAtual.getDate() - dataAtual.getDay())
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(inicioSemana.getDate() + 6)
    const semanaAgendamentos = agendamentos.filter((a) => {
      const d = new Date(a.data_consulta)
      return d >= inicioSemana && d <= fimSemana
    })

    const inicioMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)
    const fimMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0)
    const mesAgendamentos = agendamentos.filter((a) => {
      const d = new Date(a.data_consulta)
      return d >= inicioMes && d <= fimMes
    })

    const chartData = {
      day: prepararDadosGraficos(diaAgendamentos, "dia"),
      week: prepararDadosGraficos(semanaAgendamentos, "semana"),
      month: prepararDadosGraficos(mesAgendamentos, "mes"),
    }

    updateAllCharts("day", chartData)
    window.currentChartData = chartData
  }

  function prepararDadosGraficos(agendamentos, periodo) {
    const statusCounts = { agendado: 0, atendido: 0, nao_desmarcado: 0 }
    const statusValues = { agendado: 0, atendido: 0, nao_desmarcado: 0 }
    const convenioCounts = {}
    const convenioValues = {}
    const trendData = {}

    agendamentos.forEach((a) => {
      const valor = Number.parseFloat(a.valor) || 0
      const status = a.status || "agendado"

      if (statusCounts[status] !== undefined) {
        statusCounts[status]++
        statusValues[status] += valor
      }

      if (!convenioCounts[a.convenio]) {
        convenioCounts[a.convenio] = 0
        convenioValues[a.convenio] = 0
      }
      convenioCounts[a.convenio]++
      convenioValues[a.convenio] += valor

      const data = new Date(a.data_consulta).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
      if (!trendData[data]) trendData[data] = 0
      trendData[data] += valor
    })

    const labels = Object.keys(trendData).sort()
    const revenueData = labels.map((l) => trendData[l])

    return {
      revenue: revenueData.length > 0 ? revenueData : [0],
      labels: labels.length > 0 ? labels : ["Sem dados"],
      status: [statusValues.agendado, statusValues.atendido, statusValues.nao_desmarcado],
      statusLabels: ["Agendado (Verde)", "Atendido (Azul)", "Não Desmarcado (Lilás)"],
      statusCounts: [statusCounts.agendado, statusCounts.atendido, statusCounts.nao_desmarcado],
      convenio: Object.values(convenioValues),
      convenioLabels: Object.keys(convenioValues),
      trend: revenueData,
    }
  }

  /* ---------- SIDEBAR - 100% IGUAL À SERVIÇOS.HTML ---------- */
  function initializeSidebarState() {
    if (window.innerWidth >= 768) {
      // Desktop: colapsada (ícones apenas), mas visível
      sidebar.classList.add("collapsed")
      sidebar.classList.remove("active")
      document.body.classList.remove("no-scroll")
    } else {
      // Mobile: começa TOTALMENTE OCULTA
      sidebar.classList.remove("collapsed")
      sidebar.classList.remove("active")
      document.body.classList.remove("no-scroll")
    }
  }

  // Inicializa ao carregar
  initializeSidebarState()

  // Toggle do menu
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

  // Fecha ao clicar em link (mobile)
  sidebar.querySelectorAll("nav ul li a").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768 && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active")
        document.body.classList.remove("no-scroll")
      }
    })
  })

  // Fecha ao clicar fora (mobile)
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

  // Reaplica estado ao redimensionar
  window.addEventListener("resize", initializeSidebarState)

  /* ---------- USER MENU ---------- */
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

  /* ---------- EDIÇÃO DE % ---------- */
  editBtn.addEventListener("click", async () => {
    if (!isEditing) {
      const currentClinica = Number.parseFloat(clinicaSpan.textContent.replace("%", "").trim()) || 0
      const currentImposto = Number.parseFloat(impostoSpan.textContent.replace("%", "").trim()) || 0

      const clinicaInput = document.createElement("input")
      clinicaInput.type = "number"
      clinicaInput.min = 0
      clinicaInput.max = 100
      clinicaInput.step = 0.01
      clinicaInput.value = currentClinica
      clinicaInput.className = "percent-input"

      const percentClinicaText = document.createTextNode("%")
      const clinicaItem = document.getElementById("clinica-item")
      clinicaItem.removeChild(clinicaSpan)
      clinicaItem.appendChild(clinicaInput)
      clinicaItem.appendChild(percentClinicaText)

      const impostoInput = document.createElement("input")
      impostoInput.type = "number"
      impostoInput.min = 0
      impostoInput.max = 100
      impostoInput.step = 0.01
      impostoInput.value = currentImposto
      impostoInput.className = "percent-input"

      const percentImpostoText = document.createTextNode("%")
      const impostoItem = document.getElementById("imposto-item")
      impostoItem.removeChild(impostoSpan)
      impostoItem.appendChild(impostoInput)
      impostoItem.appendChild(percentImpostoText)

      editBtn.textContent = "Salvar"
      editBtn.classList.remove("edit-btn")
      editBtn.classList.add("save-btn")
      isEditing = true

      clinicaInput.addEventListener("input", atualizarTotalComDesconto)
      impostoInput.addEventListener("input", atualizarTotalComDesconto)

      atualizarTotalComDesconto()
    } else {
      const clinicaInput = document.querySelector("#clinica-item input")
      const impostoInput = document.querySelector("#imposto-item input")

      const newClinica = Number.parseFloat(clinicaInput.value) || 0
      const newImposto = Number.parseFloat(impostoInput.value) || 0

      const newClinicaSpan = document.createElement("span")
      newClinicaSpan.id = "clinica-percent"
      newClinicaSpan.textContent = `% ${newClinica.toFixed(2)}`
      const clinicaItem = document.getElementById("clinica-item")
      const percentClinicaText = clinicaItem.lastChild
      clinicaItem.removeChild(clinicaInput)
      clinicaItem.removeChild(percentClinicaText)
      clinicaItem.appendChild(newClinicaSpan)

      const newImpostoSpan = document.createElement("span")
      newImpostoSpan.id = "imposto-percent"
      newImpostoSpan.textContent = `% ${newImposto.toFixed(2)}`
      const impostoItem = document.getElementById("imposto-item")
      const percentImpostoText = impostoItem.lastChild
      impostoItem.removeChild(impostoInput)
      impostoItem.removeChild(percentImpostoText)
      impostoItem.appendChild(newImpostoSpan)

      editBtn.textContent = "Editar"
      editBtn.classList.remove("save-btn")
      editBtn.classList.add("edit-btn")
      isEditing = false

      await salvarPorcentagens(newClinica, newImposto)
      atualizarTotalComDesconto()
    }
  })

  /* ---------- FILTRO DE DATAS ---------- */
  startDateInput.addEventListener("change", () => {
    const start = new Date(startDateInput.value)
    const end = new Date(endDateInput.value)
    if (start > end) {
      alert("A data de início não pode ser maior que a data final.")
      definirDatasDoMes()
    }
    carregarDadosFinanceiros()
  })

  endDateInput.addEventListener("change", () => {
    const start = new Date(startDateInput.value)
    const end = new Date(endDateInput.value)
    if (start > end) {
      alert("A data final não pode ser menor que a data de início.")
      definirDatasDoMes()
    }
    carregarDadosFinanceiros()
  })

  /* ---------- CHARTS ---------- */
  const chartConfig = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, labels: { color: "#666", font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) label += ": "
            const value = context.parsed.y ?? context.parsed
            return label + formatMoney(value)
          },
        },
      },
    },
  }

  function createRevenueChart(period, chartData) {
    const ctx = document.getElementById("revenueChart").getContext("2d")
    if (currentCharts.revenue) currentCharts.revenue.destroy()
    currentCharts.revenue = new window.Chart(ctx, {
      type: "bar",
      data: { labels: chartData[period].labels, datasets: [{ label: "Faturamento (R$)", data: chartData[period].revenue, backgroundColor: "#dca0e5", borderColor: "#5e2d79", borderWidth: 1, borderRadius: 4 }] },
      options: { ...chartConfig, scales: { y: { beginAtZero: true, ticks: { color: "#666", callback: (v) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) }, grid: { color: "#eee" } }, x: { ticks: { color: "#666" }, grid: { color: "#eee" } } } },
    })
  }

  function createStatusChart(period, chartData) {
    const ctx = document.getElementById("statusChart").getContext("2d")
    if (currentCharts.status) currentCharts.status.destroy()
    currentCharts.status = new window.Chart(ctx, {
      type: "doughnut",
      data: { labels: chartData[period].statusLabels, datasets: [{ data: chartData[period].status, backgroundColor: ["#22c55e", "#3b82f6", "#a855f7"], borderColor: "#fff", borderWidth: 2 }] },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.parsed || 0
                const count = chartData[period].statusCounts[context.dataIndex] || 0
                return `${label}: ${formatMoney(value)} (${count} consultas)`
              },
            },
          },
        },
      },
    })
  }

  function createConvenioChart(period, chartData) {
    const ctx = document.getElementById("convênioChart").getContext("2d")
    if (currentCharts.convenio) currentCharts.convenio.destroy()

    const filteredLabels = []
    const filteredData = []
    const colors = ["#5e2d79", "#dca0e5", "#e7b5e8", "#f0d5f7", "#9333ea", "#c084fc", "#d8b4fe", "#e9d5ff"]

    chartData[period].convenioLabels.forEach((label, i) => {
      if (chartData[period].convenio[i] > 0) {
        filteredLabels.push(label)
        filteredData.push(chartData[period].convenio[i])
      }
    })

    currentCharts.convenio = new window.Chart(ctx, {
      type: "pie",
      data: { labels: filteredLabels.length > 0 ? filteredLabels : ["Sem dados"], datasets: [{ data: filteredData.length > 0 ? filteredData : [1], backgroundColor: colors, borderColor: "#fff", borderWidth: 2 }] },
      options: chartConfig,
    })
  }

  function createTrendChart(period, chartData) {
    const ctx = document.getElementById("trendChart").getContext("2d")
    if (currentCharts.trend) currentCharts.trend.destroy()
    currentCharts.trend = new window.Chart(ctx, {
      type: "line",
      data: { labels: chartData[period].labels, datasets: [{ label: "Tendência de Faturamento", data: chartData[period].trend, borderColor: "#5e2d79", backgroundColor: "rgba(94, 45, 121, 0.1)", fill: true, tension: 0.4, pointBackgroundColor: "#5e2d79", pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 5 }] },
      options: { ...chartConfig, scales: { y: { beginAtZero: true, ticks: { color: "#666", callback: (v) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) }, grid: { color: "#eee" } }, x: { ticks: { color: "#666" }, grid: { color: "#eee" } } } },
    })
  }

  function updateAllCharts(period, chartData) {
    createRevenueChart(period, chartData)
    createStatusChart(period, chartData)
    createConvenioChart(period, chartData)
    createTrendChart(period, chartData)
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
      updateAllCharts(this.dataset.period, window.currentChartData || {})
    })
  })

  /* ---------- INICIALIZAÇÃO ---------- */
  inicializarValores()
  setTimeout(carregarDadosFinanceiros, 500)
})
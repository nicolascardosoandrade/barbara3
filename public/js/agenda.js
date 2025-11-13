document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar")
  const menuIcon = document.querySelector(".menu-icon")
  const userToggle = document.getElementById("userToggle")
  const userMenu = document.getElementById("userMenu")
  const todayBtn = document.getElementById("todayBtn")

  const modal = document.getElementById("appointmentModal")
  const closeModalBtn = document.getElementById("closeModal")

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

  const now = new Date()
  const brasiliaOffset = -3 * 60
  const localOffset = now.getTimezoneOffset()
  const brasiliaTime = new Date(now.getTime() + (brasiliaOffset - localOffset) * 60 * 1000)
  const today = brasiliaTime.toISOString().split("T")[0]

  function getStartOfWeek(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const isMobile = window.innerWidth < 768
  const initialView = isMobile ? "timeGridDay" : "timeGridWeek"

  let initialDate = today
  if (initialView === "timeGridWeek") {
    initialDate = getStartOfWeek(brasiliaTime).toISOString().split("T")[0]
  } else if (initialView === "dayGridMonth") {
    initialDate = getStartOfMonth(brasiliaTime).toISOString().split("T")[0]
  }

  const calendarEl = document.getElementById("calendar")
  const FullCalendar = window.FullCalendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialDate: initialDate,
    initialView: initialView,
    locale: "pt-br",
    timeZone: "America/Sao_Paulo",
    slotMinTime: "06:00:00",
    slotMaxTime: "22:00:00",
    allDaySlot: false,
    slotDuration: "00:30:00",
    slotLabelInterval: "00:30:00",
    slotLabelFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
    height: "auto",
    aspectRatio: window.innerWidth < 480 ? 1.0 : window.innerWidth < 768 ? 1.2 : 1.8,
    slotHeight: 50,

    events: async (fetchInfo, successCallback, failureCallback) => {
      try {
        const response = await fetch("/api/agenda/events")
        if (!response.ok) throw new Error("Erro na resposta do servidor")
        let events = await response.json()

        // Adiciona classe 'online-event' para eventos Online
        events = events.map(event => {
          if (event.extendedProps?.modalidade === 'Online') {
            const classNames = Array.isArray(event.classNames) ? event.classNames : []
            event.classNames = [...classNames, 'online-event']
          }
          return event
        })

        successCallback(events)
      } catch (error) {
        console.error("Erro ao carregar eventos:", error)
        failureCallback(error)
      }
    },

    eventContent: (arg) => {
      const timeText = arg.timeText ? `<div class="fc-event-time">${arg.timeText}</div>` : ""
      const titleText = `<div class="fc-event-title">${arg.event.title}</div>`
      return { html: timeText + titleText }
    },

    eventDidMount: (info) => {
      const eventEl = info.el
      const isOnline = info.event.extendedProps.modalidade === 'Online'
      const classList = info.event.classNames || []
      const isGreen = classList.includes("green")
      const isBlue = classList.includes("blue")
      const isRed = classList.includes("red")
      const isLilac = classList.includes("lilac")

      // Define fundo conforme status
      if (isGreen) {
        eventEl.style.background = "linear-gradient(135deg, #1b5e20, #2e7d32)"
        eventEl.style.borderColor = "#2e7d32"
      } else if (isBlue) {
        eventEl.style.background = "linear-gradient(135deg, #1565c0, #1976d2)"
        eventEl.style.borderColor = "#1976d2"
      } else if (isRed) {
        eventEl.style.background = "linear-gradient(135deg, #b71c1c, #d32f2f)"
        eventEl.style.borderColor = "#d32f2f"
      } else if (isLilac) {
        eventEl.style.background = "linear-gradient(135deg, #ab47bc, #ba68c8)"
        eventEl.style.borderColor = "#ba68c8"
      }

      // Aplica estilo para Online: texto laranja em TODAS as visões
      if (isOnline) {
        eventEl.style.color = "#ff9800"
        eventEl.style.fontWeight = "600"

        const titleEl = eventEl.querySelector('.fc-event-title')
        const timeEl = eventEl.querySelector('.fc-event-time')

        if (titleEl) {
          titleEl.style.color = "#ff9800"
          titleEl.style.fontWeight = "600"
        }
        if (timeEl) {
          timeEl.style.color = "#ffcc80"
          timeEl.style.fontWeight = "500"
        }
      } else {
        // Texto branco para não-Online
        eventEl.style.color = "white"
        const titleEl = eventEl.querySelector('.fc-event-title')
        const timeEl = eventEl.querySelector('.fc-event-time')
        if (titleEl) titleEl.style.color = "white"
        if (timeEl) {
          timeEl.style.color = "#e0e0e0"
          timeEl.style.fontWeight = "500"
        }
      }

      // Garante peso da fonte
      eventEl.style.fontWeight = isOnline ? "600" : "500"
    },

    eventClick: (info) => {
      info.jsEvent.preventDefault()
      openAppointmentModal(info.event.id)
    },

    headerToolbar: { left: "prev", center: "title", right: "next" },
  })

  calendar.render()

  async function openAppointmentModal(appointmentId) {
    try {
      const response = await fetch(`/api/agendamentos/${appointmentId}`)
      if (!response.ok) throw new Error("Erro ao buscar dados do agendamento")
      const data = await response.json()

      document.getElementById("modalPatientName").textContent = data.nome_paciente || "Nome não disponível"

      const startDateTime = new Date(`${data.data_consulta_raw}T${data.inicio}`)
      const endDateTime = new Date(`${data.data_consulta_raw}T${data.fim}`)
      const formattedDate = startDateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const formattedTime = `${startDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${endDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      document.getElementById("modalDateTime").textContent = `${formattedDate} | ${formattedTime}`

      document.getElementById("modalPhone").textContent = data.telefone || "-"
      document.getElementById("callPhone").href = `tel:${data.telefone?.replace(/\D/g, '')}`
      document.getElementById("whatsappPhone").href = `https://wa.me/55${data.telefone?.replace(/\D/g, '')}`

      document.getElementById("modalConvenio").textContent = data.convenio || "-"
      document.getElementById("modalConsulta").textContent = data.consulta || "-"
      document.getElementById("modalModalidade").textContent = data.modalidade || "-"
      document.getElementById("modalFrequencia").textContent = data.frequencia || "-"
      document.getElementById("modalObs").value = data.observacoes || ""

      const valorFormatado = data.valor ? `R$ ${parseFloat(data.valor).toFixed(2).replace(".", ",")}` : "R$ 0,00"
      document.getElementById("modalValor").textContent = valorFormatado

      modal.dataset.appointmentId = appointmentId
      modal.classList.add("active")
      document.body.style.overflow = "hidden"
    } catch (error) {
      console.error("Erro ao abrir modal:", error)
      alert("Erro ao carregar dados do agendamento.")
    }
  }

  function closeModal() {
    modal.classList.remove("active")
    document.body.style.overflow = "auto"
  }

  closeModalBtn.addEventListener("click", closeModal)
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal() })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) closeModal()
  })

  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const action = e.currentTarget.dataset.action
      const appointmentId = modal.dataset.appointmentId

      if (action === "voltar") { closeModal(); return }

      if (action === "agenda_semanal") {
        try {
          const response = await fetch(`/api/agendamentos/${appointmentId}`)
          if (!response.ok) throw new Error("Erro ao buscar detalhes")
          const data = await response.json()

          const baseDate = new Date(data.data_consulta_raw)
          const details = {
            nome_paciente: data.nome_paciente,
            telefone: data.telefone,
            inicio: data.inicio,
            fim: data.fim,
            convenio: data.convenio,
            consulta: data.consulta,
            modalidade: data.modalidade,
            frequencia: data.frequencia,
            observacoes: data.observacoes,
          }

          const promises = []
          for (let i = 0; i < 4; i++) {
            const newDate = new Date(baseDate)
            newDate.setDate(newDate.getDate() + 7 * (i + 1))
            details.data_consulta = newDate.toISOString().split("T")[0]

            promises.push(
              fetch("/api/agendamentos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(details),
              })
            )
          }

          await Promise.all(promises)
          calendar.refetchEvents()
          alert("Agendamentos semanais criados com sucesso!")
          calendar.changeView("timeGridWeek")
          document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"))
          document.querySelector('.view-btn[data-view="timeGridWeek"]').classList.add("active")
        } catch (error) {
          console.error("Erro ao criar agendamentos semanais:", error)
          alert("Erro ao criar agendamentos semanais. Tente novamente.")
        }
        closeModal()
        return
      }

      try {
        const response = await fetch(`/api/agendamentos/${appointmentId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action })
        })

        if (!response.ok) throw new Error("Erro na resposta do servidor")
        await response.json()

        calendar.refetchEvents()
        closeModal()
        alert("Status atualizado com sucesso!")
      } catch (error) {
        console.error("Erro ao atualizar status:", error)
        alert("Erro ao atualizar status. Tente novamente.")
      }
    })
  })

  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      calendar.today()
      setTimeout(() => calendar.updateSize(), 100)
    })
  }

  menuIcon.addEventListener("click", (e) => {
    e.stopPropagation()
    if (window.innerWidth < 768) {
      sidebar.classList.toggle("active")
      document.body.classList.toggle("no-scroll")
    } else {
      sidebar.classList.toggle("collapsed")
      sidebar.classList.remove("active")
      document.body.classList.remove("no-scroll")
    }
    setTimeout(() => calendar.updateSize(), 310)
  })

  sidebar.querySelectorAll("nav ul li a").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768 && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active")
        document.body.classList.remove("no-scroll")
        setTimeout(() => calendar.updateSize(), 310)
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
      setTimeout(() => calendar.updateSize(), 310)
    }
  })

  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.getAttribute("data-view")
      const isMobile = window.innerWidth < 768
      const isSmallMobile = window.innerWidth < 480

      let aspectRatio = 1.8
      if (isSmallMobile) aspectRatio = 1.0
      else if (isMobile || view === "timeGridDay") aspectRatio = 1.2

      calendar.setOption("aspectRatio", aspectRatio)

      let targetDate = today
      if (view === "timeGridWeek") targetDate = getStartOfWeek(brasiliaTime).toISOString().split("T")[0]
      else if (view === "dayGridMonth") targetDate = getStartOfMonth(brasiliaTime).toISOString().split("T")[0]

      calendar.changeView(view, targetDate)
      document.querySelectorAll(".view-btn").forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")
      setTimeout(() => calendar.updateSize(), 100)
    })
  })

  if (window.innerWidth < 768) {
    document.querySelector('.view-btn[data-view="timeGridDay"]').classList.add("active")
  } else {
    document.querySelector('.view-btn[data-view="timeGridWeek"]').classList.add("active")
  }

  window.addEventListener("resize", () => {
    initializeSidebarState()
    const isMobile = window.innerWidth < 768
    const isSmallMobile = window.innerWidth < 480

    const targetView = isMobile ? "timeGridDay" : "timeGridWeek"
    if (calendar.view.type !== targetView) {
      calendar.changeView(targetView)
      document.querySelectorAll(".view-btn").forEach((btn) => btn.classList.remove("active"))
      document.querySelector(`.view-btn[data-view="${targetView}"]`).classList.add("active")
    }

    const aspectRatio = isSmallMobile ? 1.0 : isMobile ? 1.2 : 1.8
    calendar.setOption("aspectRatio", aspectRatio)
    setTimeout(() => calendar.updateSize(), 310)
  })

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
    if (confirm("Deseja realmente sair?")) {
      alert("Logout realizado!")
    }
  }

  const XLSX = window.XLSX
  document.getElementById("exportExcel")?.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/agenda/events")
      const events = await response.json()
      const data = events.map((e) => ({
        Data: new Date(e.start).toLocaleDateString("pt-BR"),
        Horário: `${new Date(e.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${new Date(e.end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        Paciente: e.title,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Agenda")
      XLSX.writeFile(wb, `Agenda_${today}.xlsx`)
    } catch (error) {
      alert("Erro ao exportar.")
    }
  })

  // Socket.io para sincronização em tempo real
  const socket = io()
  socket.on('agendamento-updated', () => {
    calendar.refetchEvents()
  })
})
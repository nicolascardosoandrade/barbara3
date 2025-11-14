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
  }

  // === FUNCIONALIDADE DE TAREFAS ===
  const taskList = document.getElementById("taskList")
  const addForm = document.getElementById("addForm")
  const API_URL = "/api/tarefas"

  // Carregar tarefas
  async function carregarTarefas() {
    try {
      const res = await fetch(API_URL)
      const tarefas = await res.json()

      if (tarefas.length === 0) {
        taskList.innerHTML = `<div class="empty-state"><p>Nenhuma anotação ainda. Adicione uma!</p></div>`
        return
      }

      taskList.innerHTML = tarefas.map(t => `
        <div class="task-item">
          <div class="task-info">
            <h3>${t.descricao}</h3>
            <span class="task-date">${formatarData(t.data_vencimento)}</span>
            <small style="color:#95a5a6;display:block;margin-top:4px;">Criada em ${t.criada_em_formatada || '—'}</small>
          </div>
          <div class="task-actions">
            <button class="btn-small btn-edit" onclick="mostrarEdicao(${t.id}, '${t.descricao}', '${t.data_vencimento}')">
              Editar
            </button>
            <button class="btn-small btn-delete" onclick="excluirTarefa(${t.id})">
              Excluir
            </button>
          </div>
          <form class="edit-form" id="form-${t.id}">
            <input type="text" value="${t.descricao}" class="input-field" required>
            <input type="date" value="${t.data_vencimento}" class="input-field" required>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button type="button" class="btn-small" style="background:linear-gradient(135deg, #ba68c8 0%, #ab47bc 100%); color:white;" onclick="salvarEdicao(${t.id})">Salvar</button>
              <button type="button" class="btn-small btn-cancel" onclick="cancelarEdicao(${t.id})">Cancelar</button>
            </div>
          </form>
        </div>
      `).join("")
    } catch (err) {
      console.error(err)
    }
  }

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    const descricao = document.getElementById("descricao").value.trim()
    const data_vencimento = document.getElementById("dataVencimento").value
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, data_vencimento })
    })
    addForm.reset()
    carregarTarefas()
  })

  window.excluirTarefa = async (id) => {
    if (confirm("Excluir esta anotação?")) {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" })
      carregarTarefas()
    }
  }

  window.mostrarEdicao = (id) => {
    document.getElementById(`form-${id}`).classList.add("active")
  }

  window.cancelarEdicao = (id) => {
    document.getElementById(`form-${id}`).classList.remove("active")
  }

  window.salvarEdicao = async (id) => {
    const form = document.getElementById(`form-${id}`)
    const [desc, date] = form.querySelectorAll("input")
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao: desc.value, data_vencimento: date.value })
    })
    cancelarEdicao(id)
    carregarTarefas()
  }

  function formatarData(data) {
    const [y, m, d] = data.split("-")
    return `${d}/${m}/${y}`
  }

  // Atualização em tempo real via Socket.io
  const socket = io()
  socket.on("tarefa-adicionada", () => carregarTarefas())
  socket.on("tarefa-atualizada", () => carregarTarefas())
  socket.on("tarefa-excluida", () => carregarTarefas())

  // Inicializar
  carregarTarefas()
})

require("dotenv").config()
const express = require("express")
const mysql = require("mysql2/promise")
const path = require("path")
const http = require("http")
const socketIo = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

const PORT = process.env.PORT || 3000

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "36321028",
  database: process.env.DB_NAME || "SistemaAer2",
  port: process.env.DB_PORT || 3306,
}

async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig)
    console.log("Conectado ao MySQL com sucesso!")
    return connection
  } catch (error) {
    console.error("Erro ao conectar ao MySQL:", error)
    process.exit(1)
  }
}

let db
connectDB().then((connection) => {
  db = connection
})

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

function formatarTelefone(telefone) {
  const numeros = (telefone || "").replace(/\D/g, "")

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  }
  return null
}

// ========================
// PACIENTES
// ========================

// Listar todos os pacientes
app.get("/api/pacientes", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })
    const [rows] = await db.execute(`SELECT * FROM pacientes ORDER BY nome_completo`)
    res.json(rows)
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error)
    res.status(500).json({ error: "Erro ao buscar pacientes" })
  }
})

// Buscar paciente por ID
app.get("/api/pacientes/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })
    const [rows] = await db.execute(`SELECT * FROM pacientes WHERE id = ?`, [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente não encontrado" })
    }
    res.json(rows[0])
  } catch (error) {
    console.error("Erro ao buscar paciente:", error)
    res.status(500).json({ error: "Erro ao buscar paciente" })
  }
})

// Cadastrar paciente
app.post("/api/pacientes", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não conectado" })
    }

    const {
      nomeCompleto,
      genero,
      responsavel,
      telefone,
      email,
      dataNascimento,
      cpf,
      convenio,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      situacao = "Ativo",
    } = req.body

    const generosValidos = ["M", "F", "O", "N"]
    if (!genero || !generosValidos.includes(genero)) {
      return res.status(400).json({
        success: false,
        error: "Gênero inválido. Use M, F, O ou N.",
      })
    }

    const cpfLimpo = (cpf || "").replace(/\D/g, "")
    const cepLimpo = (cep || "").replace(/\D/g, "")
    const telefoneFormatado = formatarTelefone(telefone)

    if (
      !nomeCompleto ||
      !telefoneFormatado ||
      !email ||
      !dataNascimento ||
      !cpfLimpo ||
      !convenio ||
      !cepLimpo ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cidade ||
      !estado
    ) {
      return res.status(400).json({
        success: false,
        error: "Todos os campos obrigatórios devem ser preenchidos.",
      })
    }

    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        success: false,
        error: "CPF deve conter 11 dígitos.",
      })
    }

    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: "CEP deve conter 8 dígitos.",
      })
    }

    if (!telefoneFormatado) {
      return res.status(400).json({
        success: false,
        error: "Telefone inválido. Use 10 ou 11 dígitos.",
      })
    }

    const query = `INSERT INTO pacientes (nome_completo, genero, responsavel, telefone, email, data_nascimento, cpf, convenio, cep, logradouro, numero, bairro, cidade, estado, situacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const values = [
      nomeCompleto,
      genero,
      responsavel || null,
      telefoneFormatado,
      email,
      dataNascimento,
      cpfLimpo,
      convenio,
      cepLimpo,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      situacao,
    ]

    const [result] = await db.execute(query, values)

    res.json({
      success: true,
      message: "Paciente cadastrado com sucesso!",
      id: result.insertId,
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, error: "CPF já cadastrado." })
    }
    console.error("Erro ao cadastrar paciente:", error)
    res.status(500).json({ success: false, error: "Erro ao cadastrar paciente." })
  }
})

// Atualizar paciente
app.put("/api/pacientes/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não conectado" })
    }

    const { id } = req.params
    const {
      nomeCompleto,
      genero,
      responsavel,
      telefone,
      email,
      dataNascimento,
      cpf,
      convenio,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      situacao = "Ativo",
    } = req.body

    const generosValidos = ["M", "F", "O", "N"]
    if (!genero || !generosValidos.includes(genero)) {
      return res.status(400).json({
        success: false,
        error: "Gênero inválido. Use M, F, O ou N.",
      })
    }

    const cpfLimpo = (cpf || "").replace(/\D/g, "")
    const cepLimpo = (cep || "").replace(/\D/g, "")
    const telefoneFormatado = formatarTelefone(telefone)

    if (
      !nomeCompleto ||
      !telefoneFormatado ||
      !email ||
      !dataNascimento ||
      !cpfLimpo ||
      !convenio ||
      !cepLimpo ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cidade ||
      !estado
    ) {
      return res.status(400).json({
        success: false,
        error: "Todos os campos obrigatórios devem ser preenchidos.",
      })
    }

    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        success: false,
        error: "CPF deve conter 11 dígitos.",
      })
    }

    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: "CEP deve conter 8 dígitos.",
      })
    }

    if (!telefoneFormatado) {
      return res.status(400).json({
        success: false,
        error: "Telefone inválido. Use 10 ou 11 dígitos.",
      })
    }

    const query = `UPDATE pacientes SET nome_completo = ?, genero = ?, responsavel = ?, telefone = ?, email = ?, data_nascimento = ?, cpf = ?, convenio = ?, cep = ?, logradouro = ?, numero = ?, bairro = ?, cidade = ?, estado = ?, situacao = ? WHERE id = ?`

    const values = [
      nomeCompleto,
      genero,
      responsavel || null,
      telefoneFormatado,
      email,
      dataNascimento,
      cpfLimpo,
      convenio,
      cepLimpo,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      situacao,
      id,
    ]

    const [result] = await db.execute(query, values)

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Paciente não encontrado." })
    }

    res.json({
      success: true,
      message: "Paciente atualizado com sucesso!",
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, error: "CPF já cadastrado para outro paciente." })
    }
    console.error("Erro ao atualizar paciente:", error)
    res.status(500).json({ success: false, error: "Erro ao atualizar paciente." })
  }
})

// Excluir paciente
app.delete("/api/pacientes/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: "Banco de dados não conectado" })
    }

    const { id } = req.params

    const [rows] = await db.execute("SELECT id FROM pacientes WHERE id = ?", [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Paciente não encontrado" })
    }

    await db.execute("DELETE FROM pacientes WHERE id = ?", [id])

    res.json({ success: true, message: "Paciente excluído com sucesso!" })
  } catch (error) {
    console.error("Erro ao excluir paciente:", error)
    res.status(500).json({ success: false, error: "Erro ao excluir paciente." })
  }
})

// ========================
// CONVÊNIOS
// ========================

// Listar convênios
app.get("/api/convenios", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })
    const [rows] = await db.execute(`SELECT * FROM convenios ORDER BY nome_convenio`)
    res.json(rows)
  } catch (error) {
    console.error("Erro ao buscar convênios:", error)
    res.status(500).json({ error: "Erro ao buscar convênios" })
  }
})

// Buscar convênio por ID
app.get("/api/convenios/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })
    const [rows] = await db.execute(`SELECT * FROM convenios WHERE id = ?`, [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ error: "Convênio não encontrado" })
    }
    res.json(rows[0])
  } catch (error) {
    console.error("Erro ao buscar convênio:", error)
    res.status(500).json({ error: "Erro ao buscar convênio" })
  }
})

// Buscar convênio por nome
app.get("/api/convenios/nome/:nome", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })
    const [rows] = await db.execute(`SELECT * FROM convenios WHERE nome_convenio = ?`, [req.params.nome])
    if (rows.length === 0) {
      return res.status(404).json({ error: "Convênio não encontrado" })
    }
    res.json(rows[0])
  } catch (error) {
    console.error("Erro ao buscar convênio:", error)
    res.status(500).json({ error: "Erro ao buscar convênio" })
  }
})

// Cadastrar convênio
app.post("/api/convenios", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não conectado" })
    }

    const { nomeConvenio, consulta, duracao, valor, pagamento } = req.body

    if (!nomeConvenio || !consulta || !duracao || valor === undefined || !pagamento) {
      return res.status(400).json({
        success: false,
        error: "Todos os campos obrigatórios devem ser preenchidos.",
      })
    }

    const valorNum = Number.parseFloat(valor)
    if (isNaN(valorNum) || valorNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Valor deve ser um número positivo.",
      })
    }

    const pagamentoNum = Number.parseInt(pagamento)
    if (isNaN(pagamentoNum) || pagamentoNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Pagamento deve ser um número inteiro positivo.",
      })
    }

    const query = `INSERT INTO convenios (nome_convenio, consulta, duracao, valor, pagamento) VALUES (?, ?, ?, ?, ?)`

    const values = [nomeConvenio, consulta, duracao, valorNum, pagamentoNum]

    const [result] = await db.execute(query, values)

    res.json({
      success: true,
      message: "Convênio cadastrado com sucesso!",
      id: result.insertId,
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, error: "Nome do convênio já cadastrado." })
    }
    console.error("Erro ao cadastrar convênio:", error)
    res.status(500).json({ success: false, error: "Erro ao cadastrar convênio." })
  }
})

// Atualizar convênio
app.put("/api/convenios/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não conectado" })
    }

    const { id } = req.params
    const { nomeConvenio, consulta, duracao, valor, pagamento } = req.body

    if (!nomeConvenio || !consulta || !duracao || valor === undefined || !pagamento) {
      return res.status(400).json({
        success: false,
        error: "Todos os campos obrigatórios devem ser preenchidos.",
      })
    }

    const valorNum = Number.parseFloat(valor)
    if (isNaN(valorNum) || valorNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Valor deve ser um número positivo.",
      })
    }

    const pagamentoNum = Number.parseInt(pagamento)
    if (isNaN(pagamentoNum) || pagamentoNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Pagamento deve ser um número inteiro positivo.",
      })
    }

    const query = `UPDATE convenios SET nome_convenio = ?, consulta = ?, duracao = ?, valor = ?, pagamento = ? WHERE id = ?`

    const values = [nomeConvenio, consulta, duracao, valorNum, pagamentoNum, id]

    const [result] = await db.execute(query, values)

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Convênio não encontrado." })
    }

    res.json({
      success: true,
      message: "Convênio atualizado com sucesso!",
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, error: "Nome do convênio já cadastrado para outro convênio." })
    }
    console.error("Erro ao atualizar convênio:", error)
    res.status(500).json({ success: false, error: "Erro ao atualizar convênio." })
  }
})

// Excluir convênio
app.delete("/api/convenios/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: "Banco de dados não conectado" })
    }

    const { id } = req.params

    const [rows] = await db.execute("SELECT id FROM convenios WHERE id = ?", [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Convênio não encontrado" })
    }

    await db.execute("DELETE FROM convenios WHERE id = ?", [id])

    res.json({ success: true, message: "Convênio excluído com sucesso!" })
  } catch (error) {
    console.error("Erro ao excluir convênio:", error)
    res.status(500).json({ success: false, error: "Erro ao excluir convênio." })
  }
})

// ========================
// AGENDAMENTOS
// ========================

// Listar todos os agendamentos
app.get("/api/agendamentos", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })
    const [rows] = await db.execute(`
      SELECT 
        id,
        DATE_FORMAT(data_consulta, '%d/%m/%Y') as data_consulta,
        nome_paciente,
        telefone,
        TIME_FORMAT(inicio, '%H:%i') as inicio,
        TIME_FORMAT(fim, '%H:%i') as fim,
        convenio,
        consulta,
        modalidade,
        frequencia,
        observacoes,
        valor,
        color,
        status_pagamento
      FROM agendamentos 
      ORDER BY STR_TO_DATE(data_consulta, '%Y-%m-%d') DESC, inicio ASC
    `)
    res.json(rows)
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    res.status(500).json({ error: "Erro ao buscar agendamentos" })
  }
})

// Buscar agendamento por ID
app.get("/api/agendamentos/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { id } = req.params

    const [rows] = await db.execute(
      `SELECT 
        a.id,
        DATE_FORMAT(a.data_consulta, '%d/%m/%Y') as data_consulta,
        a.data_consulta as data_consulta_raw,
        a.nome_paciente,
        a.telefone,
        TIME_FORMAT(a.inicio, '%H:%i') as inicio,
        TIME_FORMAT(a.fim, '%H:%i') as fim,
        a.convenio,
        a.consulta,
        a.modalidade,
        a.frequencia,
        a.observacoes,
        a.valor,
        a.color,
        a.status_pagamento
      FROM agendamentos a
      WHERE a.id = ?`,
      [id],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error("Erro ao buscar detalhes do agendamento:", error)
    res.status(500).json({ error: "Erro ao buscar detalhes do agendamento" })
  }
})

// Cadastrar agendamento (COM VALOR DO CONVÊNIO OU SOBRESCRITO)
app.post("/api/agendamentos", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const {
      data_consulta,
      nome_paciente,
      telefone,
      inicio,
      fim,
      convenio,
      consulta,
      modalidade,
      frequencia,
      observacoes,
      valor,
    } = req.body

    if (!data_consulta || !nome_paciente || !inicio || !fim || !convenio || !consulta || !modalidade || !frequencia) {
      return res.status(400).json({ error: "Campos obrigatórios não preenchidos." })
    }

    if (!["Presencial", "Online"].includes(modalidade)) {
      return res.status(400).json({ error: "Modalidade deve ser 'Presencial' ou 'Online'." })
    }

    const telefoneFormatado = telefone ? formatarTelefone(telefone) : null

    let valor_final = 0.0
    let use_provided = false
    if (valor !== undefined && valor !== null) {
      const num = Number.parseFloat(valor)
      if (!isNaN(num)) {
        valor_final = num
        use_provided = true
      }
    }
    if (!use_provided && convenio) {
      const [[conv]] = await db.execute("SELECT valor FROM convenios WHERE nome_convenio = ?", [convenio])
      if (conv && conv.valor !== null) {
        valor_final = Number.parseFloat(conv.valor)
      }
    }

    const query = `INSERT INTO agendamentos (data_consulta, nome_paciente, telefone, inicio, fim, convenio, consulta, modalidade, frequencia, observacoes, valor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const values = [
      data_consulta,
      nome_paciente,
      telefoneFormatado,
      inicio,
      fim,
      convenio,
      consulta,
      modalidade,
      frequencia,
      observacoes || null,
      valor_final,
    ]

    const [result] = await db.execute(query, values)

    io.emit("agendamento-updated")

    res.json({
      success: true,
      message: "Agendamento cadastrado com sucesso!",
      id: result.insertId,
    })
  } catch (error) {
    console.error("Erro ao cadastrar agendamento:", error)
    res.status(500).json({ error: "Erro ao cadastrar agendamento." })
  }
})

// Atualizar agendamento por ID (COM VALOR DO CONVÊNIO OU SOBRESCRITO)
app.put("/api/agendamentos/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { id } = req.params
    const {
      data_consulta,
      nome_paciente,
      telefone,
      inicio,
      fim,
      convenio,
      consulta,
      modalidade,
      frequencia,
      observacoes,
      valor,
    } = req.body

    if (!data_consulta || !nome_paciente || !inicio || !fim || !convenio || !consulta || !modalidade || !frequencia) {
      return res.status(400).json({ error: "Campos obrigatórios não preenchidos." })
    }

    if (!["Presencial", "Online"].includes(modalidade)) {
      return res.status(400).json({ error: "Modalidade deve ser 'Presencial' ou 'Online'." })
    }

    const telefoneFormatado = telefone ? formatarTelefone(telefone) : null

    let valor_final = 0.0
    let use_provided = false
    if (valor !== undefined && valor !== null) {
      const num = Number.parseFloat(valor)
      if (!isNaN(num)) {
        valor_final = num
        use_provided = true
      }
    }
    if (!use_provided && convenio) {
      const [[conv]] = await db.execute("SELECT valor FROM convenios WHERE nome_convenio = ?", [convenio])
      if (conv && conv.valor !== null) {
        valor_final = Number.parseFloat(conv.valor)
      }
    }

    const query = `UPDATE agendamentos SET data_consulta = ?, nome_paciente = ?, telefone = ?, inicio = ?, fim = ?, convenio = ?, consulta = ?, modalidade = ?, frequencia = ?, observacoes = ?, valor = ? WHERE id = ?`

    const values = [
      data_consulta,
      nome_paciente,
      telefoneFormatado,
      inicio,
      fim,
      convenio,
      consulta,
      modalidade,
      frequencia,
      observacoes || null,
      valor_final,
      id,
    ]

    const [result] = await db.execute(query, values)

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado" })
    }

    io.emit("agendamento-updated")

    res.json({ success: true, message: "Agendamento atualizado com sucesso!" })
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error)
    res.status(500).json({ error: "Erro ao atualizar agendamento" })
  }
})

app.patch("/api/agendamentos/:id/status", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { id } = req.params
    const { status } = req.body

    const statusColors = {
      atendido: "blue",
      cancelado: "red",
      nao_desmarcado: "lilac",
      agendado: "green",
    }

    const color = statusColors[status] || "green"

    const [result] = await db.execute("UPDATE agendamentos SET color = ? WHERE id = ?", [color, id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado" })
    }

    io.emit("agendamento-updated")

    res.json({
      success: true,
      message: "Status atualizado com sucesso!",
      color: color,
    })
  } catch (error) {
    console.error("Erro ao atualizar status do agendamento:", error)
    res.status(500).json({ error: "Erro ao atualizar status" })
  }
})

// Excluir agendamento por ID
app.delete("/api/agendamentos/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { id } = req.params

    const [result] = await db.execute("DELETE FROM agendamentos WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado" })
    }

    io.emit("agendamento-updated")

    res.json({ success: true, message: "Agendamento excluído com sucesso!" })
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error)
    res.status(500).json({ error: "Erro ao excluir agendamento" })
  }
})

// ========================
// AGENDAMENTOS PARA O CALENDÁRIO (FullCalendar)
// ========================
app.get("/api/agenda/events", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const [rows] = await db.execute(
      `SELECT id, data_consulta, inicio, fim, nome_paciente, color, valor, modalidade FROM agendamentos ORDER BY data_consulta, inicio`,
    )

    const events = rows.map((row) => {
      const date = row.data_consulta.toISOString().split("T")[0]
      const start = `${date}T${row.inicio}`
      const end = `${date}T${row.fim}`

      return {
        id: row.id,
        title: row.nome_paciente,
        start: start,
        end: end,
        classNames: [row.color || "green"],
        extendedProps: {
          valor: row.valor,
          modalidade: row.modalidade || "Presencial",
        },
      }
    })

    res.json(events)
  } catch (error) {
    console.error("Erro ao buscar eventos da agenda:", error)
    res.status(500).json({ error: "Erro ao carregar agenda" })
  }
})

app.get("/api/financeiro/resumo", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate são obrigatórios" })
    }

    const [rows] = await db.execute(
      `SELECT 
        id,
        data_consulta,
        nome_paciente,
        convenio,
        valor,
        color,
        inicio,
        CASE 
          WHEN color = 'green' THEN 'agendado'
          WHEN color = 'blue' THEN 'atendido'
          WHEN color = 'lilac' THEN 'nao_desmarcado'
          WHEN color = 'red' THEN 'nao_desmarcado'
          ELSE 'agendado'
        END as status
      FROM agendamentos 
      WHERE data_consulta BETWEEN ? AND ?
      ORDER BY data_consulta, inicio`,
      [startDate, endDate],
    )

    console.log(`[server] Query returned ${rows.length} rows for ${startDate} to ${endDate}`)

    let agendado = 0
    let atendido = 0
    let naoDesmarcado = 0

    rows.forEach((row) => {
      const v = Number.parseFloat(row.valor) || 0
      switch (row.status) {
        case "agendado":
          agendado += v
          break
        case "atendido":
          atendido += v
          break
        case "nao_desmarcado":
          naoDesmarcado += v
          break
      }
    })

    const totalSemDesconto = atendido + naoDesmarcado

    console.log(
      `[server] Resumo calculado: agendado=${agendado.toFixed(2)}, atendido=${atendido.toFixed(2)}, naoDesmarcado=${naoDesmarcado.toFixed(2)}, total=${totalSemDesconto.toFixed(2)}`,
    )

    res.json({
      resumo: {
        agendado,
        atendido,
        naoDesmarcado,
        totalSemDesconto,
      },
      agendamentos: rows,
    })
  } catch (error) {
    console.error("Erro ao buscar resumo financeiro:", error)
    res.status(500).json({ error: "Erro ao buscar resumo financeiro" })
  }
})

// ========================
// FINANCEIRO
// ========================

// GET endpoint to retrieve CLÍNICA and IMPOSTOS percentages
app.get("/api/financeiro/porcentagens", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não conectado" })
    }

    // Query to get percentual_clinica and percentual_impostos from configuracoes_financeiras table
    const [rows] = await db.execute(
      `SELECT nome_configuracao, valor_percentual 
       FROM configuracoes_financeiras 
       WHERE nome_configuracao IN ('percentual_clinica', 'percentual_impostos') 
       AND ativo = TRUE`,
    )

    let clinica = 45.0 // default value
    let imposto = 6.0 // default value

    // Map the results
    rows.forEach((row) => {
      if (row.nome_configuracao === "percentual_clinica") {
        clinica = Number.parseFloat(row.valor_percentual)
      } else if (row.nome_configuracao === "percentual_impostos") {
        imposto = Number.parseFloat(row.valor_percentual)
      }
    })

    console.log(`[server] Porcentagens carregadas: clinica=${clinica}%, imposto=${imposto}%`)

    res.json({ clinica, imposto })
  } catch (error) {
    console.error("Erro ao buscar porcentagens:", error)
    res.status(500).json({ error: "Erro ao buscar porcentagens financeiras" })
  }
})

// POST endpoint to save CLÍNICA and IMPOSTOS percentages
app.post("/api/financeiro/porcentagens", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Banco de dados não conectado" })
    }

    const { clinica, imposto } = req.body

    if (clinica === undefined || imposto === undefined) {
      return res.status(400).json({
        error: "Os campos 'clinica' e 'imposto' são obrigatórios",
      })
    }

    const clinicaNum = Number.parseFloat(clinica)
    const impostoNum = Number.parseFloat(imposto)

    if (isNaN(clinicaNum) || clinicaNum < 0 || clinicaNum > 100) {
      return res.status(400).json({
        error: "Percentual de clínica deve ser um número entre 0 e 100",
      })
    }

    if (isNaN(impostoNum) || impostoNum < 0 || impostoNum > 100) {
      return res.status(400).json({
        error: "Percentual de imposto deve ser um número entre 0 e 100",
      })
    }

    // Update percentual_clinica
    await db.execute(
      `UPDATE configuracoes_financeiras 
       SET valor_percentual = ? 
       WHERE nome_configuracao = 'percentual_clinica'`,
      [clinicaNum],
    )

    // Update percentual_impostos
    await db.execute(
      `UPDATE configuracoes_financeiras 
       SET valor_percentual = ? 
       WHERE nome_configuracao = 'percentual_impostos'`,
      [impostoNum],
    )

    console.log(`[server] Porcentagens atualizadas: clinica=${clinicaNum}%, imposto=${impostoNum}%`)

    res.json({
      success: true,
      message: "Porcentagens atualizadas com sucesso!",
      clinica: clinicaNum,
      imposto: impostoNum,
    })
  } catch (error) {
    console.error("Erro ao salvar porcentagens:", error)
    res.status(500).json({ error: "Erro ao salvar porcentagens financeiras" })
  }
})

// ========================
// ANOTAÇÕES / TAREFAS DA BARBARA
// ========================

// Listar todas as tarefas
app.get("/api/tarefas", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const [rows] = await db.execute(`
      SELECT 
        id,
        descricao,
        DATE_FORMAT(data_vencimento, '%Y-%m-%d') as data_vencimento,
        DATE_FORMAT(criada_em, '%d/%m/%Y às %H:%i') as criada_em_formatada
      FROM tarefas 
      ORDER BY data_vencimento ASC, criada_em DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error)
    res.status(500).json({ error: "Erro ao buscar tarefas" })
  }
})

// Adicionar nova tarefa
app.post("/api/tarefas", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { descricao, data_vencimento } = req.body

    if (!descricao || !data_vencimento) {
      return res.status(400).json({ error: "Descrição e data são obrigatórias." })
    }

    if (descricao.trim().length < 2) {
      return res.status(400).json({ error: "Descrição muito curta." })
    }

    const [result] = await db.execute(
      `INSERT INTO tarefas (descricao, data_vencimento) VALUES (?, ?)`,
      [descricao.trim(), data_vencimento]
    )

    const novaTarefa = {
      id: result.insertId,
      descricao: descricao.trim(),
      data_vencimento,
      criada_em_formatada: new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).replace(',', ' às')
    }

    io.emit("tarefa-adicionada", novaTarefa)

    res.json({
      success: true,
      message: "Tarefa adicionada com sucesso!",
      tarefa: novaTarefa
    })
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error)
    res.status(500).json({ error: "Erro ao adicionar tarefa." })
  }
})

// Editar tarefa
app.put("/api/tarefas/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { id } = req.params
    const { descricao, data_vencimento } = req.body

    if (!descricao || !data_vencimento) {
      return res.status(400).json({ error: "Descrição e data são obrigatórias." })
    }

    const [result] = await db.execute(
      `UPDATE tarefas SET descricao = ?, data_vencimento = ? WHERE id = ?`,
      [descricao.trim(), data_vencimento, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tarefa não encontrada." })
    }

    const tarefaAtualizada = {
      id: parseInt(id),
      descricao: descricao.trim(),
      data_vencimento
    }

    io.emit("tarefa-atualizada", tarefaAtualizada)

    res.json({
      success: true,
      message: "Tarefa atualizada com sucesso!",
      tarefa: tarefaAtualizada
    })
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error)
    res.status(500).json({ error: "Erro ao atualizar tarefa." })
  }
})

// Excluir tarefa
app.delete("/api/tarefas/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" })

    const { id } = req.params

    const [result] = await db.execute("DELETE FROM tarefas WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tarefa não encontrada." })
    }

    io.emit("tarefa-excluida", { id: parseInt(id) })

    res.json({ success: true, message: "Tarefa excluída com sucesso!" })
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error)
    res.status(500).json({ error: "Erro ao excluir tarefa." })
  }
})

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})

process.on("SIGINT", async () => {
  if (db) {
    await db.end()
    console.log("Conexão com MySQL encerrada.")
  }
  process.exit(0)
})

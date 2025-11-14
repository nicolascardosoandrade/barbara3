-- ========================================
-- SISTEMA FINANCEIRO - BANCO DE DADOS COMPLETO
-- ========================================
-- Criado para: Sistema de Gestão de Agendamentos e Finanças
-- Data: 2025
-- ========================================
-- ========================================
-- 1. CRIAÇÃO DO BANCO DE DADOS
-- ========================================
DROP DATABASE IF EXISTS SistemaAer2;
CREATE DATABASE SistemaAer2;
USE SistemaAer2;
-- ========================================
-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS
-- ========================================
-- Tabela: pacientes
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    genero VARCHAR(50) NOT NULL,
    responsavel VARCHAR(255),
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    convenio VARCHAR(100) NOT NULL,
    cep VARCHAR(8) NOT NULL,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    situacao VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cpf (cpf),
    INDEX idx_nome (nome_completo),
    INDEX idx_convenio (convenio),
    INDEX idx_situacao (situacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela: convenios
CREATE TABLE convenios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_convenio VARCHAR(100) NOT NULL,
    consulta VARCHAR(100) NOT NULL,
    duracao TIME NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    pagamento INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_convenio (nome_convenio),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela: agendamentos (com coluna valor para controle financeiro)
CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_consulta DATE NOT NULL,
    nome_paciente VARCHAR(255) NOT NULL,
    telefone VARCHAR(15),
    inicio TIME NOT NULL,
    fim TIME NOT NULL,
    convenio VARCHAR(50) NOT NULL,
    consulta VARCHAR(50) NOT NULL,
    modalidade VARCHAR(20) DEFAULT 'Presencial' NOT NULL,
    frequencia VARCHAR(50) NOT NULL,
    observacoes TEXT,
    valor DECIMAL(10, 2) DEFAULT 0.00,
    color VARCHAR(20) DEFAULT 'green',
    status_pagamento ENUM('pendente', 'pago', 'cancelado') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_data_consulta (data_consulta),
    INDEX idx_nome_paciente (nome_paciente),
    INDEX idx_convenio (convenio),
    INDEX idx_color (color),
    INDEX idx_valor (valor),
    INDEX idx_status (status_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE tarefas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao TEXT NOT NULL,
    data_vencimento DATE,
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ========================================
-- 3. TABELA DE CONFIGURAÇÕES FINANCEIRAS
-- ========================================
CREATE TABLE configuracoes_financeiras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_configuracao VARCHAR(100) NOT NULL UNIQUE,
    valor_percentual DECIMAL(5, 2) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- ========================================
-- 4. TABELA DE AUDITORIA
-- ========================================
CREATE TABLE auditoria_valores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabela_origem VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    campo_alterado VARCHAR(50) NOT NULL,
    valor_antigo DECIMAL(10, 2),
    valor_novo DECIMAL(10, 2),
    usuario VARCHAR(100),
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tabela_registro (tabela_origem, registro_id),
    INDEX idx_data (data_alteracao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- ========================================
-- 5. VIEWS PARA RELATÓRIOS
-- ========================================
-- View: Resumo financeiro por status de pagamento
CREATE OR REPLACE VIEW vw_resumo_por_status AS
SELECT
    status_pagamento,
    COUNT(*) as total_agendamentos,
    SUM(valor) as valor_total,
    AVG(valor) as valor_medio,
    MIN(valor) as valor_minimo,
    MAX(valor) as valor_maximo
FROM agendamentos
GROUP BY status_pagamento;
-- View: Faturamento por convênio
CREATE OR REPLACE VIEW vw_faturamento_convenio AS
SELECT
    convenio,
    COUNT(*) as total_consultas,
    SUM(valor) as faturamento_total,
    AVG(valor) as ticket_medio,
    SUM(CASE WHEN status_pagamento = 'pago' THEN valor ELSE 0 END) as valor_recebido,
    SUM(CASE WHEN status_pagamento = 'pendente' THEN valor ELSE 0 END) as valor_pendente
FROM agendamentos
GROUP BY convenio
ORDER BY faturamento_total DESC;
-- View: Análise diária de agendamentos
CREATE OR REPLACE VIEW vw_analise_diaria AS
SELECT
    data_consulta,
    COUNT(*) as total_consultas,
    SUM(valor) as faturamento_dia,
    COUNT(DISTINCT convenio) as convenios_distintos,
    COUNT(DISTINCT nome_paciente) as pacientes_distintos
FROM agendamentos
GROUP BY data_consulta
ORDER BY data_consulta DESC;
-- View: Resumo completo do financeiro (para a página financeiro.html)
CREATE OR REPLACE VIEW vw_financeiro_completo AS
SELECT
    a.id,
    a.data_consulta,
    a.nome_paciente,
    a.telefone,
    a.inicio,
    a.fim,
    a.convenio,
    a.consulta,
    a.modalidade,
    a.valor,
    a.color,
    a.status_pagamento,
    a.observacoes,
    CASE
        WHEN a.color = 'green' THEN 'Confirmado'
        WHEN a.color = 'blue' THEN 'Desmarcado'
        WHEN a.color = 'red' THEN 'Faltou'
        ELSE 'Outro'
    END as status_consulta
FROM agendamentos a
ORDER BY a.data_consulta DESC, a.inicio ASC;
-- ========================================
-- 6. STORED PROCEDURES
-- ========================================
DELIMITER //
-- Procedure: Calcular valor com desconto
CREATE PROCEDURE sp_calcular_valor_desconto(
    IN p_valor_original DECIMAL(10,2),
    IN p_percentual_desconto DECIMAL(5,2),
    OUT p_valor_final DECIMAL(10,2)
)
BEGIN
    SET p_valor_final = p_valor_original - (p_valor_original * p_percentual_desconto / 100);
END //
-- Procedure: Aplicar impostos ao valor
CREATE PROCEDURE sp_aplicar_impostos(
    IN p_valor_bruto DECIMAL(10,2),
    OUT p_valor_impostos DECIMAL(10,2),
    OUT p_valor_liquido DECIMAL(10,2)
)
BEGIN
    DECLARE v_percentual_imposto DECIMAL(5,2);
   
    SELECT valor_percentual INTO v_percentual_imposto
    FROM configuracoes_financeiras
    WHERE nome_configuracao = 'percentual_impostos' AND ativo = TRUE
    LIMIT 1;
   
    SET v_percentual_imposto = IFNULL(v_percentual_imposto, 0);
    SET p_valor_impostos = p_valor_bruto * v_percentual_imposto / 100;
    SET p_valor_liquido = p_valor_bruto - p_valor_impostos;
END //
-- Procedure: Relatório financeiro por período
CREATE PROCEDURE sp_relatorio_periodo(
    IN p_data_inicio DATE,
    IN p_data_fim DATE
)
BEGIN
    SELECT
        DATE_FORMAT(data_consulta, '%Y-%m') as mes_ano,
        convenio,
        COUNT(*) as total_consultas,
        SUM(valor) as faturamento,
        SUM(CASE WHEN status_pagamento = 'pago' THEN valor ELSE 0 END) as recebido,
        SUM(CASE WHEN status_pagamento = 'pendente' THEN valor ELSE 0 END) as pendente
    FROM agendamentos
    WHERE data_consulta BETWEEN p_data_inicio AND p_data_fim
    GROUP BY mes_ano, convenio
    ORDER BY mes_ano DESC, faturamento DESC;
END //
DELIMITER ;
-- ========================================
-- 7. TRIGGERS DE AUDITORIA
-- ========================================
DELIMITER //
-- Trigger: Auditar alterações de valor em agendamentos
CREATE TRIGGER trg_audit_agendamentos_valor
BEFORE UPDATE ON agendamentos
FOR EACH ROW
BEGIN
    IF OLD.valor != NEW.valor THEN
        INSERT INTO auditoria_valores (
            tabela_origem,
            registro_id,
            campo_alterado,
            valor_antigo,
            valor_novo
        )
        VALUES (
            'agendamentos',
            OLD.id,
            'valor',
            OLD.valor,
            NEW.valor
        );
    END IF;
END //
-- Trigger: Auditar alterações de valor em convênios
CREATE TRIGGER trg_audit_convenios_valor
BEFORE UPDATE ON convenios
FOR EACH ROW
BEGIN
    IF OLD.valor != NEW.valor THEN
        INSERT INTO auditoria_valores (
            tabela_origem,
            registro_id,
            campo_alterado,
            valor_antigo,
            valor_novo
        )
        VALUES (
            'convenios',
            OLD.id,
            'valor',
            OLD.valor,
            NEW.valor
        );
    END IF;
END //
DELIMITER ;
-- ========================================
-- 8. INSERÇÃO DE CONFIGURAÇÕES PADRÃO
-- ========================================
INSERT INTO configuracoes_financeiras (nome_configuracao, valor_percentual, descricao) VALUES
('percentual_clinica', 50.00, 'Percentual de repasse para a clínica'),
('percentual_profissional', 50.00, 'Percentual de repasse para o profissional'),
('percentual_impostos', 15.00, 'Percentual de impostos sobre o faturamento'),
('desconto_pagamento_vista', 10.00, 'Desconto para pagamento à vista'),
('taxa_cancelamento', 20.00, 'Taxa cobrada em caso de cancelamento');
-- ========================================
-- 9. INSERÇÃO DE CONVÊNIOS DE EXEMPLO
-- ========================================
INSERT INTO convenios (nome_convenio, consulta, duracao, valor, pagamento) VALUES
('Unimed', 'Consulta Básica', '00:30:00', 150.00, 1),
('SUS', 'Consulta Gratuita', '00:30:00', 0.00, 0),
('Particular', 'Consulta Particular', '00:45:00', 200.00, 1),
('Amil', 'Consulta Especializada', '00:45:00', 180.00, 1),
('Bradesco Saúde', 'Exame de Rotina', '01:00:00', 250.00, 1),
('SulAmérica', 'Consulta Cardiológica', '00:40:00', 220.00, 1),
('Golden Cross', 'Consulta Dermatológica', '00:35:00', 190.00, 1),
('NotreDame', 'Consulta Geral', '00:30:00', 160.00, 1),
('Porto Seguro', 'Consulta Ortopédica', '00:50:00', 210.00, 1),
('Hapvida', 'Consulta Pediátrica', '00:30:00', 140.00, 1);
-- ========================================
-- 10. INSERÇÃO DE PACIENTES DE EXEMPLO
-- ========================================
INSERT INTO pacientes (nome_completo, genero, responsavel, telefone, email, data_nascimento, cpf, convenio, cep, logradouro, numero, bairro, cidade, estado, situacao) VALUES
('Ana Silva', 'F', NULL, '(11) 98765-4321', 'ana.silva@email.com', '1990-05-15', '12345678901', 'Unimed', '01234567', 'Rua das Flores', '123', 'Centro', 'São Paulo', 'SP', 'Ativo'),
('Carlos Santos', 'M', NULL, '(11) 98765-4322', 'carlos.santos@email.com', '1985-08-20', '12345678902', 'Particular', '01234568', 'Av Paulista', '456', 'Bela Vista', 'São Paulo', 'SP', 'Ativo'),
('Maria Oliveira', 'F', 'José Oliveira', '(11) 98765-4323', 'maria.oliveira@email.com', '2010-03-10', '12345678903', 'SUS', '01234569', 'Rua da Paz', '789', 'Jardim', 'São Paulo', 'SP', 'Ativo'),
('João Pedro', 'M', NULL, '(11) 98765-4324', 'joao.pedro@email.com', '1995-12-25', '12345678904', 'Amil', '01234570', 'Rua do Comércio', '321', 'Vila Nova', 'São Paulo', 'SP', 'Ativo'),
('Juliana Costa', 'F', NULL, '(11) 98765-4325', 'juliana.costa@email.com', '1988-07-18', '12345678905', 'Bradesco Saúde', '01234571', 'Av Brasil', '654', 'Jardins', 'São Paulo', 'SP', 'Ativo');
-- ========================================
-- 11. INSERÇÃO DE AGENDAMENTOS DE EXEMPLO (NOVEMBRO 2025)
-- ========================================
INSERT INTO agendamentos (data_consulta, nome_paciente, telefone, inicio, fim, convenio, consulta, modalidade, frequencia, observacoes, valor, color, status_pagamento) VALUES
-- Semana 1
('2025-11-03', 'Ana Silva', '(11) 98765-4321', '09:00:00', '09:30:00', 'Unimed', 'Consulta Básica', 'Presencial', 'Única', 'Primeira consulta', 150.00, 'green', 'pago'),
('2025-11-03', 'Carlos Santos', '(11) 98765-4322', '10:00:00', '10:45:00', 'Particular', 'Consulta Particular', 'Online', 'Única', NULL, 200.00, 'green', 'pago'),
('2025-11-03', 'Maria Oliveira', '(11) 98765-4323', '14:00:00', '14:30:00', 'SUS', 'Consulta Gratuita', 'Presencial', 'Única', 'Paciente pediátrico', 0.00, 'green', 'pago'),
('2025-11-04', 'João Pedro', '(11) 98765-4324', '09:00:00', '09:45:00', 'Amil', 'Consulta Especializada', 'Presencial', 'Única', NULL, 180.00, 'green', 'pago'),
('2025-11-04', 'Juliana Costa', '(11) 98765-4325', '11:00:00', '12:00:00', 'Bradesco Saúde', 'Exame de Rotina', 'Online', 'Única', 'Check-up anual', 250.00, 'green', 'pendente'),
('2025-11-05', 'Ana Silva', '(11) 98765-4321', '10:00:00', '10:40:00', 'SulAmérica', 'Consulta Cardiológica', 'Presencial', 'Única', 'Acompanhamento', 220.00, 'blue', 'cancelado'),
('2025-11-06', 'Carlos Santos', '(11) 98765-4322', '15:00:00', '15:35:00', 'Golden Cross', 'Consulta Dermatológica', 'Presencial', 'Única', NULL, 190.00, 'green', 'pago'),
('2025-11-07', 'Maria Oliveira', '(11) 98765-4323', '09:00:00', '09:30:00', 'NotreDame', 'Consulta Geral', 'Online', 'Única', NULL, 160.00, 'red', 'pendente'),
-- Semana 2
('2025-11-10', 'João Pedro', '(11) 98765-4324', '08:00:00', '08:50:00', 'Porto Seguro', 'Consulta Ortopédica', 'Presencial', 'Única', 'Dor nas costas', 210.00, 'green', 'pago'),
('2025-11-10', 'Juliana Costa', '(11) 98765-4325', '14:00:00', '14:30:00', 'Hapvida', 'Consulta Pediátrica', 'Presencial', 'Única', NULL, 140.00, 'green', 'pago'),
('2025-11-11', 'Ana Silva', '(11) 98765-4321', '10:00:00', '10:30:00', 'Unimed', 'Consulta Básica', 'Online', 'Única', 'Retorno', 150.00, 'green', 'pendente'),
('2025-11-12', 'Carlos Santos', '(11) 98765-4322', '09:00:00', '09:45:00', 'Particular', 'Consulta Particular', 'Presencial', 'Única', NULL, 200.00, 'green', 'pago'),
('2025-11-13', 'Maria Oliveira', '(11) 98765-4323', '11:00:00', '11:30:00', 'SUS', 'Consulta Gratuita', 'Presencial', 'Única', NULL, 0.00, 'green', 'pago'),
('2025-11-14', 'João Pedro', '(11) 98765-4324', '15:00:00', '15:45:00', 'Amil', 'Consulta Especializada', 'Online', 'Única', NULL, 180.00, 'blue', 'cancelado'),
-- Semana 3
('2025-11-17', 'Juliana Costa', '(11) 98765-4325', '09:00:00', '10:00:00', 'Bradesco Saúde', 'Exame de Rotina', 'Presencial', 'Única', NULL, 250.00, 'green', 'pago'),
('2025-11-18', 'Ana Silva', '(11) 98765-4321', '14:00:00', '14:40:00', 'SulAmérica', 'Consulta Cardiológica', 'Presencial', 'Única', NULL, 220.00, 'green', 'pago'),
('2025-11-19', 'Carlos Santos', '(11) 98765-4322', '10:00:00', '10:35:00', 'Golden Cross', 'Consulta Dermatológica', 'Online', 'Única', 'Alergia cutânea', 190.00, 'green', 'pendente'),
('2025-11-20', 'Maria Oliveira', '(11) 98765-4323', '09:00:00', '09:30:00', 'NotreDame', 'Consulta Geral', 'Presencial', 'Única', NULL, 160.00, 'green', 'pago'),
('2025-11-21', 'João Pedro', '(11) 98765-4324', '16:00:00', '16:50:00', 'Porto Seguro', 'Consulta Ortopédica', 'Presencial', 'Única', 'Retorno ortopedia', 210.00, 'red', 'pendente'),
-- Semana 4
('2025-11-24', 'Juliana Costa', '(11) 98765-4325', '08:00:00', '08:30:00', 'Hapvida', 'Consulta Pediátrica', 'Online', 'Única', NULL, 140.00, 'green', 'pago'),
('2025-11-25', 'Ana Silva', '(11) 98765-4321', '11:00:00', '11:30:00', 'Unimed', 'Consulta Básica', 'Presencial', 'Única', NULL, 150.00, 'green', 'pago'),
('2025-11-26', 'Carlos Santos', '(11) 98765-4322', '14:00:00', '14:45:00', 'Particular', 'Consulta Particular', 'Presencial', 'Única', NULL, 200.00, 'green', 'pendente'),
('2025-11-27', 'Maria Oliveira', '(11) 98765-4323', '09:00:00', '09:30:00', 'SUS', 'Consulta Gratuita', 'Presencial', 'Única', NULL, 0.00, 'green', 'pago'),
('2025-11-28', 'João Pedro', '(11) 98765-4324', '10:00:00', '10:45:00', 'Amil', 'Consulta Especializada', 'Online', 'Única', 'Consulta de rotina', 180.00, 'green', 'pago');
-- ========================================
-- 12. CONSULTAS ÚTEIS PARA TESTE
-- ========================================
-- Total de agendamentos por status
-- SELECT status_pagamento, COUNT(*) as total, SUM(valor) as valor_total FROM agendamentos GROUP BY status_pagamento;
-- Faturamento total do mês
-- SELECT SUM(valor) as faturamento_total FROM agendamentos WHERE MONTH(data_consulta) = 11 AND YEAR(data_consulta) = 2025;
-- Consultas confirmadas (verde) vs desmarcadas (azul) vs faltou (vermelho)
-- SELECT color, COUNT(*) as quantidade FROM agendamentos GROUP BY color;
-- Pacientes com mais consultas
-- SELECT nome_paciente, COUNT(*) as total_consultas, SUM(valor) as valor_total FROM agendamentos GROUP BY nome_paciente ORDER BY total_consultas DESC;
-- ========================================
-- FIM DO SCRIPT
-- ========================================
SELECT 'Banco de dados criado com sucesso!' as status;
SELECT COUNT(*) as total_convenios FROM convenios;
SELECT COUNT(*) as total_pacientes FROM pacientes;
SELECT COUNT(*) as total_agendamentos FROM agendamentos;
SELECT SUM(valor) as faturamento_total FROM agendamentos;
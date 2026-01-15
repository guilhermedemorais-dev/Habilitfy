# PRD – Módulo KYC (Validação de Identidade) – HabilitFy

## 1. Visão Geral

O módulo KYC do HabilitFy garante onboarding seguro e compliance para **instrutores** e **alunos** antes de qualquer agendamento ou transação.  
Inclui upload/documentação, selfie, checagem manual/admin, notificações, logs e integrações futuras (gov.br, CNH Digital, Detran).

---

## 2. Funcionalidades Principais

### 2.1 Onboarding do Instrutor

- Cadastro guiado, passo a passo:
    1. Dados pessoais (nome, CPF, contato)
    2. Upload de selfie (foto atual)
    3. Upload de documento oficial com foto (RG/CNH)
    4. Upload de credencial Detran válida
    5. Chave Pix para recebimento
    6. Cadastro de veículos (categoria, placa, docs, foto)
- Status por etapa: pendente, em análise, aprovado, rejeitado (com logs e motivo)
- Nenhum serviço ofertado sem KYC aprovado.

---

### 2.2 Onboarding do Aluno

- Cadastro guiado, passo a passo:
    1. Dados pessoais (nome, CPF, contato)
    2. Upload de selfie (foto atual)
    3. Upload de documento oficial com foto (RG/CNH)
    4. Upload de comprovante de aprovação na parte teórica (LADV ou similar)
    5. Indicação se já é habilitado ou não (com upload se sim)
- Status por etapa: pendente, em análise, aprovado, rejeitado (com logs e motivo)
- Só pode agendar aulas com KYC aprovado.

---

### 2.3 Triagem Manual/Admin

- Painel para admin:
    - Lista de instrutores/alunos/veículos/documentos pendentes
    - Filtros avançados (status, tipo, categoria, cidade)
    - Visualização (selfie/docs)
    - Aprovar/Rejeitar (comentário obrigatório na rejeição)
    - Logs detalhados (quem, quando, motivo)

---

### 2.4 Notificações & Suporte

- Notificações automáticas de status (email, app, WhatsApp)
- Canal de chat/suporte para dúvidas e reenvio de documentos

---

### 2.5 Auditoria & Compliance

- Todos os uploads, decisões e alterações logados
- Exportação de histórico para compliance/autoridades
- LGPD: dados protegidos, opção de exclusão pós-período

---

### 2.6 Integração Futura (Gov/Automática)

- Estrutura pronta para integração com APIs (gov.br, CNH Digital, Detran)
- Automação futura de validação documental, selfie/liveness, OCR

---

## 3. Regras Especiais

- Nenhum instrutor/aluno pode operar sem KYC aprovado.
- Qualquer atualização em documento reinicia análise.
- Logs detalhados de toda movimentação.
- Veículos só aparecem após validação.
- Dados sensíveis protegidos e auditáveis conforme LGPD.

---

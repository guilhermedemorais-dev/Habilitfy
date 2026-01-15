# PRD – Cadastro de Aluno – HabilitFy

## 1. Visão Geral

Página dedicada ao cadastro de novos alunos,  
com fluxo step-by-step, prático e mobile-first, incluindo autenticação KYC, upload de documentos e aprovação para agendamento de aulas.

---

## 2. Fluxo de Cadastro (Etapas)

### 2.1 Etapa 1: Dados Pessoais

- Campos:
    - Nome completo
    - CPF
    - Data de nascimento
    - Celular e e-mail
    - Endereço completo (CEP, cidade, bairro, rua)
- Validação de formato e obrigatoriedade
- Botão “Próximo”

---

### 2.2 Etapa 2: Foto e Documento

- Upload de **selfie** (foto recente e nítida)
- Upload de **documento oficial com foto** (RG ou CNH – frente e verso)
- Feedback de status dos uploads
- Botão “Próximo”

---

### 2.3 Etapa 3: Comprovante de Aprovação Teórica

- Upload obrigatório do **comprovante de aprovação na parte teórica** (LADV ou equivalente)
- Indicação: “Você já é habilitado?”  
    - Se SIM: upload da CNH válida (frente e verso)
    - Se NÃO: obrigatório upload do comprovante teórico
- Botão “Próximo”

---

### 2.4 Etapa 4: Confirmação e Revisão

- Exibir resumo dos dados e uploads
- Checkbox de consentimento com LGPD, termos de uso, política de privacidade
- Botão “Finalizar Cadastro”

---

## 3. Pós-Cadastro

- Mensagem de confirmação:  
    “Cadastro enviado para análise. Aguarde a validação dos seus documentos. Você será notificado por e-mail/app.”
- Status: **Pendente** até aprovação/admin
- Não pode agendar aulas até aprovação do KYC

---

## 4. UX/UI e Segurança

- Layout mobile-first, barras de progresso e feedback visual a cada etapa
- Uploads validados em tempo real antes de avançar
- Mensagens de erro claras e acessíveis

---

## 5. Observações

- Todo fluxo é auditado/logado
- Dados sensíveis protegidos (LGPD)
- Expansão futura: integração gov.br para validação automática

---
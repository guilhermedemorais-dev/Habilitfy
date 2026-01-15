# PRD – Painel do Aluno – HabilitFy

## 1. Visão Geral

Painel do aluno oferece acompanhamento total do processo de habilitação, com histórico de aulas, controle financeiro, avaliação de instrutores, funcionalidades de check-in/out e acesso a um guia atualizado de informações sobre trânsito. Tudo centralizado e fácil de usar.

---

## 2. Funcionalidades Principais

### 2.1 Editar Perfil
- Atualização de dados pessoais, foto de perfil e informações de contato
- Upload do comprovante de aprovação na parte teórica (obrigatório para liberar agendamento)
- Indicação se já é habilitado ou não
- Campos validados e logs de alterações

---

### 2.2 Histórico de Aulas
- Lista de todas as aulas agendadas/concluídas/canceladas
- Visualização detalhada por data, instrutor, tipo de serviço, status da aula
- Botões para avaliar instrutor após cada aula concluída

---

### 2.3 Check-in/Check-out (Aula Prática)
- Botão de **Check-in** (no início da aula, via QR Code gerado pelo instrutor)
- Botão de **Check-out** (no fim da aula, gera QR Code para o instrutor ler)
- Fluxo: só é possível concluir aula e liberar pagamento após check-in/out confirmado
- Logs disponíveis para consulta/administração em caso de disputa

---

### 2.4 Carteira do Aluno (Financeiro)
- Visualização de saldo, histórico de transações, status de pagamentos e reembolsos
- Extrato detalhado de cada transação (pagamentos, estornos, créditos recebidos)
- Solicitação de reembolso quando aplicável

---

### 2.5 Guia do Aluno
- Página dinâmica, editável pelo admin, com tópicos sobre:
    - Leis de trânsito, novidades, dicas, links úteis, simulados, vídeos e materiais extras
    - Links podem ser inseridos/atualizados sem intervenção de dev

---

### 2.6 Avaliação de Instrutores
- Após cada aula concluída, aluno recebe notificação para avaliar instrutor
- Avaliação via nota e comentário (visível para admin e no perfil público do instrutor)
- Só é possível avaliar após confirmação do check-out

---

### 2.7 Primeira Aula Avaliativa e Pacote de Aulas

- **Primeira aula marcada** com um instrutor é obrigatoriamente avaliativa.
- Após esta aula, o aluno recebe no painel o resultado da avaliação feita pelo instrutor, indicando pontos fortes e pontos a desenvolver.
- O sistema apresenta ao aluno uma sugestão de pacote de aulas, com base na avaliação inicial (ex: “Recomendamos 10 aulas práticas para o seu perfil”).
- Aluno pode optar por contratar o pacote sugerido ou seguir agendando individualmente.
- Histórico da avaliação e justificativa ficam disponíveis no painel para acompanhamento.

---

## 3. Regras Especiais

**Agendamento só liberado** após upload e aprovação do comprovante de parte teórica.
- Usuários não habilitados devem obrigatoriamente informar status e enviar documento.
- **Primeira aula é sempre avaliativa e gera sugestão automática de pacote.**
- **Taxa mínima:** Cada agendamento de aula pelo aluno inclui cobrança de uma taxa mínima de serviço (valor configurável no painel admin, visível para o aluno antes da confirmação).
- Fluxo antifraude: logs completos de operações críticas (cadastro, check-in/out, avaliações, uploads)
- Dados sensíveis (documentos, comprovantes) protegidos conforme LGPD.
**Agendamento só liberado** após upload e aprovação do comprovante de parte teórica.
- Usuários não habilitados devem obrigatoriamente informar status e enviar documento.
- **Primeira aula é sempre avaliativa e gera sugestão automática de pacote.**
- **Taxa mínima:** Cada agendamento de aula pelo aluno inclui cobrança de uma taxa mínima de serviço (valor configurável no painel admin, visível para o aluno antes da confirmação).
- Fluxo antifraude: logs completos de operações críticas (cadastro, check-in/out, avaliações, uploads)
- Dados sensíveis (documentos, comprovantes) protegidos conforme LGPD.
**Agendamento só liberado** após upload e aprovação do comprovante de parte teórica.
- Usuários não habilitados devem obrigatoriamente informar status e enviar documento.
- **Primeira aula é sempre avaliativa e gera sugestão automática de pacote.**
- **Taxa mínima:** Cada agendamento de aula pelo aluno inclui cobrança de uma taxa mínima de serviço (valor configurável no painel admin, visível para o aluno antes da confirmação).
- Fluxo antifraude: logs completos de operações críticas (cadastro, check-in/out, avaliações, uploads)
- Dados sensíveis (documentos, comprovantes) protegidos conforme LGPD.
**Agendamento só liberado** após upload e aprovação do comprovante de parte teórica.
- Usuários não habilitados devem obrigatoriamente informar status e enviar documento.
- **Primeira aula é sempre avaliativa e gera sugestão automática de pacote.**
- **Taxa mínima:** Cada agendamento de aula pelo aluno inclui cobrança de uma taxa mínima de serviço (valor configurável no painel admin, visível para o aluno antes da confirmação).
- Fluxo antifraude: logs completos de operações críticas (cadastro, check-in/out, avaliações, uploads)
- Dados sensíveis (documentos, comprovantes) protegidos conforme LGPD.
**Agendamento só liberado** após upload e aprovação do comprovante de parte teórica.
- Usuários não habilitados devem obrigatoriamente informar status e enviar documento.
- **Primeira aula é sempre avaliativa e gera sugestão automática de pacote.**
- **Taxa mínima:** Cada agendamento de aula pelo aluno inclui cobrança de uma taxa mínima de serviço (valor configurável no painel admin, visível para o aluno antes da confirmação).
- Fluxo antifraude: logs completos de operações críticas (cadastro, check-in/out, avaliações, uploads)
- Dados sensíveis (documentos, comprovantes) protegidos conforme LGPD.

---

## 4. Observações

- Menu intuitivo, acesso rápido a todas funções principais.
- Notificações para lembretes de aula, pagamentos, avaliações pendentes e novidades do guia.
- Permite integração futura com simulados/teoria online.
- Visualização de suporte/chat para dúvidas (opcional).

---
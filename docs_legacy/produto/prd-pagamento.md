# PRD – Módulo de Pagamento – HabilitFy

## 1. Visão Geral

Módulo responsável por toda a experiência de pagamento da plataforma,  
incluindo agendamento de aulas, split automático entre instrutor e plataforma, cobranças, reembolsos, histórico e integração com gateway externo.

---

## 2. Funcionalidades Principais

### 2.1 Checkout e Cobrança

- Ao agendar aula, o aluno acessa tela de pagamento
- Exibe resumo do serviço: valor da aula, taxa mínima da plataforma (destacada), dados do instrutor e opção de selecionar veículo
- **Formas de pagamento:**  
    - Pix (QR Code ou cópia e cola)
    - Cartão de crédito (se habilitado no gateway)
- Campos obrigatórios para pagamento (nome, CPF, e-mail do pagador)

---

### 2.2 Split de Pagamento e Taxas

- Split automático:  
    - Percentual ou valor fixo definido pelo admin no painel
    - Repasse retido em carteira e liberado apenas após conclusão da aula (regra estilo Uber)
- Exibe detalhamento para ambos (instrutor e aluno):  
    - Valor total, valor recebido pelo instrutor, comissão/taxa retida pela plataforma
- Regra de liberação (estilo Uber):
    - Pagamento fica em custódia até a aula ser concluída (check-in e check-out confirmados)
    - Ao concluir a aula, o valor líquido é creditado na carteira do instrutor
    - Em caso de disputa/reembolso, o valor permanece retido até decisão do admin

---

### 2.3 Processamento & Status

- Status do pagamento: **Pendente**, **Pago**, **Cancelado**, **Expirado**
- Booking/agenda só confirmado após status **Pago**
- Atualização automática via webhook do gateway
- Em caso de falha/cancelamento, permite reenvio de pagamento

---

### 2.4 Histórico Financeiro

- Aluno: extrato de pagamentos, aulas agendadas e concluídas, reembolsos se aplicável
- Instrutor: extrato de ganhos, comissões, saques e histórico detalhado de cada aula/pagamento

---

### 2.5 Reembolsos e Estornos

- Fluxo para solicitação de reembolso pelo aluno (por aula cancelada, não realizada, etc)
- Aprovação manual/admin e registro do motivo
- Valor reembolsado para a carteira do aluno ou via gateway externo, conforme política
- Regras de disputa/reembolso:
    - Solicitação disponível até 48h após a aula prevista ou imediatamente em caso de não comparecimento
    - Tipos de solicitação: não realizada, conduta inadequada, cobrança indevida, outro
    - Status do reembolso: **Aberto**, **Em análise**, **Aprovado**, **Negado**, **Reembolsado**
    - Se o pagamento estiver retido, o valor é devolvido antes do repasse ao instrutor
    - Se já houve repasse, o reembolso vira débito na carteira do instrutor (saldo negativo permitido)
    - SLA de decisão: até 5 dias úteis
    - Logs obrigatórios: motivo, provas anexadas, decisão e usuário admin responsável

---

### 2.6 Saques do Instrutor

- Solicitação de saque dos valores disponíveis para o instrutor (chave Pix)
- Resumo de valores disponíveis, pendentes, já pagos
- Aprovação/admin opcional para grandes valores
- Regras de saque:
    - Somente saldo disponível (após conclusão da aula e sem disputa aberta)
    - Valor mínimo por saque: R$ 50,00
    - Janela de saque: D+1 após conclusão da aula
    - Status do saque: **Pendente**, **Aprovado**, **Rejeitado**, **Processado**
    - Rejeição exige motivo obrigatório e gera bloqueio temporário de 7 dias para novo saque
    - Histórico de saques visível para instrutor e admin, com logs

---

### 2.7 Integração com Gateway Externo

- Integração (ex: AbacatePay, MercadoPago, etc) via API
- Webhook para atualizar status, reconciliar pagamentos e repasses
- Campo/config de API key e dados sensíveis editável no painel admin
- Suporte a feature flag para alternar entre mock e gateway real no MVP

---

## 3. Regras Especiais

- Nenhuma aula agendada é confirmada sem status **Pago**
- Comissão/taxa da plataforma é sempre destacada antes do pagamento
- Logs detalhados de toda transação, para auditoria/compliance
- Dados sensíveis protegidos, conformidade LGPD
- Repasse ao instrutor somente após conclusão da aula e confirmação de check-in/out

---

## 4. Observações

- Layout do checkout simples, responsivo e seguro
- Mensagens claras de status para aluno/instrutor em todas as etapas
- Pronto para múltiplos gateways e expansão de métodos no futuro

---

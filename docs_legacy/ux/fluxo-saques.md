# Fluxo – Saques & Carteira (Instrutor/Aluno)

## 1. Acesso

- Menu lateral ou dashboard (“Carteira”, “Financeiro” ou botão “Sacar Pix”)
- Exibe saldo disponível para saque, saldo em processamento e histórico de transações

---

## 2. Solicitação de Saque

- Instrutor/Aluno clica em “Sacar Pix” ou “Solicitar Saque”
- Tela/modal de confirmação: exibe valor disponível, campos para selecionar valor total ou parcial
- Confirmação dos dados de pagamento (chave Pix já cadastrada no perfil, editável caso necessário)
- Exibe resumo da taxa de saque/transação (configurada no painel admin)

---

## 3. Processamento

- Após confirmação, transação entra em status “Pendente de Aprovação”
- Backoffice/admin pode aprovar, rejeitar ou pedir mais informações/documentos via painel admin
- Notificação push/email/in-app ao usuário sobre status (pendente, aprovado, rejeitado, pago)

---

## 4. Histórico de Transações

- Lista com todas transações: data, valor, status (pendente, processando, concluído, rejeitado), taxa aplicada
- Opção de filtrar por período, status, tipo (entrada, saque, estorno)
- Detalhe de cada transação: ID, data/hora, tipo de serviço, saldo após movimentação

---

## 5. Regras de Saque

- Saque mínimo configurável no admin
- Prazo de liquidação configurável (ex: D+1, D+2 úteis)
- Não permite saque se houver pendências KYC ou dados bancários incompletos
- Logs completos de requisições, alterações e aprovações (auditoria)

---

## 6. Exceções & Disputas

- Saque rejeitado: exibe motivo e instrução para regularização (dados, KYC, documentação)
- Se houver disputa aberta ou bloqueio administrativo, saldo fica retido até resolução
- Histórico mostra tentativas e logs de disputa

---

## 7. Segurança & Compliance

- Notificações de todas movimentações (email/app)
- Todos os saques validados por dupla autenticação (admin e sistema)
- Dados sensíveis criptografados e mascarados no front
- Logs exportáveis e rastreáveis para compliance LGPD

---

## 8. Observações

- Integração pronta para múltiplos gateways (AbacatePay, Mercado Pago, outros), configurável via painel admin
- Possibilidade futura: agendamento de saques automáticos, split payments, alertas de saldo baixo

---


[Dashboard Admin]
 └──> [Menu Financeiro/Pagamentos]

[Financeiro/Pagamentos]
 ├──> [Resumo: faturamento total, saques pendentes, pagamentos por período, taxa de aprovação, volume de transações, receita plataforma]
 ├──> [Filtros: período, tipo de transação (aula, saque, reembolso, estorno), status (pendente, pago, cancelado, estornado, aguardando liberação)]
 ├──> [Busca: por aluno, instrutor, booking, valor, status, Pix, data]

1. [Listagem de Transações]
   ├──> [Lista todas as transações: aula, saque, reembolso, taxas, afiliados, cupons]
   │      ├──> [Seleciona transação] → [Detalhes da transação]
   │             ├──> [Ver logs: status, alterações, timestamps, IP, usuário admin responsável]
   │             ├──> [Ver comprovantes anexados]
   │             ├──> [Aprovar/recusar (saque/reembolso)]
   │             ├──> [Forçar estorno/recuperação manual]
   │             ├──> [Notificar envolvidos (email, push, WhatsApp)]
   │             ├──> [Exportar recibo/comprovante]
   │             └──> [Retornar para lista, buscar novo]
   ├──> [Bulk actions: exportar, aprovar/reprovar múltiplos, filtrar, reprocessar]
   ├──> [Logs de todas operações financeiras]
   ├──> [Exportação CSV/Excel/planilha financeira]

2. [Saques de Instrutores]
   ├──> [Lista de solicitações de saque (pendente, pago, recusado)]
   │      ├──> [Ver detalhes: instrutor, valor, chave Pix, data, histórico de saques anteriores]
   │      ├──> [Aprovar (gatilha transação via gateway)]
   │      ├──> [Recusar (motivo obrigatório, bloqueio temporário de saque)]
   │      ├──> [Notificar instrutor (decisão, motivo, comprovante)]
   │      ├──> [Logs: timestamps, usuário admin responsável]
   │      └──> [Retornar, buscar novo]
   ├──> [Histórico completo de saques]
   ├──> [Exportação, auditoria]

3. [Reembolsos e Estornos]
   ├──> [Listar solicitações de reembolso (motivo, status, valor, booking relacionado)]
   │      ├──> [Ver detalhes: aluno, aula, motivo, logs, histórico de disputas]
   │      ├──> [Aprovar reembolso (valor liberado para carteira aluno ou devolvido via gateway)]
   │      ├──> [Recusar (motivo obrigatório, notificação ao aluno)]
   │      ├──> [Forçar estorno, log manual]
   │      ├──> [Anexar comprovantes, histórico do caso]
   │      ├──> [Logs de cada decisão]
   │      └──> [Retornar]
   ├──> [Histórico completo de reembolsos/estornos]
   ├──> [Exportação para auditoria]

4. [Comissões, Taxas, Afiliados e Cupons]
   ├──> [Configurar taxa global da plataforma (%/valor fixo), taxa mínima do aluno, taxa de saque]
   ├──> [Histórico de alterações de taxas]
   ├──> [Relatório de receita por taxas/comissões]
   ├──> [Relatório de ganhos por afiliado/campanha de cupom]
   ├──> [Ajustar/atualizar taxas, ativar/desativar promoções]
   ├──> [Logs de alteração, rollback/desfazer]

5. [Logs e Auditoria Financeira]
   ├──> [Registro de todas as operações: aprovações, recusas, alterações, saques, estornos, comissões]
   ├──> [Filtro por data, usuário, tipo de ação, valor, status]
   ├──> [Exportar logs, relatórios para auditoria externa]

6. [Falhas, Exceções e Retornos]
   ├──> [Erros de integração com gateway (logs, notificações, reprocessamento manual)]
   ├──> [Falha de pagamento: feedback, permitir retry, opção de contato/suporte rápido]
   ├──> [Bloqueio temporário de saque (motivo: suspeita, documentação, compliance)]
   ├──> [Rollback em caso de falha, logs completos]
   ├──> [Feedback visual e push/email em toda mudança relevante]

7. [Integrações e Configuração de Gateways]
   ├──> [Adicionar/editar/remover chaves/API key de gateways de pagamento (AbacatePay, MercadoPago, outros)]
   ├──> [Configurar callbacks, webhooks, endpoints, ambiente (prod/dev)]
   ├──> [Testar integração, logs de falha/sucesso]
   ├──> [Voltar/menu lateral]

8. [Relatórios e Exportação]
   ├──> [Gerar relatórios financeiros completos (por período, status, usuário, serviço, instrutor)]
   ├──> [Exportar relatórios para contabilidade/auditoria]
   ├──> [Visualização gráfica de volume, receita, aprovação, estornos]

9. [Retorno/menu]
   ├──> [Retornar a qualquer módulo pelo menu lateral]
   ├──> [Cancelar ação volta para última tela sem perder informações]
   ├──> [Confirmação antes de sair de operações sensíveis]

---

**Fluxos paralelos e logs**
- Toda ação logada (quem, quando, o que, motivo, decisão)
- Notificações automáticas para envolvidos em saques, reembolsos, erros, decisões admin
- Logs de falha acessíveis para suporte rápido

---




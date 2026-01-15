[Dashboard Admin]
 └──> [Menu Disputas / Reclamações]

[Disputas / Reclamações]
 ├──> [Lista de disputas: status (aberta, em análise, finalizada, aguardando info, aguardando reembolso, bloqueada)]
 ├──> [Busca por ID, usuário (aluno/instrutor), booking, motivo, status, data]

1. [Abertura de Disputa]
   ├──> [Iniciada por aluno/instrutor/admin]
   │      ├──> [Seleção de motivo: aula não realizada, conduta, cobrança indevida, problema no pagamento, outro]
   │      ├──> [Campo para relato detalhado e upload de evidências (prints, recibos, áudio, vídeo)]
   │      ├──> [Confirmação de abertura → status: aberta, notificação para admin e parte oposta]
   │      ├──> [Disputa registrada com timestamp, logs e número de caso]
   │      └──> [Gatilho de bloqueio temporário de repasse (se valor ainda não sacado), logs]

2. [Análise e Troca de Mensagens]
   ├──> [Admin analisa: tela mostra todas evidências, histórico de booking, mensagens, logs de aula, status de check-in/out]
   ├──> [Possibilidade de solicitar mais informações (para aluno/instrutor)]
   │      ├──> [Usuário recebe notificação e mensagem dentro do app/email/WhatsApp]
   │      ├──> [Responde, anexa novas evidências, logs de resposta]
   │      ├──> [Tudo registrado e visível para admin]
   ├──> [Troca de mensagens (chat dedicado por disputa): admin ↔ aluno ↔ instrutor]
   ├──> [Admin pode envolver suporte especializado/terceiros, registrar comentários internos (invisíveis para partes)]
   └──> [Logs de cada mensagem, anexo, visualização]

3. [Decisão Admin]
   ├──> [Admin revisa todos dados, mensagens, evidências]
   ├──> [Opções de decisão:]
   │      ├──> [Manter status quo (sem alteração, encerra disputa)]
   │      ├──> [Aprovar reembolso total/parcial ao aluno (valor volta para carteira ou é estornado via gateway)]
   │      ├──> [Liberar valor ao instrutor (com justificativa, logs)]
   │      ├──> [Bloquear usuário (aluno/instrutor) se fraude confirmada]
   │      ├──> [Aplicar advertência, bloquear temporário, marcar conta para monitoramento]
   │      ├──> [Solicitar mais documentos, adiar decisão]
   │      └──> [Encerrar disputa, registrar decisão final]
   ├──> [Todas decisões são logadas com justificativa, timestamp e admin responsável]
   ├──> [Notificação automática enviada a todas partes sobre resultado]
   ├──> [Decisão pode ser revertida/ajustada, sempre com log de alteração]
   └──> [Caso precise de escalonamento, encaminhar para suporte avançado/área jurídica (log de encaminhamento)]

4. [Histórico de Disputas]
   ├──> [Visualizar histórico completo de cada disputa, inclusive finalizadas]
   ├──> [Logs de todas ações e decisões]
   ├──> [Filtro por status, usuário, data, tipo de disputa]
   ├──> [Exportação para auditoria]

5. [Falhas, Exceções e Fluxos Paralelos]
   ├──> [Se usuário não responde em X dias, admin pode decidir unilateralmente]
   ├──> [Notificações automáticas de cada mudança de status/decisão]
   ├──> [Feedback visual (toast, push, email)]
   ├──> [Logs de tentativas de contato, erros de envio]
   ├──> [Permitir comentários internos sigilosos, para suporte/admin]
   ├──> [Rollback de decisão em caso de erro (exigindo nova justificativa)]

6. [Retorno/Navegação]
   ├──> [Voltar ao menu lateral/dashboard]
   ├──> [Cancelar ação retorna à tela anterior, sem perder histórico]
   ├──> [Opção de sair/confirmação de navegação se alteração pendente]

---

**Ações paralelas, logs e notificações**
- Toda interação registrada, auditável, com quem fez o quê e quando
- Notificações automáticas por app, email, WhatsApp para todas mudanças importantes
- Decisão e logs exportáveis para contabilidade/jurídico
- Chat e anexo de evidências ilimitados

---

Esse é o **fluxo real, sem atalhos, do módulo de Disputas/Reclamações/Administração de conflitos** do HabilitFy.

Se quiser, sigo para próximo fluxo (ex: KYC, saque, afiliados, etc) — só direcionar!

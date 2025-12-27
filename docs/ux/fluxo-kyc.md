[Página de Cadastro - Aluno/Instrutor]
 ├──> [Formulário de dados básicos: nome, CPF, endereço, email, celular]
 ├──> [Upload de selfie]
 ├──> [Upload de documento (RG/CNH, comprovante de endereço)]
 ├──> [Upload de comprovante de aprovação teórica (aluno) ou credencial Detran, CRLV, docs do veículo (instrutor)]
 ├──> [Confirmação de envio] → [Status: “KYC em análise”]
 └──> [Feedback visual: documentos recebidos, prazo estimado de análise]

1. [Análise Manual Admin]
   ├──> [Admin acessa módulo KYC (lista de pendências)]
   ├──> [Seleciona usuário (aluno/instrutor) para análise]
   │      ├──> [Visualiza docs enviados, fotos, logs, histórico de tentativas]
   │      ├──> [Comparação de selfie vs doc, checagem OCR]
   │      ├──> [Conferência de autenticidade de docs, dados cruzados com cadastro]
   │      ├──> [Opções:]
   │             ├──> [Aprovar KYC] → [Usuário recebe notificação de aprovação, acesso liberado a agendamento/aulas]
   │             ├──> [Rejeitar KYC] → [Usuário recebe notificação, motivo explícito, desbloqueia tela para reenvio/correção]
   │             ├──> [Solicitar complemento: novo doc, foto melhor, atualização]
   │             └──> [Bloquear usuário: motivo obrigatório, gera log]
   │      ├──> [Logs: cada ação de admin registrada]
   │      └──> [Opção de retornar para lista/voltar ao dashboard]

2. [Fluxo de Exceção]
   ├──> [Usuário faz upload de doc inválido/foto ruim/dados inconsistentes]
   │      ├──> [KYC rejeitado: usuário vê mensagem, motivo, instrução para novo upload]
   │      ├──> [Permite múltiplas tentativas, logs de cada tentativa]
   │      ├──> [Após X reprovações, bloqueio temporário e mensagem de suporte/admin]
   ├──> [Admin pode resetar/bloquear/desbloquear status KYC manualmente]
   ├──> [Usuário só pode avançar para booking (aluno) ou ofertar serviços (instrutor) se KYC aprovado]
   ├──> [Toda tentativa de agendamento/cadastro serviço com KYC pendente = bloqueio + feedback visual + CTA para corrigir docs]
   └──> [Notificações automáticas por email/app/push em toda alteração de status KYC]

3. [Histórico e Logs]
   ├──> [Admin pode ver histórico completo de envios, rejeições, aprovações, logs de alteração]
   ├──> [Usuário pode ver todas tentativas, status atual, orientações]
   ├──> [Logs exportáveis para compliance/auditoria]
   ├──> [Possibilidade de auditoria periódica (revalidação), especialmente para instrutores]

4. [Retornos e Navegação]
   ├──> [Usuário pode cancelar cadastro/pausar e retornar depois, mantendo docs salvos (rascunho)]
   ├──> [Opção de retornar para menu lateral/dashboard a qualquer momento]
   ├──> [Feedback visual para cada ação, opção de suporte rápido/chat para dúvidas sobre documentação]

---

**Ações paralelas, logs e segurança**
- Toda ação logada (quem, quando, o que, motivo, decisão)
- Notificações automáticas para usuário e admin a cada mudança de status
- Logs de erro/falha de upload acessíveis para suporte
- Permite adaptação para integração futura (OCR automático, consulta a base pública gov.br etc)

---



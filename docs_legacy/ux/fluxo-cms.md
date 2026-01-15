[Dashboard Admin]
 └──> [Menu CMS/Conteúdo]

[CMS/Conteúdo]
 ├──> [Banners e Promoções]
 │     ├──> [Lista de banners/promos atuais, futuros, expirados]
 │     ├──> [Criar novo banner]
 │     │      ├──> [Upload imagem, título, subtítulo, link de ação, cor de fundo, validade (início/fim), prioridade, destino de clique]
 │     │      ├──> [Preview do banner antes de publicar]
 │     │      ├──> [Agendar publicação futura, salvar rascunho, publicar agora]
 │     │      └──> [Salvar/ativar/cancelar – feedback visual]
 │     ├──> [Editar banner existente]
 │     │      ├──> [Alterar texto, imagem, validade, prioridade, link, etc.]
 │     │      └──> [Salvar/desfazer/cancelar, feedback, logs de alteração]
 │     ├──> [Remover/desativar banner]
 │     │      ├──> [Confirmação antes de remover]
 │     │      └──> [Remoção/desativação registrada em log]
 │     └──> [Histórico de banners (publicados, editados, excluídos), busca/filtro por período/status]

 ├──> [Guia do Aluno / Materiais de Apoio]
 │     ├──> [Lista de tópicos, simulados, vídeos, textos, links externos]
 │     ├──> [Criar novo tópico/guia]
 │     │      ├──> [Título, conteúdo rico (editor WYSIWYG), anexos (PDF, vídeo, imagem), links]
 │     │      ├──> [Definir ordem/posição, categoria, tags]
 │     │      ├──> [Salvar/preview/publicar/agendar, rascunho]
 │     │      └──> [Logs de criação/edição]
 │     ├──> [Editar tópico/guia]
 │     │      ├──> [Atualizar conteúdo, anexos, títulos, links, ordem]
 │     │      └──> [Salvar/desfazer, logs]
 │     ├──> [Remover/desativar tópico]
 │     │      ├──> [Confirmação de exclusão, registro no log]
 │     └──> [Histórico de tópicos (todos status), busca/filtro]

 ├──> [Textos Institucionais (Política, Termos, Rodapé, FAQ)]
 │     ├──> [Editar texto de política de privacidade, termos de uso, rodapé, páginas obrigatórias LGPD]
 │     ├──> [Editar/formatar FAQ (pergunta/resposta), ativar/desativar perguntas]
 │     ├──> [Salvar/preview/publicar]
 │     ├──> [Histórico de versões, rollback/desfazer alterações]
 │     └──> [Log completo de cada alteração]

 ├──> [Anúncios e Comunicados]
 │     ├──> [Criar/editar/remover comunicado/banner especial]
 │     ├──> [Agendar envio, selecionar público alvo (alunos, instrutores, ambos)]
 │     ├──> [Escolher formato (banner, pop-up, notificação push, email)]
 │     ├──> [Salvar, preview, publicar]
 │     └──> [Histórico de envios, logs de leitura]

 ├──> [Uploads e Assets]
 │     ├──> [Upload e gerenciamento de imagens, vídeos, PDFs, arquivos estáticos]
 │     ├──> [Buscar, filtrar, deletar, renomear, visualizar asset]
 │     └──> [Logs de upload/alteração/exclusão]

 ├──> [Histórico e Auditoria]
 │     ├──> [Log de todas ações (criação, edição, exclusão, publicação, agendamento)]
 │     ├──> [Filtro por usuário admin, data, tipo de ação, conteúdo alterado]
 │     ├──> [Exportar histórico]

 ├──> [Retorno/volta]
 │     ├──> [Acesso a qualquer momento ao menu lateral, retorno para dashboard admin]
 │     ├──> [Cancelar ação volta para última tela segura, sem perder conteúdo salvo]
 │     └──> [Modal de confirmação para sair sem salvar, se houver alteração pendente]

 ├──> [Falhas e Exceções]
 │     ├──> [Erros de upload/asset (feedback, re-tentar)]
 │     ├──> [Conflito de edição (lock para evitar overwrite)]
 │     ├──> [Logs de falha e opção de suporte]
 │     ├──> [Rollback/desfazer em caso de erro]
 │     └──> [Mensagens de status e notificação push/email para time se falha crítica]

---

**Ações paralelas, logs e integrações**
- Toda ação é logada (quem, o que, quando, onde, antes/depois)
- Mudanças visíveis em tempo real para usuários do app (banners, guias)
- CMS preparado para múltiplos admins operando em paralelo (controle de concorrência)
- Permite upload de imagens para banners/notícias direto de repositórios externos (Google Drive, S3)
- CMS integrado ao sistema de notificações/admin: toda publicação ou alteração importante pode ser comunicada via push/email.

---




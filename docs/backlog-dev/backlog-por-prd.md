# Backlog Derivado dos PRDs

Checklist de entregas por PRD (todos os itens começam pendentes; marcar conforme implementação real).  
Fontes: `docs/produto/*.md`.

## Página Home/Landing (`prd-pg-home.md`)
- [ ] Header com CTAs “Encontrar Instrutor” e “Quero Dar Aulas” navegando para busca/cadastros.
- [ ] Hero com busca por CEP/bairro, badge promo e CTA duplo (aluno/instrutor).
- [ ] Blocos de benefícios (aluno/instrutor), depoimentos slider e seção “Como funciona”.
- [ ] FAQ resumido e rodapé com links institucionais/redes; conteúdo editável via CMS.
- [ ] Analytics básico de cliques/CTAs e compatibilidade mobile-first.

## Página de Login Global (`prd-pg-login-global.md`)
- [ ] Tela de login com email/senha, feedback de erro e bloqueio após tentativas falhas.
- [ ] Links “Esqueci minha senha” e CTAs diretos “Cadastrar Aluno”/“Cadastrar Instrutor”.
- [ ] Redirecionar usuário autenticado direto para dashboard correto.
- [ ] LGPD/termos no rodapé e acessibilidade WCAG.

## Cadastro de Aluno (`prd-cadatro-aluno.md`)
- [ ] Fluxo step-by-step (dados pessoais → selfie/documento → comprovante teórico/CNH → revisão).
- [ ] Uploads validados, salvamento de progresso e status de etapa (pendente/análise/aprovado/rejeitado).
- [ ] Bloquear agendamento até KYC aprovado; logs e proteção LGPD.
- [ ] Notificações de status (email/app) e suporte para reenvio de documentos.

## Cadastro de Instrutor (`prd-cadastro-instrutor.md`)
- [ ] Fluxo step-by-step (dados pessoais → selfie/docs/Credencial Detran → chave Pix → veículos → serviços → revisão).
- [ ] Validação de uploads e formatos; status por etapa; consentimento LGPD.
- [ ] Cadastro de múltiplos veículos com uploads obrigatórios e status pendente até aprovação.
- [ ] Resumo final, salvamento parcial e notificação “cadastro enviado para análise”.

## Painel do Aluno (`prd-aluno.md`)
- [ ] Edição de perfil com upload de comprovante teórico e indicação de habilitado/não.
- [ ] Histórico de aulas com detalhes e avaliações pós-aula; bloqueio de agendar sem KYC.
- [ ] Check-in/out via QR Code integrando à liberação de pagamento.
- [ ] Carteira do aluno (saldo, extrato, reembolsos) e taxa mínima visível antes do agendamento.
- [ ] Guia do Aluno dinâmico (conteúdo do CMS) e notificações de lembretes/avaliações pendentes.
- [ ] Primeira aula avaliativa com exibição da recomendação de pacote de aulas.

## Painel do Instrutor (`prd-instrutor.md`)
- [ ] Dashboard de recebíveis/transações com filtros e comprovantes.
- [ ] CRUD de serviços ofertados por categoria com preço/hora e ativar/desativar.
- [ ] Cadastro/validação de veículos por categoria (status pendente/aprovado/rejeitado).
- [ ] Histórico de aulas com check-in/out via QR code (liberações 50/50) e logs.
- [ ] Chat aluno↔instrutor pós-booking e cadastro de pontos de encontro.
- [ ] Perfil: upload de foto, chave Pix com histórico de alterações, notificações de validação/pagamento.
- [ ] Fluxo da primeira aula avaliativa e sugestão de pacote exibida ao aluno.

## Mapa/Listagem (`prd-maps-lista.md`)
- [ ] Alternar mapa/lista com filtros (nota, preço, veículo, localidade, tipo de serviço).
- [ ] Mostrar apenas instrutores aprovados/KYC ok com dados básicos e distância.
- [ ] Persistir filtros/posição do mapa e botão “Atualizar resultados”.
- [ ] Perfil do instrutor inclui links Instagram/YouTube; dados sensíveis só após booking/pagamento.

## Pagamentos (`prd-pagamento.md`)
- [ ] Checkout com resumo da aula, taxa da plataforma e opções Pix/cartão (gateway).
- [ ] Implementar split (config admin) e refletir valores para instrutor/plataforma.
- [ ] Status de pagamento (pendente/pago/cancelado/expirado) com webhook e reenvio em caso de falha.
- [ ] Extrato financeiro para aluno e instrutor (ganhos, saques, reembolsos).
- [ ] Fluxo de reembolso com aprovação/admin e opção de crédito em carteira.
- [ ] Saques do instrutor via Pix e configuração de gateway/feature flag mock vs real.

## Admin – Painel Geral (`prd-admin.md`)
- [ ] Dashboard com mapa agregando usuários por estado/cidade, cards de KPIs e gráfico financeiro.
- [ ] Listas gerenciáveis de instrutores e alunos (filtros, editar dados, banir/bloquear, reset senha).
- [ ] Perfil detalhado com documentos, veículos, histórico de aulas/avaliações, saldo e logs de ações.
- [ ] Timeline KYC com aprovação/rejeição por documento e reanálise; notificações automáticas.
- [ ] Gestão financeira: configurar gateway, transações em tempo real, carteiras, reembolsos, relatórios.
- [ ] Monitoramento do sistema (health, alertas), logs de eventos e incidentes.
- [ ] Permissões granulares por papel (admin/financeiro/suporte/KYC) e auditoria completa.
- [ ] Comunicação: chat interno admin↔usuários e central de notificações segmentadas/agendadas.

## Admin – KYC (`prd-admin-kyc.md`)
- [ ] Painel de triagem com filtros por tipo/status/cidade e visualização de uploads.
- [ ] Aprovar/rejeitar com comentário obrigatório, logs e notificações.
- [ ] Reprocessar análise quando documentos forem reenviados; LGPD e exportação de histórico.
- [ ] Preparar ganchos para integrações futuras (gov.br/CNH Digital/Detran).

## Admin – CMS (`prd-admin-cms.md`)
- [ ] CRUD de banners (upload, período, ordem, preview e publicar/despublicar).
- [ ] Editor de textos institucionais com histórico de versões e preview (política/termos/rodapé).
- [ ] Guia do Aluno dinâmico com ordenação drag & drop e agendamento de tópicos.
- [ ] Notificações globais (segmento, agendamento, histórico/log).
- [ ] Branding visual (logo, favicon, cores) aplicável sem deploy e com permissões.

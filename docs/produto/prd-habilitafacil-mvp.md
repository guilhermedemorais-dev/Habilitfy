# PRD – HabilitaFácil MVP

## 1. Visão Geral
- **Nome:** HabilitaFácil  
- **Tipo:** Web App (PWA-ready), marketplace on-demand para aulas de direção.  
- **Contexto legal:** Resolução Contran nº 1.023/2025 (instrutores autônomos credenciados) e CTB.  
- **Modelos de referência:** Uber + app DRIVEx (EUA), adaptado ao Brasil (Pix, WhatsApp, LGPD).

## 2. Objetivos do MVP
- Alunos do RJ encontram instrutores próximos, agendam aulas, pagam online e recebem dados de contato/veículo.
- Metas: 100–150 instrutores cadastrados e ~100 alunos até jan/2026.
- Validar o fluxo fim-a-fim: mapa → seleção de horário → pagamento → contato WhatsApp → aula concluída.
- Go-live alvo: 20/12/2025 (MVP funcional).

## 3. Escopo IN do MVP
- **Módulo Aluno**
  - Cadastro/login via OIDC (sessão).
  - Descoberta de instrutores (lista/mapa), filtros básicos (status aprovado, bairro/lat-lng opcional).
  - Perfil do instrutor com dados, preço, veículo, rating/reviews.
  - Agendamento de aula (booking) com duração/preço/veículo próprio ou alugado.
  - Pagamento online (mock no MVP, Pix/checkout simulado).
  - Recebimento de confirmação e dados de contato (WhatsApp) após pagamento.
  - Avaliação pós-aula (review, nota/comentário).
- **Módulo Instrutor**
  - Cadastro do instrutor (bio, credencial Detran, veículo, preço/hora, pix).
  - Status pending → approved (controlado por admin).
  - Visualização de aulas recebidas (bookings por instrutor).
  - Dashboard simples (aulas do dia, ganhos estimados mock).
- **Módulo Admin**
  - Login (mesma sessão) e role admin.
  - Lista de instrutores pendentes, aprovar/rejeitar.
  - Configuração de comissão (campo/config simples no MVP).
  - Acesso a bookings para auditoria básica.
- **Sistemas Transversais**
  - Auth OIDC (Replit em dev), sessões em Postgres.
  - LGPD: consentimento básico, privacidade, minimização de dados.
  - Logs de API e auditoria mínima (sessão + eventos chave).
  - Comprovantes simples (tela de sucesso + dados da aula/pagamento mock).
  - Armazenamento de sessões em tabela `sessions`.

## 4. Escopo OUT (roadmap)
- Integrações oficiais (Senatran, app gov CNH Digital).
- App nativo mobile, push notifications.
- Chat interno, cupons, reembolso automático, gamificação, loyalty.
- Split de pagamento real com PSP, chargeback handling avançado.
- Matching algorítmico, filas de espera, surge pricing, dynamic pricing.
- Conteúdo/CMS avançado, multilíngue.

## 5. Personas
- **Aluno:** quer aulas práticas rápidas, preço claro, instrutor confiável e perto. Usa WhatsApp.
- **Instrutor:** credenciado, quer demanda e recebimento simples (Pix), define preço e áreas.
- **Admin:** garante compliance, aprova instrutores, define comissão e acompanha operação.

## 6. Jornadas Principais
- **Aluno:** abre app → vê mapa/lista → filtra/escolhe instrutor → abre perfil → seleciona horário (availability) → confirma preço/veículo → paga (mock) → recebe confirmação e contato → faz aula → avalia.
- **Instrutor:** cria conta → envia dados/credencial → fica pending → admin aprova → aparece no catálogo → recebe bookings → executa aula → recebe avaliação → vê ganhos (mock).
- **Admin:** autentica → revisa pendentes → aprova/rejeita → monitora bookings → ajusta comissão (config) → exporta logs básicos.

## 7. Funcionalidades por Módulo
- **Aluno**
  - Listagem/mapa de instrutores aprovados.
  - Perfil do instrutor (dados, preço, veículo, reviews).
  - Seleção de horário/disponibilidade.
  - Criação de booking (status pending → paid → completed/cancelled).
  - Pagamento mock (Pix/checkout simulado) + tela de sucesso.
  - Avaliação pós-aula (nota/comentário).
- **Instrutor**
  - Wizard de cadastro (bio, credencial, veículo, preço, pix).
  - Upload/links de credencial/veículo (campo URL no MVP).
  - Gestão de disponibilidade (CRUD).
  - Visualizar bookings recebidos (por data/status).
- **Admin**
  - Lista de instrutores pendentes, aprovar/rejeitar.
  - Ajustar comissão (config única).
  - Acesso a bookings para auditoria (listagem).
- **Transversais**
  - Auth OIDC + sessão.
  - Logs básicos por rota, auditoria mínima.
  - LGPD: consentimento, política, termos.
  - Segurança: roles (student, instructor, admin), checagem de ownership nos bookings e dados sensíveis.

## 8. Regras de Negócio
- Instrutor só aparece se status = approved.
- Preço definido pelo instrutor; pode ter aluguel de veículo adicional.
- Comissão configurável pelo admin (aplicada sobre total).
- Status de aula: pending, paid, completed, cancelled.
- Avaliação só após aula concluída (booking status completed).
- Disponibilidade deve existir para habilitar horários válidos.
- Logs mínimos de eventos sensíveis (login, criação/atualização booking, aprovação instrutor).

## 9. Requisitos Não Funcionais
- **Segurança:** sessão protegida, roles, evitar exposição de dados sensíveis (CPF, pix). HTTPS em prod.
- **LGPD:** minimização de dados, consentimento, termo de uso/privacidade claros, direito de exclusão.
- **Desempenho:** respostas rápidas (páginas leves), cache de GET públicos via CDN/proxy.
- **Disponibilidade:** VPS única no MVP; aceitar downtime controlado. Futuro: separar DB/serviço.
- **Escalabilidade futura:** permitir mover Postgres para gerenciado (Neon/Supabase) e front para CDN/Vercel; API containerizável (Docker).

## 10. Métricas de Sucesso
- Instrutores cadastrados: 100–150.
- Alunos ativos: ~100 até jan/2026.
- Aulas concluídas: volume crescente; medir conversão mapa → booking → pago → concluído.
- Avaliações: % de aulas avaliadas; rating médio.
- Taxa de aprovação de instrutor, tempo de aprovação.

## 11. Riscos e Premissas
- **Premissas legais:** instrutores credenciados Detran, conformidade com Contran 1.023/2025.
- **Riscos regulatórios:** mudanças na resolução/CTB; necessidade de integrações oficiais no futuro.
- **Riscos de pagamento:** chargeback, fraude; mitigação futura com PSP e antifraude.
- **Dependências:** OIDC atual (Replit) em dev; futura troca de IdP. VPS única no MVP (risco de SPOF).
- **Mitigações futuras:** containerização, DB gerenciado, CDN, log/auditoria fortalecidos, testes de regressão.

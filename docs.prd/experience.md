# experience.md - HabilitFy

## Metadados
- Responsável: Equipe HabilitFy
- Data: 2026-02-05
- Versão: 1.0

## Design System
- **Cores**: Consultar `logo e cores/`.
- **Tipografia**: Inter (UI principal).
- **Componentes**: shadcn/ui, Radix primitives.
- **Acessibilidade**: Foco em contraste e navegação por teclado.

## Fluxos de Tela

### Home / Landing
- Botão "Encontrar Instrutor Agora" → Mapa/Filtro.
- Botão "Sou Instrutor" → Login/Cadastro Instrutor.
- Login Global.

### Mapa / Descoberta
- `[Home]` → `[Mapa/Listagem de Instrutores]`
- Filtro avançado (modal ou lateral).
- Pins no mapa (clicáveis).
- Alternância lista/mapa.
- "Ver Perfil" → `[Perfil Instrutor]`.

### Login Global
- Login via e-mail/senha OU via OIDC (Google).
- Sucesso → Redireciona para dashboard (aluno/instrutor conforme role).
- Falha → Mensagem de erro, opção de redefinir senha.

## Notificações
- **Transacionais**: Confirmações de agendamento, pagamentos, KYC.
- **Operacionais**: Alertas de manutenção, novas features.
- **Canais**: In-app (toast), Push (PWA), Email.

## Disputas e Reclamações
- Fluxo iniciado por aluno/instrutor/admin.
- Motivos: aula não realizada, conduta, cobrança indevida, etc.
- Upload de evidências.
- Admin analisa histórico e pode solicitar mais informações.

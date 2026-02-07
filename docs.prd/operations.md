# operations.md - HabilitFy

## Metadados
- Responsável: Equipe HabilitFy
- Data: 2026-02-05
- Versão: 1.0

## Aprovação de Instrutores

### Checagem Inicial
- Documentos (CNH de instrutor, CRLV do veículo).
- Credenciais para validação.

### Fluxo de Aprovação/Rejeição
1. Instrutor submete documentos.
2. Admin revisa no painel.
3. Aprovar → Instrutor publicado no catálogo.
4. Rejeitar → Notificação com motivo.

### Pós-Aprovação
- Monitoramento contínuo.
- Possibilidade de suspensão.

## Políticas de Cancelamento e Reembolso

### Prazos e Condições
- Cancelamento até 24h antes: reembolso total.
- Cancelamento < 24h: pode haver penalidade.

### No-Show
- **Aluno**: Aula cobrada normalmente.
- **Instrutor**: Penalidade/suspensão.

## Logs e Exportação

### Logs
- Eventos sensíveis: auth, booking, aprovação, pagamentos.
- Armazenados em `server.log`.

### Exportação
- Formatos: CSV, JSON.
- Periodicidade: sob demanda / relatórios mensais.

### Retenção
- Logs transacionais: 5 anos (conformidade fiscal).
- Logs de sessão: 1 ano.

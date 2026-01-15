# Regras permanentes de desenvolvimento, teste e manutenção

## 1) Regras de desenvolvimento
- Nunca assumir nada sem consultar o MCPS em `/docs/contexto/mcps-contexto-global.md`.
- Ler o código atual antes de sugerir ou implementar (rotas, schemas Drizzle, componentes).
- Não alterar stack ou arquitetura sem justificativa técnica real e registro no MCPS.
- Seguir padrões existentes (Express, Drizzle, React Query, wouter, UI atual).
- Validar endpoints no código antes de consumir; usar as rotas já expostas.
- Manter consistência com os fluxos definidos (aluno → instrutor → pagamento → review).
- Documentar mudanças estruturais no MCPS quando alterarem decisões, rotas ou papéis.
- Escrever código modular, limpo e aderente às rotas/componentes existentes.

## 2) Regras de teste
- Sempre testar o fluxo completo: aluno → instrutor → pagamento (mock) → sucesso.
- Testar autenticação/sessão e estados de erro (401, 403, timeouts).
- Testar booking inválido (horário indisponível, instrutor errado, dados faltantes).
- Testar permissões (admin / instrutor / aluno) em cada rota sensível.
- Testar mutações e carregamento via React Query (happy path e erros).
- Testar comunicação com backend real (não só mocks) quando disponível.
- Sempre incluir casos de borda em dados e estados (status booking, status instrutor, rating).

## 3) Regras de manutenção
- Atualizar o MCPS ao mudar algo estrutural (rotas, papéis, arquitetura, dados críticos).
- Atualizar documentação de endpoints quando alguma rota mudar.
- Registrar novos módulos ou decisões importantes (no MCPS ou doc apropriada).
- Manter backlog atualizado quando ele existir (não criado neste passo).
- Não duplicar lógica; reutilizar serviços/hooks/componentes existentes.
- Priorizar legibilidade e consistência do projeto ao aplicar fixes ou refactors.

# Gaps

- Nenhum `/docker`, `docker-compose` ou Dockerfile existia; mapeamento para Factory foi inferido a partir de scripts e docs.
- Deploy Hostinger não detalha como o build estático chega em `public/` (Dockerfile assume cópia de `dist/public` -> `public`). Confirmar se o painel faz esse passo ou se precisa rotina específica.
- Ausência de CI/CD, registry ou pipelines documentados; apenas scripts npm locais.
- Telemetria, logs centralizados e backups de Postgres não descritos.
- Chaves reais do AbacatePay, webhook secreto e configuração de assinatura não documentados (validação marcada como TODO em código/backlog).
- Terminação TLS/HTTPS e flags de cookie seguro na Hostinger não documentadas; risco de sessão se `SESSION_COOKIE_SECURE` não estiver alinhado ao ambiente.
- Não há instruções para executar o mock do AbacatePay em pipelines; e2e dependem disso.
- URL do webhook AbacatePay ainda indisponível (sistema não publicado), impedindo cadastro do webhook no painel do PSP no momento.

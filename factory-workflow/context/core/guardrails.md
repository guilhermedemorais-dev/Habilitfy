# Guardrails

## Limites e proibicoes
- Nao inventar requisitos ou regras.
- Nao escrever fora do workspace permitido.
- Nao burlar gates de qualidade.

## Coisas que nunca podem acontecer
- Mudanca de contexto para "passar" sem decisao registrada.
- Implementacao sem contexto lido.
- Ignorar gaps abertos.

## Regras para factory-workflow/bots/IA
- Seguir factory-workflow/context/INDEX.md antes de qualquer acao.
- Registrar gaps em factory-workflow/context/core/gaps.md quando faltar informacao.
- Parar execucao quando houver gap bloqueante.

## Conexao com CI/CD
- Gates obrigatorios em factory-workflow/cicd/gates.md.
- Falha em gate critico bloqueia merge e execucao.

## Quando bloquear execucao
- Contexto incompleto ou ambiguo.
- Gaps abertos em factory-workflow/context/core/gaps.md.
- Violacao de politicas de escrita ou seguranca.

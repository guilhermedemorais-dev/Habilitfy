# Codex (manual operacional)

## Objetivo
Esta pasta centraliza o manual operacional para uso do Codex e de agentes. Ela define como ler contexto, como agir em caso de gaps e como respeitar gates de qualidade antes de qualquer entrega.

## Ordem de leitura (desta pasta)
1. `factory/context/codex/README.md`
2. `factory/context/codex/agent-policies.md`
3. `factory/context/codex/prompt-standards.md`
4. `factory/context/codex/implementation-rules.md`
5. `factory/context/codex/checklist-delivery.md`
6. `factory/context/codex/safety.md`

## Fontes de verdade relacionadas
- Contexto base: `factory/context/INDEX.md`
- Guardrails e limites: `factory/context/core/guardrails.md`
- Registro de gaps: `factory/context/core/gaps.md`
- Quality bars: `factory/context/quality/quality-bars.md`
- Gates e checklist de CI/CD: `factory/cicd/gates.md` e `factory/cicd/checklist.md`

## Relacao com o contexto
- `factory/context/INDEX.md` define a ordem obrigatoria de leitura do contexto. Este README nao substitui o INDEX.
- `factory/context/core/guardrails.md` define limites de acao; todo bot deve obedecer antes de executar qualquer tarefa.
- `factory/context/core/gaps.md` e o mecanismo oficial para registrar falta de informacao; se houver gap, registrar e parar.

## Relacao com qualidade e CI/CD
- `factory/context/quality/quality-bars.md` define o nivel minimo de qualidade esperado para qualquer entrega.
- `factory/cicd/gates.md` traduz os quality bars em gates de bloqueio.
- `factory/cicd/checklist.md` e a lista operacional para verificar conformidade antes de merge/release.

## Regras
- Nao inventar requisitos.
- Se faltar informacao: registrar em `factory/context/core/gaps.md` e parar.

## Como usar
- Leia esta pasta antes de iniciar qualquer tarefa.
- Em seguida, siga a ordem de leitura do contexto.
- Valide gates e checklist antes de entregar.

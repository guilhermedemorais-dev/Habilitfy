# Codex (manual operacional)

Nota: apesar do nome desta pasta, a Factory e agnostica de modelo e pode ser
utilizada por qualquer IA de codificacao (ou por humanos).

## Objetivo
Esta pasta centraliza o manual operacional para uso do Codex e de agentes. Ela define como ler contexto, como agir em caso de gaps e como respeitar gates de qualidade antes de qualquer entrega.

## Ordem de leitura (desta pasta)
1. `factory-workflow/context/codex/README.md`
2. `factory-workflow/context/codex/agent-policies.md`
3. `factory-workflow/context/codex/prompt-standards.md`
4. `factory-workflow/context/codex/implementation-rules.md`
5. `factory-workflow/context/codex/checklist-delivery.md`
6. `factory-workflow/context/codex/safety.md`

## Fontes de verdade relacionadas
- Contexto base: `factory-workflow/context/INDEX.md`
- Guardrails e limites: `factory-workflow/context/core/guardrails.md`
- Registro de gaps: `factory-workflow/context/core/gaps.md`
- Quality bars: `factory-workflow/context/quality/quality-bars.md`
- Gates e checklist de CI/CD: `factory-workflow/cicd/gates.md` e `factory-workflow/cicd/checklist.md`

## Relacao com o contexto
- `factory-workflow/context/INDEX.md` define a ordem obrigatoria de leitura do contexto. Este README nao substitui o INDEX.
- `factory-workflow/context/core/guardrails.md` define limites de acao; todo bot deve obedecer antes de executar qualquer tarefa.
- `factory-workflow/context/core/gaps.md` e o mecanismo oficial para registrar falta de informacao; se houver gap, registrar e parar.

## Relacao com qualidade e CI/CD
- `factory-workflow/context/quality/quality-bars.md` define o nivel minimo de qualidade esperado para qualquer entrega.
- `factory-workflow/cicd/gates.md` traduz os quality bars em gates de bloqueio.
- `factory-workflow/cicd/checklist.md` e a lista operacional para verificar conformidade antes de merge/release.

## Regras
- Nao inventar requisitos.
- Se faltar informacao: registrar em `factory-workflow/context/core/gaps.md` e parar.

## Como usar
- Leia esta pasta antes de iniciar qualquer tarefa.
- Em seguida, siga a ordem de leitura do contexto.
- Valide gates e checklist antes de entregar.

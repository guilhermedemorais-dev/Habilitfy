# Safety (Seguranca Operacional)

## Objetivo
Definir regras de seguranca para execucao de agentes e bots.

## Segredos
- Nunca commit de secrets.
- Usar `.env.example` para documentar variaveis.
- Secrets reais devem ficar em CI secrets/variables.

## Escrita segura
- Escrita apenas em paths permitidos (allowlist).
- Bloquear path traversal e caminhos relativos nao autorizados.
- Validar sempre o destino antes de escrever.

## Logs
- Nao logar secrets, tokens ou dados sensiveis.
- Logs devem conter apenas metadados operacionais.

## Dependencias
- Evitar dependencias suspeitas.
- Registrar decisoes e justificativas quando adicionar dependencias.

## Condicao de parada
- Se faltar informacao: registrar em `factory-workflow/context/core/gaps.md` e parar com status BLOCKED.

## Regras especiais
### Bot dev
- So escreve em workspace permitido (ex.: `/apps/<projeto>` quando informado).
- Proibido alterar contexto para contornar gates.

### Bot devops
- Nao aplicar mudancas destrutivas sem autorizacao explicita.
- Respeitar gates e checklist de CI/CD.

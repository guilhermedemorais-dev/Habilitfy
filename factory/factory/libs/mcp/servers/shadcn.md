# shadcn MCP Server (UI)

## Descricao
Servidor MCP para buscar, navegar e instalar componentes de UI via registries shadcn.

## Problemas que resolve
- Reuso de componentes prontos.
- Padronizacao visual antes de criar do zero.
- Busca rapida em registries aprovados.

## Quando o uso e obrigatorio
- Qualquer mudanca/criacao de componentes UI.
- Reuso de templates ou blocos de UI.

## Configuracao (Codex)
- Configurar em `~/.codex/config.toml`:
  - `command = "npx"`
  - `args = ["shadcn-vue@latest", "mcp"]`

## Registries
- Os registries sao lidos do `components.json`.
- Se nao existir registry customizado, o padrao shadcn/ui sera usado.

## Evidencia em PR
- Registrar consulta ao MCP antes de criar UI nova.


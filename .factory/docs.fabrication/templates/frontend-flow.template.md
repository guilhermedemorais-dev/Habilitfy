# Frontend Flow (Mermaid)

Use este template para gerar o fluxo do frontend. Substitua os blocos.

```mermaid
flowchart TD
    A[Entrada do usuario] --> B[Autenticacao]
    B --> C[Layout base]
    C --> D[Pagina/Modulo]
    D --> E[Validacoes]
    E --> F[API/Integracao]
    F --> G[Estado UI atualizado]
    G --> H[Logs e eventos]
```

Checklist:
- Todas as paginas principais aparecem.
- Estados de erro e vazio aparecem.
- Pontos de integracao estao claros.
- Eventos e telemetria indicados.

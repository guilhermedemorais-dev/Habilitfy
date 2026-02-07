# Backend Flow (Mermaid)

Use este template para gerar o fluxo do backend. Substitua os blocos.

```mermaid
flowchart TD
    A[Request] --> B[Gateway/API]
    B --> C[Auth/Policy]
    C --> D[Servico/Use case]
    D --> E[Validacao]
    E --> F[Persistencia/DB]
    F --> G[Eventos/Webhooks]
    G --> H[Response]
```

Checklist:
- Servicos e boundaries estao claros.
- Dependencias externas estao mapeadas.
- Politicas e validacoes aparecem.
- Eventos e filas estao documentados.

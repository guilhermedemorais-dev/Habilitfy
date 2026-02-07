# Histórico de Decisões - HabilitFy

Este diretório contém o registro de todas as decisões técnicas e de design tomadas durante o desenvolvimento do projeto.

## Índice

| Data | Decisão | Descrição |
|------|---------|-----------|
| 2025-12 | [Login Layout Debug](./2025-12-login-layout-debug/) | Correção de login e design "Super App" |
| 2026-01 | [Dark Mode Fix](./2026-01-dark-mode-fix/) | ThemeProvider e cores hardcoded |
| 2026-01 | [Face Capture UI](./2026-01-face-capture-ui/) | Design FACiO do WebcamCapture |
| 2026-01 | [Routing Fix](./2026-01-routing-fix/) | Middleware e Tailwind |
| 2026-02-02 | [Factory Docs](./2026-02-02-factory-docs/) | Refinamento documentação Factory |
| 2026-02-03 | [Google Login Fix](./2026-02-03-google-login-fix/) | Evitar criação automática de conta |
| 2026-02-04 | [Deploy Debug](./2026-02-04-deploy-debug/) | Erros storage/testw |
| 2026-02-05 | [Camera Selfie Fix](./2026-02-05-camera-selfie-fix/) | 4 bugs do getUserMedia |
| 2026-02-05 | [Factory Sync](./2026-02-05-factory-sync/) | Sincronização completa (107→1277 arquivos) |
| 2026-02-05 | [Remote Photo Capture](./2026-02-05-remote-photo-capture/) | QR Code para captura via celular |
| 2026-02-05 | [Signup Stages](./2026-02-05-signup-stages/) | Reordenação das etapas de cadastro |

## Estrutura
Cada pasta contém:
- `walkthrough.md` - Resumo do que foi feito
- `plan.md` (opcional) - Plano de implementação original

## Como Usar
Ao iniciar uma nova feature ou correção, crie uma pasta com o formato:
```
YYYY-MM-DD-nome-da-feature/
├── plan.md
└── walkthrough.md
```

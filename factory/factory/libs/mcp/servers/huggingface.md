# Hugging Face MCP Server (IA)

## Descricao
Servidor MCP para acessar modelos/datasets/spaces da Hugging Face.
Uso previsto no projeto: KYC (liveness + match facial) e geracao de imagens para seeds internas.

## Quando usar
- POCs e implementacoes de IA aprovadas no escopo do projeto.
- Consultas de modelos e referencias tecnicas de IA.

## Configuracao (prevista)
- URL: `https://huggingface.co/mcp?login`
- Autenticacao: `Authorization: Bearer <HF_TOKEN>`.
- Codex: adicionar em `~/.codex/config.toml` quando credenciais estiverem prontas.

## Riscos
- LGPD/biometria: consentimento, armazenamento seguro e retencao.
- Custos e limites de uso (free tier).

## Evidencia em PR
- Registro da consulta e justificativa do modelo escolhido.

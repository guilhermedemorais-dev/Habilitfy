#!/bin/bash

echo "🚀 Iniciando Deploy Automático Simplificado..."

# 1. Puxar as últimas alterações
echo "📥 Baixando atualizações do GitHub..."
git pull origin main

# 2. Instalar dependências (caso tenha algo novo)
echo "📦 Instalando dependências..."
npm install

# 3. Construir o projeto
echo "🔨 Construindo a aplicação..."
npm run build

echo "✅ Deploy concluído!"
echo "👉 AGORA: Reinicie sua aplicação no painel da Hostinger ou rode 'node server.cjs' se estiver no terminal."

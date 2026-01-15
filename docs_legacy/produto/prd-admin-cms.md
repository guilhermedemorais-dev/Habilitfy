# PRD – CMS (Content Management System) – HabilitFy

## 1. Visão Geral

O CMS do HabilitFy é o painel que permite ao admin gerenciar todo conteúdo dinâmico e institucional do app sem necessidade de desenvolvedor.  
Inclui gestão de banners promocionais, textos institucionais (rodapé, política, termos), página dinâmica de “Guia do Aluno”, notificações gerais e branding visual.

---

## 2. Funcionalidades Principais

### 2.1 Gestão de Banners

- Cadastro, edição, ativação/desativação e remoção de banners promocionais para exibição na home, landing pages e áreas internas do app.
- Upload de imagens (PNG/JPG/WebP), campos de texto (título, descrição, call to action), link associado e período de exibição.
- Definir ordem/prioridade dos banners.
- Preview em tempo real antes de publicar.

---

### 2.2 Editor de Textos Institucionais

- Edição direta dos textos:
    - Rodapé do site/app
    - Política de privacidade
    - Termos de uso
    - Avisos legais
- Campos ricos (suporte a Markdown/HTML básico), com preview instantâneo.
- Histórico de versões: visualizar e restaurar textos anteriores.

---

### 2.3 Guia do Aluno

- Página dinâmica editável pelo admin com:
    - Tópicos de leis de trânsito, novidades, dicas, vídeos, simulados, links úteis.
    - Ordenação de tópicos, anexos de links externos, imagens ou vídeos embutidos.
- Possibilidade de agendar publicação de conteúdo e destacar tópicos relevantes.

---

### 2.4 Notificações Globais

- Cadastro, edição e envio de notificações push/alertas para todos os usuários ou grupos específicos (alunos, instrutores).
- Tipos: informativo, alerta, manutenção, promoções.
- Opção de agendar envio para data/hora futura.
- Histórico/log de notificações enviadas.

---

### 2.5 Branding Visual

- Upload e alteração de logotipo, favicon, cores primária/secundária.
- Preview das mudanças visualizadas ao vivo antes de aplicar.
- Permite atualização instantânea sem precisar de deploy técnico.

---

## 3. Regras Especiais

- Permissões de edição configuráveis por papel/admin.
- Todo conteúdo gerenciado pelo CMS deve ser publicado/despublicado em tempo real (sem cache persistente).
- Logs e histórico completo de alterações para compliance/auditoria.

---

## Wireframe Textual – Módulo CMS/Admin

---

### 1. Sidebar (Menu Lateral)
- Ícones/links:
  - **Banners**
  - **Textos Institucionais**
  - **Guia do Aluno**
  - **Notificações**
  - **Branding Visual**

---

### 2. Tela: Gestão de Banners

- **Header:** “Banners Promocionais”
  - Botão “Novo Banner”
- **Tabela/Listagem:**
  - Colunas: Imagem, Título, Status (ativo/inativo), Período, Ordem, Ações (editar, ativar/desativar, remover)
- **Ao clicar “Novo Banner” ou “Editar”:**
  - Upload de imagem (preview ao vivo)
  - Campos: Título, Descrição, Link (opcional), Período de exibição (início/fim), Ordem de exibição
  - Botão “Salvar”, “Visualizar”, “Publicar/Despublicar”

---

### 3. Tela: Editor de Textos Institucionais

- **Header:** “Textos Institucionais”
  - Seletor/tab: Política de Privacidade | Termos de Uso | Rodapé | Avisos Legais
- **Editor Rico:** Campo para edição em Markdown/HTML, preview instantâneo ao lado
  - Histórico de versões: botão “Visualizar versões anteriores”, “Restaurar versão”
- **Botão Salvar/Publicar**

---

### 4. Tela: Guia do Aluno

- **Header:** “Guia do Aluno”
  - Botão “Novo Tópico”
- **Lista de tópicos:** Ordem arrastável (drag & drop)
  - Título, tipo (texto, vídeo, link), status (ativo/inativo), ações (editar, remover, agendar destaque)
- **Editor de tópico:**  
  - Campo título, conteúdo rico (texto, imagem, embed vídeo/link), anexos
  - Opção de agendar publicação
  - Botão Salvar/Publicar

---

### 5. Tela: Notificações Globais

- **Header:** “Notificações”
  - Botão “Nova Notificação”
- **Lista:** Histórico/log de notificações enviadas (texto, segmento, status, data/hora)
- **Editor:**  
  - Destinatário (todos, alunos, instrutores, segmento)
  - Tipo (informativo, alerta, promoção)
  - Campo mensagem (texto/HTML)
  - Upload de banner (opcional)
  - Agendar data/hora envio
  - Botão Enviar/Agendar

---

### 6. Tela: Branding Visual

- **Header:** “Branding”
- **Campos:**
  - Upload logo, favicon
  - Seletor de cores (primária, secundária)
  - Preview em tempo real (exibe mockup da home/landing com cores/logo atualizadas)
  - Botão Salvar/Publicar

---

**Obs:**  
Todas telas apresentam logs de alterações recentes no rodapé, botões de voltar/navegar entre áreas e confirmação visual em cada ação (toast/modal).

---

**Fim do wireframe textual – Módulo CMS**

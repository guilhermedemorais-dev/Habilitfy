# PRD – Página de Login Global – HabilitFy

## 1. Visão Geral

Página inicial de autenticação da plataforma.  
Foco em login rápido, seguro, mobile-first,  
com dois botões de destaque levando ao cadastro separado de aluno ou instrutor.

---

## 2. Funcionalidades Principais

- Campo de e-mail (ou celular, se implementado) e senha
- Botão **Entrar**
- Link “Esqueci minha senha” (recuperação via e-mail)
- Dois botões de ação abaixo do formulário:
    - **Cadastrar Aluno** → direciona para `/cadastro-aluno`
    - **Cadastrar Instrutor** → direciona para `/cadastro-instrutor`
- Feedback instantâneo de erros de login (usuário/senha inválidos, conta bloqueada, etc)

---

## 3. UX/UI

- Layout limpo, objetivo, responsivo para mobile/desktop
- Logo HabilitFy no topo
- Destaque visual para botões de cadastro
- Textos e campos acessíveis (WCAG)
- Links para política de privacidade e termos de uso

---

## 4. Segurança

- Bloqueio após X tentativas de login inválido
- Proteção contra brute-force e injeção
- Não exibir mensagens detalhadas sobre existência de usuários
- Consentimento LGPD no rodapé

---

## 5. Observações

- Se usuário já autenticado, redirecionar direto para dashboard
- Página de login é única porta de entrada para todos os usuários

---



# 🏭 Factory

> **Framework público para Engenharia de Contexto, Agentes de IA e Governança de Entrega de Software.**

Factory existe para resolver um problema simples e ignorado:

🚨 **IA não falha por código.  
IA falha por CONTEXTO mal definido.**

---

## 🎯 O que é a Factory

Factory é o **sistema operacional do desenvolvimento de software**.

Ela não gera código sozinha.  
Ela define **como pensar, decidir, organizar, validar e automatizar** a construção de software — **antes**, **durante** e **depois** da implementação.

---

## 🚫 O que a Factory NÃO é

- ❌ Framework frontend/backend  
- ❌ Boilerplate de código  
- ❌ Gerador mágico de software  
- ❌ Prompt solto de IA  

👉 Factory é **governança + contexto + automação consciente**.

---

## 👥 Para quem isso é

- 👨‍💻 Times que usam ou vão usar **IA / agentes / bots**
- 🧠 Engenheiros que querem **menos improviso**
- 🏢 Projetos críticos que exigem **auditoria e rastreabilidade**
- 🚀 Produtos que precisam **escalar sem virar bagunça**

---

## 🧠 A ideia central

> **Nada executa sem contexto fechado.  
Nada entrega sem qualidade validada.  
Nada vai para produção sem controle.**

---

## 🔄 Como a Factory funciona (fluxo real)

### Fluxo conceitual

```mermaid
flowchart TD
    A[💡 Ideia] --> B[📄 docs.md<br/>Documento Mestre]
    B --> C[🧩 Distribuição de Contexto<br/>factory/context/*]
    C --> D[📏 Quality Bars & Gates]
    D --> E[🤖 Bots / Humanos]
    E --> F[🧪 Testes]
    F --> G[🚦 CI/CD Gates]
    G --> H[🚀 Deploy (staging)]
    H --> I[🛑 Aprovação Humana]
    I --> J[✅ Produção]
```

### Versão mental (simples)

```
IDEIA
  ↓
DOCUMENTO MESTRE
  ↓
CONTEXTO OPERACIONAL
  ↓
REGRAS + GATES
  ↓
EXECUÇÃO (BOTS/HUMANOS)
  ↓
TESTES
  ↓
DEPLOY CONTROLADO
```

---

## 📁 Estrutura do Framework (visão clara)

### 🧩 Contexto — Fonte da Verdade

`factory/context/*`

- 🧠 **core** → visão, escopo, requisitos, regras, dados
- 📏 **quality** → quality bars, DoD, estratégia de testes
- 🛠️ **tooling** → stack, MCP, observabilidade
- 🎨 **ui** → políticas de UI, registry, acessibilidade
- 🤖 **codex** → regras de comportamento dos agentes

---

### 🎨 Design System

`factory/design-system/*`

- tokens (cor, spacing, tipografia)
- componentes
- padrões
- acessibilidade

> UI sem design system = dívida técnica antecipada.

---

### 🧠 MCP — Reuso antes de criar

`factory/libs/mcp/*`

- 🌐 **servers** → fontes confiáveis de contexto/documentação
- 📦 **registries** → componentes reutilizáveis

> Regra de ouro: **buscar antes de criar**.

---

### 🚦 CI/CD & Deploy

`factory/cicd/*`

- estratégia
- gates
- checklist
- deploy com **aprovação humana em produção**

---

### 🏛️ Governança

`factory/governance/*`

- ownership
- decisões (ADR)
- riscos
- mudanças
- política de git

> Nada crítico fica implícito.

---

### 🗺️ Planejamento

`factory/plan/*`

- roadmap
- milestones
- dependências

---

### 🧠 Prompts

`factory/prompts/*`

- templates canônicos para agentes
- prompts auditáveis e reutilizáveis

> Prompt freestyle não escala.

---

### 📚 Docs Públicos (onde tudo começa)

`factory/docs/*`

- quickstart
- workflow
- templates oficiais
- exemplos reais

---

## 🚀 Onde começar

👉 **Siga nesta ordem (não pule):**

1️⃣ `factory/docs/quickstart.md`  
2️⃣ `factory/docs/workflow.md`  
3️⃣ `factory/docs/templates/README.md`  
4️⃣ `factory/docs/examples/README.md`

Se você pular o Quickstart, vai usar errado.

---

## 🧩 Regras fundamentais (não negociáveis)

- 📌 Contexto é **fonte de verdade**
- 🚦 Qualidade é **gate**, não sugestão
- 🔁 Reuso vem antes de criação
- 🛑 Produção exige aprovação humana
- ❓ Falta de informação → **GAP**, não suposição

---

## 🤝 Colaboração

- 📄 Decisões devem ser registradas (ADR)
- 🔀 Commits e PRs seguem `factory/governance/git-policy.md`
- 🚦 Gates definidos em `factory/cicd/gates.md`

---

## 📜 Licença

Framework público e não comercial.  
Veja o arquivo de licença para detalhes.

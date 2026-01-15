# PRD – Módulo Mapa/Listagem – HabilitFy (Ajustado)

## 1. Visão Geral

Tela de busca central do HabilitFy, permitindo ao aluno encontrar e comparar instrutores por localização, tipo de veículo, avaliação, preço e serviços.  
Permite alternar entre visualização no mapa ou lista detalhada.  
Interface mobile-first, leve e responsiva.

---

## 2. Funcionalidades Principais

### 2.1 Visualização de Mapa

- Mapa interativo (Google Maps, Mapbox ou similar)
- Marcadores customizados para instrutores disponíveis (com popover básico: nome, nota, categoria, botão “Ver perfil”)
- Navegação livre (pan/zoom), centraliza no local do usuário por padrão
- Exibe apenas instrutores com status aprovado/KYC ok

---

### 2.2 Visualização em Lista

- Alternância rápida entre mapa <-> lista (botão no topo)
- Lista ordenável e filtrável dos instrutores correspondentes ao filtro/mapa atual
- Card do instrutor:
    - Foto de perfil
    - Nome
    - Nota média/avaliação
    - Preço/hora
    - Tipos de veículo ofertados (ícones)
    - Distância aproximada/localidade
    - Botão “Ver perfil” (leva para detalhes/booking)
- Placeholder para loading, sem resultados, etc

---

### 2.3 Filtros Avançados

- Botão de filtro no topo, abre modal/dropdown com:
    - **Avaliação:** nota mínima (ex: 4.0+)
    - **Preço:** faixa de preço por hora/aula
    - **Tipo de veículo:** carro, moto, ônibus, caminhão
    - **Localidade:** bairro, cidade, CEP
    - **Tipo de serviço:** apenas prático presencial (NÃO inclui aula online)
- Aplicação instantânea dos filtros no mapa e lista

---

### 2.4 Funcionalidades Complementares

- Salvar últimos filtros e posição do mapa
- Botão “Atualizar resultados” se mapa for movido
- Menu inferior de navegação (Início, Mapa – ativo, Aulas, Perfil)
- Acesso rápido ao perfil do instrutor via mapa ou lista

---

### 2.5 Perfil do Instrutor (Detalhe)

- Além das informações obrigatórias (foto, credenciais, veículos, preço, avaliações),  
  o instrutor pode inserir links do **Instagram** e **YouTube** (exibidos como ícones ou botões)
- Não há opção de agendamento/execução de aulas online via plataforma

---

## 3. Regras Especiais

- Apenas instrutores com KYC/documentação aprovada aparecem
- Dados sensíveis (contato, localização exata) só liberados após booking/pagamento
- Atualização em tempo real para novos instrutores (opcional)
- Todos filtros combináveis

---

## 4. Observações

- Layout adaptável: mobile, tablet e desktop
- Mapas e listas otimizados para performance
- Pronto para integração futura com geolocalização avançada e clusters em alta demanda

---
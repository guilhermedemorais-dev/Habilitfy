# PRD – Painel do Instrutor – HabilitFy

## 1. Visão Geral

O painel do instrutor é o ambiente onde o profissional cadastra seus serviços (tipos de aulas, preços), gerencia veículos habilitados, acompanha seus recebíveis e histórico de aulas, realiza check-in/check-out (QR Code) para garantir pagamentos e controle antifraude. Permite flexibilidade para atuar em múltiplas categorias (carro, moto, ônibus, caminhão), com validação de documentos e fluxo simplificado.

---

## 2. Funcionalidades Principais

### 2.1 Recebíveis & Transações

- **Painel inicial exibe:**  
  - Valor total a receber (por dia, semana, mês)
  - Botão/atalho para detalhes

- **Ao clicar:**  
  - Tabela detalhada com filtros (recebido / pendente / data)
  - Colunas: ID aula, data, aluno, serviço, valor, status (pendente/recebido)
  - Ação: visualizar comprovante ou log de pagamento

---

### 2.2 Serviços Ofertados

- **Botão “Cadastrar Serviço”**  
  - Cadastro de tipos de aula:  
    - Carro, Moto, Ônibus, Caminhão (seleção por checkbox/categoria)
  - Definição de preço/hora para cada serviço/categoria
  - Editar, ativar/desativar, excluir serviços
  - Visualização dos serviços ativos, quantidade de aulas vendidas

---

### 2.3 Cadastro de Veículos

- **Cadastro vinculado à categoria habilitada (carro, moto, etc.)**
  - Só exibe opção para categorias permitidas pelo perfil do instrutor
  - Cadastro: placa, modelo, ano, documentos (upload), foto do veículo
  - Permite múltiplos veículos por categoria
  - Todos os veículos cadastrados entram como “pendente”, aguardando validação manual/admin (verificação se atende às regras do governo)
  - Status: aprovado / pendente / rejeitado (com motivo)

---

### 2.4 Histórico de Aulas & Check-in/Check-out

- **Tela de histórico**  
  - Lista/calendário de aulas marcadas (por data/status/aluno)
  - Cada aula tem status visual: agendada, check-in realizado, concluída, cancelada

- **Fluxo de check-in/check-out via QR Code:**  
  - No início da aula:  
    - Instrutor solicita QR Code de check-in ao aluno  
    - Ao escanear, sistema registra início e libera metade do pagamento ao instrutor
  - Ao final da aula:  
    - Aluno gera QR Code de check-out  
    - Instrutor escaneia para confirmar término  
    - Sistema libera saldo restante ao instrutor
  - Logs de check-in/out disponíveis para consulta/admin

- **Regras:**  
  - Pagamento dividido: 50% no check-in, 50% no check-out  
  - Só há repasse após confirmação via QR Code por ambas as partes  
  - Auditoria para disputas ou problemas (log acessível ao admin/suporte)

---

### 2.5 Observações Gerais

- Todos os fluxos devem ser auditáveis e apresentar logs detalhados para o instrutor e para o admin.
- Responsividade total, acesso web/mobile.
- Notificações automáticas para eventos de validação, pagamento, agendamento e rejeição de cadastro.

---





### 2.6 Chat e Agendamento de Ponto de Encontro

#### 2.6.1 Chat Instrutor ↔ Aluno

- **Botão “Chat” disponível para cada agendamento confirmado**
  - Chat direto entre instrutor e aluno (somente após agendamento/pagamento confirmado)
  - Mensagens ficam salvas no histórico do agendamento (acesso admin/suporte para auditoria)
  - Possibilidade de enviar textos, localizações pré-cadastradas (e futuramente anexos)
  - Notificações para novas mensagens

#### 2.6.2 Cadastro e Seleção de Pontos de Encontro

- **No cadastro/edição de serviço:**  
  - Instrutor registra um ou mais “pontos de encontro” onde oferece aulas (endereços, mapas, pontos de referência)
  - Cada ponto de encontro fica salvo no perfil do instrutor
  - Na criação do agendamento, aluno pode:
    - Escolher ponto de encontro sugerido pelo instrutor
    - Ou sugerir ponto próprio (que instrutor pode aceitar/rejeitar pelo chat)
  - Histórico dos pontos de encontro utilizados, para referência futura e segurança
  - Dados dos pontos de encontro ficam disponíveis ao aluno após confirmação do agendamento

#### 2.6.3 Segurança

- **Regras:**
  - Chat disponível somente entre alunos e instrutores envolvidos em agendamento ativo
  - Histórico de conversa protegido por LGPD e acessível ao suporte/admin para auditoria e resolução de conflitos
  - Localização dos pontos de encontro nunca exposta publicamente — só após agendamento confirmado

---
### 2.7 Perfil do Instrutor: Foto e Pagamento

#### 2.7.1 Foto do Perfil

- Instrutor pode registrar e atualizar sua foto de perfil a qualquer momento pelo painel
- Upload simples (JPG/PNG, tamanho e proporção padronizados)
- Visualização imediata após upload e opção de remover/substituir foto
- Foto do perfil é exibida em:
  - Listagem pública de instrutores
  - Perfil detalhado
  - Conversa de chat (avatar)
- Regras de moderação: foto pode ser removida/rejeitada por admin caso não siga padrões de conduta/segurança

#### 2.7.2 Chave Pix para Recebimento

- Campo obrigatório no cadastro/edição do perfil: inserir/alterar chave Pix (e-mail, CPF, telefone ou aleatória)
- Chave Pix validada antes de salvar (checagem de formato e unicidade na base)
- Chave utilizada para todos os repasses automáticos/saques via plataforma
- Visualização segura (campo mascarado, só visível para o próprio instrutor e admins autorizados)
- Histórico de alterações de chave Pix (quem/quando alterou)

---
### 2.8 Avaliação Inicial e Pacote de Aulas

#### 2.8.1 Primeira Aula Avaliativa

- **Regra:**  
  - Toda primeira aula marcada por um aluno com um novo instrutor é obrigatoriamente **aula avaliativa**.
  - Ao final dessa aula, o instrutor preenche uma avaliação estruturada (pontuação, notas em critérios técnicos/comportamentais, campos de observação).
  - O sistema utiliza um algoritmo que processa a avaliação para estimar a quantidade ideal de aulas práticas necessárias para o aluno atingir o nível para prova.

#### 2.8.2 Sugestão de Pacote de Aulas

- **Após avaliação:**  
  - O sistema exibe ao aluno um pacote sugerido de aulas (ex: “Recomendamos 10 aulas práticas para seu perfil”)
  - O aluno pode aceitar a sugestão e agendar as próximas aulas em pacote ou seguir agendando individualmente.
  - O instrutor e o admin têm acesso ao histórico das avaliações iniciais e recomendações geradas para cada aluno.
  - Todo o fluxo é logado e auditável.

#### 2.8.3 Observações

- Algoritmo de recomendação pode ser ajustado/configurado pela equipe de produto/adm.
- Transparência: aluno visualiza a justificativa e pontuação dada pelo instrutor.
- Proteção contra abusos: o admin pode auditar avaliações para evitar superestimação proposital.

--- 

## Wireframe Textual – Painel do Instrutor

---

### 1. Header (Topo)
- Saudação (“Olá, [Nome/Local]”)
- Avatar/Fotoperfil do instrutor (canto superior direito, clicável para editar perfil)

---

### 2. Blocos Resumo (Cards)
- **A Receber**
  - Valor total disponível (ex: “R$ 1.250”)
  - Botão destacado: “Sacar Pix”
- **Aulas Hoje**
  - Quantidade de aulas agendadas no dia
  - Indicador de aulas pendentes/confirmadas

---

### 3. Gráfico de Ganhos da Semana
- Linha ou barras mostrando evolução dos ganhos por dia (Seg-Dom)
- Tooltip em cada ponto mostrando valor do dia

---

### 4. Agenda (Calendário)
- Calendário mensal com dias destacados (ex: amarelo para o dia atual)
- Possibilidade de clicar em um dia para ver detalhes das aulas agendadas
- Navegação entre meses

---

### 5. Lista – Alunos de Hoje
- Título: “Alunos de Hoje”
- Cartões listando cada aluno agendado:
  - Nome do aluno
  - Horário e tipo de aula (ex: “08:00 • Baliza”)
  - Ícone de telefone (chamada rápida)
  - (Possível acesso rápido ao chat da aula)

---

### 6. Menu Inferior (Navegação)
- Ícones/texto:
  - Início (painel/resumo)
  - Mapa (localização dos pontos de encontro/aulas)
  - Aulas (histórico, check-in/out, QR Code)
  - Perfil (dados pessoais, veículos, serviços, chave Pix, foto)

---

### 7. Fluxos Avançados (não visíveis no resumo, mas acessíveis via menu/perfil)
- Cadastro/Edição de serviços (carro, moto, ônibus, caminhão)
- Cadastro/Edição de veículos (upload documentos, aprovação admin)
- Histórico detalhado de aulas (com status, QR Code check-in/out)
- Chat com alunos (acessível via agendamento)
- Cadastro e seleção de pontos de encontro para aulas

---

**Obs:**  
Layout responsivo, foco em clareza de informações financeiras e operacionais.  
Acesso fácil a ações principais: sacar, editar perfil, falar com aluno, ver próximos compromissos.

---

**Fim do wireframe textual – Painel do Instrutor**








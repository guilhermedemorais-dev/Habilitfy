# PRD – Módulo ADMIN HabilitFy (DETALHADO)

## 1. Objetivo
Oferecer painel administrativo centralizado e seguro, capaz de gerenciar todas as operações do marketplace, garantir compliance, agilidade e suporte, sem dependência de devs.

---

## 2. Estrutura do Painel Admin

### 2.1 Dashboard Geral

- **Mapa Interativo**
  - Exibe o Brasil com bolhas/números indicando total de usuários por estado e cidade.
  - Cores distintas para alunos e instrutores.
  - Zoom e filtro por estado.
- **Cards Resumo**
  - Total de instrutores (aprovados, pendentes, banidos)
  - Total de alunos (ativos, bloqueados)
  - Total de aulas concluídas
  - Volume financeiro total (transacionado na plataforma)
  - Valor retido em carteiras (aluno/instrutor)
- **Gráfico Financeiro**
  - Transações realizadas por período (dia/semana/mês)
  - Filtros rápidos por status (pagas, pendentes, reembolsadas)

---

### 2.2 Listas Gerenciáveis

#### 2.2.1 Instrutores

- Lista de instrutores com busca, filtros (status, cidade, data de cadastro)
- Ações rápidas:
  - Visualizar perfil detalhado
  - Aprovar/rejeitar KYC
  - Banir/desbanir instrutor
  - Resetar senha
  - Editar informações cadastrais (nome, e-mail, telefone, veículos)
- **Perfil do Instrutor**
  - Dados pessoais e contato
  - Foto/selfie (KYC), CNH, credencial Detran, CRLV, fotos do(s) veículo(s)
  - Status da documentação (checklist de cada item: aprovado/pendente/rejeitado)
  - Histórico de aulas e avaliações recebidas
  - Ganhos acumulados/pendentes
  - Saldo e extrato da carteira
  - Logs de todas as ações administrativas nesse perfil

#### 2.2.2 Alunos

- Lista de alunos com busca, filtros (status, cidade, data de cadastro)
- Ações rápidas:
  - Visualizar perfil detalhado
  - Bloquear/desbloquear aluno
  - Resetar senha
  - Editar informações cadastrais
- **Perfil do Aluno**
  - Dados pessoais e contato
  - Histórico de aulas, pagamentos e avaliações feitas
  - Saldo e extrato da carteira
  - Logs de ações administrativas

---

### 2.3 Validação Manual KYC (Instrutores)

- **Timeline de KYC**
  - Lista os instrutores recém-cadastrados ou pendentes de validação
  - Exibe selfie, documentos enviados, status e data/hora de envio
  - Permite aprovação/rejeição individual de cada documento (checkbox, comentário obrigatório para rejeição)
  - Histórico completo de análise: quem aprovou/rejeitou, data/hora, motivo
  - Permitir reanálise caso instrutor envie nova documentação
  - Notificações automáticas para equipe de pendências críticas

---

### 2.4 Gestão Financeira & Pagamentos

- **Configuração do Gateway**
  - Selecionar/alterar gateway de pagamento (AbacatePay ou outro), inserir credenciais/token via painel seguro
- **Monitoramento**
  - Painel de transações em tempo real (listagem, filtro por status, tipo, usuário, período)
  - Caixa/contabilidade: saldo geral, saldo em processamento, saldo em carteiras virtuais, relatórios exportáveis (.csv/.pdf)
- **Gestão de Carteiras**
  - Visualização de saldo individual de instrutores/alunos
  - Histórico de movimentações (crédito, débito, reembolso, repasse)
  - Execução manual de reembolsos e ajustes
  - Relatórios detalhados por usuário/período

---

### 2.5 Monitoramento do Sistema

- **Status do servidor**
  - Card/sinalização de saúde do sistema (online/offline, uso de CPU, RAM, conexões)
  - Alertas automáticos para equipe em caso de sobrecarga, falha ou lentidão
- **Logs de Eventos**
  - Registro e busca de eventos críticos (login, alteração de status, falhas, ações administrativas)
  - Exportação de logs para análise externa (.csv/.json)
- **Relatórios de Incidentes**
  - Cadastro e acompanhamento de incidentes (quem abriu, descrição, status, solução)
  - Histórico de incidentes resolvidos/pendentes

---

### 2.6 CMS e Branding

- **Gestor de Banners**
  - Cadastro, upload, agendamento de banners promocionais para a home (definir período de exibição, ordem, link associado)
- **Editor de Conteúdo**
  - Edição dinâmica de rodapé, política de privacidade, termos de uso via painel
- **Personalização Visual**
  - Alteração de cores primárias/secundárias, logo, favicon (upload e preview)

---

### 2.7 Suporte & Operação

- **Central de Suporte**
  - Chat interno ou sistema de tickets para suporte (categorizado por aluno/instrutor)
  - Acompanhamento dos chamados/solicitações por status (novo, em atendimento, resolvido)
- **Histórico de Atendimentos**
  - Registro de todos atendimentos e interações do suporte
  - Relatório exportável por usuário/instrutor/período
- **Permissão e Acesso**
  - Permissões granulares por função (admin master, financeiro, suporte, KYC)
  - Logs de acesso e operações administrativas

---
### 2.8 Comunicação: Chat & Notificações

#### 2.8.1 Chat Interno (Admin)

- Chat integrado ao painel admin para contato direto com instrutores e alunos.
- Lista de conversas recentes e busca por nome/ID de usuário.
- Histórico completo de mensagens trocadas, exibindo nome, horário e conteúdo.
- Permite anexar arquivos (imagens, PDFs, documentos de KYC, etc.).
- Notificações de mensagem nova (real-time).
- Logs de todas as interações para auditoria.
- Permissão: admins, suporte e financeiro podem acessar o chat, conforme papel.

#### 2.8.2 Central de Notificações

- Barra/painel para envio de notificações do admin para:
  - Todos os usuários (broadcast)
  - Segmentado: apenas instrutores, apenas alunos, usuários por cidade/estado/status
- Tipos de notificação: informativo, alerta de sistema, manutenção, promoções, aviso de atualização.
- Permite texto livre e anexos simples (imagem/banner).
- Registro de todas notificações enviadas: quem enviou, para quem, data/hora, conteúdo.
- Opção de agendamento de notificações para data/hora futura.
- Usuário recebe alerta no painel ou push (PWA), e na central de notificações do app.

---

**Instrução:**  
Adicionar estes itens à seção de funcionalidades do Módulo Admin.  
Ambos os recursos devem ser responsivos, auditáveis e acessíveis, integrados ao histórico de ações administrativas.
---
### 2.9 Integrações & Webhooks

#### 2.9.1 Gerenciamento de Integrações

- Tela de integrações acessível via menu lateral.
- **Lista de integrações disponíveis:** (ex: gov.br login, gateways de pagamento, serviços KYC, antifraude, analytics, notificações externas)
  - Nome da integração, status (ativa/inativa), data de criação, última atualização.
  - Busca e filtro por nome/status.
- **Cadastro/Edição de integração:**
  - Campos editáveis via painel para inserir/remover/atualizar:
    - Chaves de API (ex: abacatepay, mercado pago, etc.)
    - URLs de endpoints (callback/webhook)
    - Credenciais ou tokens (com campo de máscara e botão “ver” para admin master)
    - Status de ativação (habilitar/desabilitar sem deletar)
    - Permissões (quem pode editar/visualizar)
  - Logs de alteração de cada integração (quem/ação/data/hora)
- **Exemplo de integrações a suportar inicialmente:**
  - **Pagamentos:** abacatepay, mercado pago, stripe, etc.
  - **Governo:** gov.br (autenticação, validação KYC automática), CNH Digital
  - **Documentação & Antifraude:** serviços terceiros para checagem de documentos
  - **Notificações externas:** webhooks para integração com ERPs, sistemas de parceiros, analytics

#### 2.9.2 Webhooks

- **Tela dedicada a webhooks:**
  - Cadastro de endpoints webhooks por evento (pagamento, booking, aprovação, cancelamento, etc.)
  - Campos: ID, nome, URL, eventos assinados, status, data de criação.
  - Logs de chamadas (sucesso/erro, data/hora, payload).
  - Testar webhook manualmente (botão “testar” com payload simulado).
  - Permitir editar/desativar/remover webhooks pelo painel.
  - Busca e filtro por nome/URL/evento/status.
- **Requisitos não funcionais:**
  - Segurança (secret/token, autenticação por IP ou header custom)
  - Auditoria de todas alterações e chamadas

#### 2.9.3 Observações

- Nenhuma integração deve exigir alteração de código após deploy: todo ajuste via painel.
- Sistema preparado para adição de novos serviços/integradores no futuro, com logs e permissões.
- Campos sensíveis (chave/tokens) só editáveis por admin master.

---

**Instrução:**  
Adicione esta seção no PRD do painel Admin, após CMS e antes de monitoramento do sistema.  
Se precisar de wireframe textual dessa tela, é só pedir.

---
### 2.10 Módulo de Cupons & Afiliados

#### 2.10.1 Gestão de Cupons

- **Tela de configuração de cupons:**
  - Cadastro de novos cupons promocionais (código, tipo – desconto fixo/% –, validade, limite de uso, público-alvo: aluno/instrutor)
  - Edição, ativação/desativação e exclusão de cupons existentes
  - Histórico de uso (quem utilizou, quando, valor, status)
  - Relatórios exportáveis de uso por período e por campanha

#### 2.10.2 Gestão de Afiliados e Links de Indicação

- **Painel de afiliados:**  
  - Ativação/desativação global do programa de afiliados via painel (permitindo ativar em campanhas específicas)
  - Cadastro de novos afiliados (instrutores, parceiros, influenciadores)
  - Geração e gerenciamento de links únicos de afiliado para cada parceiro/instrutor
  - Controle de parâmetros: % de comissão (ex: padrão 3%, configurável por campanha ou afiliado)
  - Relatório de indicações:  
    - Quem indicou quem (ex: instrutor X indicou instrutor Y/aluno Z)
    - Valor movimentado pelas indicações (quantidade de agendamentos/vendas geradas)
    - Total de comissões geradas/pagas
  - Logs de alterações: quem ativou/desativou links, criou cupons, editou parâmetros
  - Permitir editar política de comissão e texto explicativo do programa pelo painel

#### 2.10.3 Observações

- Painel totalmente configurável, **sem depender de desenvolvedor**.
- Integração dos cupons e links de afiliado nos fluxos de cadastro/agendamento, com validação e aplicação automática.
- Exportação de relatórios para controle financeiro e marketing.
- Controle de permissão: apenas admins autorizados podem criar/editar/excluir cupons e links de afiliado.

---

**Instrução:**  
Adicionar este bloco ao PRD Admin, após Integrações & Webhooks.  
Se quiser wireframe textual dessa tela (disposição dos elementos, campos, botões), só pedir!


---
### 2.11 Módulo de Transações & Cobranças

#### 2.11.1 Dashboard de Transações

- Tela dedicada para consulta e auditoria de todas as transações do sistema:
  - **Filtros avançados:** por data, usuário (aluno/instrutor), status (paga, pendente, reembolsada, cancelada), tipo de operação (agendamento, saque, reembolso, comissão, afiliado)
  - Busca por nome, ID, CPF, email ou referência do pagamento
  - Visualização em tabela com colunas configuráveis:
    - ID da transação
    - Data/hora
    - Tipo (agendamento, saque, comissão, reembolso, afiliado, cupom)
    - Valor bruto, valor líquido (após taxas)
    - Status da transação
    - Usuário de origem/destino
    - Gateway utilizado (ex: abacatepay, mercado pago, etc.)
    - Link para detalhamento completo

#### 2.11.2 Relatório de Saques

- Listagem dos pedidos de saque realizados por instrutores ou afiliados:
  - Filtros por data, valor, status (pendente, processado, negado), instrutor/afiliado
  - Detalhes do saque: valor, destino (Pix, conta), data/hora, status, logs de processamento (quem aprovou/rejeitou)
  - Ação de aprovar/rejeitar saque manualmente pelo admin, com registro de justificativa

#### 2.11.3 Exportação & Logs

- Exportação de relatórios (CSV/PDF) para contabilidade, auditoria e conciliação bancária
- Logs detalhados de cada transação: criação, processamento, alteração de status, reembolso, chargeback
- Visualização rápida de tendências: total pago, pendente, processado, % de sucesso por gateway/período

#### 2.11.4 Observações

- Permissão granular: apenas admins autorizados podem aprovar saques ou editar status de transações
- Toda alteração crítica gera log e histórico de quem fez, quando e o que alterou
- Sistema preparado para futuras integrações com ERP/contabilidade

---
### 2.12 Configuração de Taxa Mínima de Serviço ao Aluno

- Tela específica para configuração da taxa mínima cobrada de cada aluno por agendamento de aula.
- **Campos configuráveis pelo admin:**
  - Valor mínimo fixo (R$) ou percentual (%) sobre o valor do serviço/agendamento.
  - Possibilidade de definir taxas diferentes por categoria de serviço (carro, moto, ônibus, caminhão) se necessário.
  - Histórico de alterações: quem alterou, quando, valor antigo/novo.
- Visualização clara do valor da taxa para o admin e exibição automática para o aluno no fluxo de agendamento.
- Permissão: apenas admin master pode alterar este campo.
- Toda alteração gera log e requer confirmação dupla.

---
#### Wireframe Textual – Módulo de Transações & Cobranças

##### 1. Estrutura Geral da Tela

- **Sidebar (lateral):**
  - Ícone/entrada “Transações” ou “Cobranças”
  - Subitens: Todas, Saques, Relatórios

- **Header (topo da tela):**
  - Título da página (“Transações & Cobranças”)
  - Filtros avançados (data, status, usuário, gateway)
  - Campo de busca (ID, nome, CPF, email, referência)

---

##### 2. Tabela de Transações

- Colunas principais:
  - ID
  - Data/Hora
  - Tipo (Agendamento, Saque, Comissão, Afiliado, Cupom, Reembolso)
  - Valor Bruto
  - Valor Líquido (após taxas/comissões)
  - Status (Paga, Pendente, Reembolsada, Cancelada, Processando)
  - Usuário de Origem/Destino (nome, tipo, link para perfil)
  - Gateway (abacatepay, mercado pago, etc.)
  - Ações (ver detalhes)

- **Ações rápidas na tabela:**
  - “Ver detalhes” abre modal ou lateral com todos dados da transação
  - Botão de exportar lista filtrada (CSV/PDF)
  - Se for saque pendente: botão para aprovar/rejeitar (confirmação via modal)

---

##### 3. Detalhamento da Transação

- Ao clicar em uma linha, abre um painel lateral/modal com:
  - Todos os campos da transação, inclusive logs de alteração
  - Botões: aprovar/rejeitar (se saque), copiar dados, exportar comprovante

---

##### 4. Relatório de Saques

- Subtela com tabela específica de saques:
  - Filtros por período, status, usuário
  - Colunas: ID do saque, data, valor, status, destino (Pix/conta), logs, ações (aprovar/rejeitar)
  - Histórico de todos os saques aprovados/rejeitados, quem processou

---

##### 5. Exportação & Logs

- Botão de exportar relatório (CSV/PDF) visível em todas telas
- Seção inferior com logs recentes de operações críticas
- Visualização gráfica (opcional): total transacionado por período/gateway/status

---

##### 6. Permissões

- Exibição/edição restrita conforme papel do admin logado
- Logs de quem fez, o que fez e quando, acessíveis via histórico detalhado

---

**Obs:**  
Tela responsiva, navegação fácil entre submódulos (transações gerais, saques, relatórios), feedback visual em todas operações.

---

**Fim do wireframe textual – Módulo de Transações & Cobranças**

---
## 3. Requisitos Não Funcionais

- **Responsividade total:** desktop, tablet, mobile
- **UX clara, acessível:** feedback visual em todas ações, tooltips e ajuda contextual
- **Auditoria completa:** logs de quem fez o quê, quando e por que
- **Segurança:** autenticação forte, sessões protegidas, criptografia de dados sensíveis
- **Zero dependência de dev para operações comuns:** todo ajuste via painel
- **Documentação embutida:** help/tooltips em cada seção sensível

---

## 4. Observações Finais

- Painel pronto para integrações futuras: automação de KYC, múltiplos gateways de pagamento, módulos avançados
- Logs e relatórios exportáveis para compliance e auditoria
- Nenhuma alteração estrutural (usuário, pagamento, CMS) deve depender de alteração de código após o deploy inicial

---

## 5. Wireframe Textual – Painel Admin HabilitFy

### 5.1 Estrutura Geral

- **Barra lateral (Sidebar) fixa à esquerda**  
  - Ícones/nome das seções: Dashboard, Instrutores, Alunos, KYC, Transações, Carteiras, CMS/Banners, Notificações, Chat, Configurações, Suporte.
  - Indicação de seção ativa (cor/efeito)
  - Botão para logout e menu do perfil do admin (avatar/role)

- **Barra superior (Header)**
  - Nome do painel/logo à esquerda
  - Botão de busca global
  - Notificações (ícone sineta) com contador
  - Acesso rápido à central de notificações e chat
  - Avatar/admin menu à direita

---

### 5.2 Tela: Dashboard

- **Topo:** Cards-resumo em horizontal (instrutores aprovados/pending, alunos ativos, aulas concluídas, volume financeiro, valor em carteira)
- **Centro:**  
  - **Mapa interativo do Brasil** (box grande, centro da tela):  
    - Bolhas coloridas por estado/cidade mostrando número de usuários (hover mostra detalhes)
    - Zoom, filtro por aluno/instrutor
- **Direita:**  
  - Gráfico de transações financeiras (linha/barras)
- **Base:**  
  - Alertas críticos (ex: servidor sobrecarregado, pendências KYC)
  - Lista rápida de notificações recentes

---

### 5.3 Tela: Lista de Instrutores

- **Filtro superior:** Status (approved/pending/banido), cidade, nome/ID, data cadastro
- **Tabela central:**  
  - Colunas: Nome, Foto, Status, Data, Cidade, Aulas, Carteira, Botão “Ver perfil”
- **Ação:**  
  - Ao clicar em “Ver perfil”, abre lateral ou modal detalhado

**Perfil do Instrutor**
- Topo: Foto, nome, status, botão de ação (aprovar/rejeitar KYC, reset senha, banir, editar, logs)
- Meio: Tabs/abas:
  - **Dados pessoais**
  - **Documentos enviados (lista com thumbs, status, botão aprovar/rejeitar, campo comentário)**
  - **Histórico de aulas/avaliações**
  - **Carteira (saldo, extrato, transferências, logs)**
  - **Logs de ação administrativa**

---

### 5.4 Tela: KYC Manual

- **Timeline/lista vertical dos instrutores pendentes**
- Cartão de cada instrutor:  
  - Selfie, documentos enviados (miniaturas), status geral, data/hora envio
  - Botão: Aprovar/Rejeitar individualmente cada doc, comentário obrigatório em rejeição
  - Histórico: lista de decisões (quem/ação/data/hora)

---

### 5.5 Tela: Alunos

- **Filtro:** Status, cidade, nome, data
- **Tabela:** Nome, foto, status, aulas realizadas, carteira, botão “Ver perfil”
- **Perfil do Aluno:**  
  - Dados pessoais, histórico de aulas/pagamentos, carteira, logs

---

### 5.6 Tela: Transações e Carteiras

- **Dashboard**: Total processado, receitas, valores retidos
- **Tabela:** Lista de transações (tipo, status, valor, usuário, data)
- **Carteiras:** Lista de usuários, saldo, histórico de movimentações, ação de ajuste/manual

---

### 5.7 Tela: CMS/Banners

- **Lista de banners:** Imagem, link, data início/fim, ordem, status (ativo/inativo)
- **Form de upload/edição:** Imagem, link, texto alternativo, período de exibição
- **Edição dinâmica:** Rodapé, política, termos (campo de texto editável no painel)
- **Personalização:** Cores, logo, favicon (upload/preview)

---

### 5.8 Tela: Central de Notificações

- **Lista de notificações enviadas:** Texto, segmento, data, autor, status
- **Form de envio:**  
  - Destinatários (todos, instrutores, alunos, filtro avançado)
  - Tipo de mensagem (informativo, alerta, promo)
  - Campo texto + upload imagem/banner
  - Opção de agendamento (data/hora)
- **Alertas em tempo real:** Pop-up/notificação no painel e no app

---

### 5.9 Tela: Chat Admin

- **Sidebar:** Lista de conversas (instrutores, alunos, busca)
- **Janela principal:**  
  - Histórico de mensagens (bubbles, data/hora, nome, arquivo anexado)
  - Campo para nova mensagem (texto + upload)
  - Status de online/offline do usuário
- **Logs:** Download/exportar histórico, logs de quem enviou o quê

---

### 5.10 Tela: Monitoramento do Sistema

- **Status:** Online/offline, uso de recursos (cards/gráfico), alertas críticos
- **Logs:** Lista/busca/exportação de eventos
- **Relatório de incidentes:** Cadastro, acompanhamento, resolução

---

### 5.11 Tela: Permissões e Equipe

- **Lista de admins:** Nome, e-mail, papel, status, último acesso
- **Gestão de papéis:** Admin master, financeiro, suporte, KYC, customizável
- **Logs de acessos e ações por admin**

---

**Obs:** Todos os wireframes priorizam responsividade, acessibilidade, feedback visual e navegação simples.

---



**Fim do PRD – Módulo ADMIN (DETALHADO)**

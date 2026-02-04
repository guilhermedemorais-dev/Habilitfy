# PRD – Cadastro de Instrutor – HabilitFy

## 1. Visão Geral

Página dedicada ao cadastro de novos instrutores,  
com fluxo prático, intuitivo e guiado por etapas (step-by-step),  
incluindo todas as validações/documentações necessárias para autenticação KYC.

---

## 2. Fluxo de Cadastro (Etapas)

### 2.1 Etapa 1: Dados Pessoais

- Campos:
    - Nome completo
    - CPF
    - Data de nascimento
    - Celular e e-mail
    - Endereço completo (CEP, cidade, bairro, rua)
- Validação de formato e obrigatoriedade
- Botão “Próximo”

---

### 2.2 Etapa 2: Foto e Documentos

- Upload de **selfie** (foto atual, boa iluminação)
- Upload de **documento oficial com foto** (RG ou CNH – frente e verso)
- Upload de **credencial Detran válida** (PDF ou imagem)
- Feedback visual do status de cada upload
- Botão “Próximo”

---

### 2.3 Etapa 3: Dados de Recebimento

- Campo para inserir **chave Pix** (validar formato)
- Indicar tipo de chave (aleatória, CPF, e-mail, telefone)
- Botão “Próximo”

---

### 2.4 Etapa 4: Cadastro de Veículos

- Para cada veículo (pode adicionar mais de um):
    - Tipo (carro, moto, ônibus, caminhão)
    - Placa, modelo, ano, cor
    - Upload de documentos obrigatórios (CRLV, laudo, seguro)
    - Upload de foto(s) do veículo
- Adicionar/remover veículos
- Botão “Próximo”

---

### 2.5 Etapa 5: Serviços Ofertados

- Seleção dos tipos de serviço (aula prática, aluguel de veículo, etc)
- Cadastro de preço/hora para cada categoria/serviço ofertado
- Descrição breve sobre experiência e disponibilidade
- Botão “Próximo”

---

### 2.6 Etapa 6: Confirmação e Revisão

- Exibir resumo de todas as informações fornecidas
- Checkbox de consentimento com termos, LGPD e política de privacidade
- Botão “Finalizar Cadastro”

---

## 3. Pós-Cadastro

- Mensagem de confirmação: “Seu cadastro foi enviado para análise. Você será notificado por e-mail/app quando aprovado.”
- Status do instrutor: **Pendente** até análise/admin
- Notificações de status e possibilidade de acompanhar andamento pelo app

---

## 4. UX/UI e Segurança

- Layout mobile-first, barras de progresso e feedback claro a cada etapa
- Uploads validados antes de avançar
- Salvar progresso parcial (para voltar depois, se possível)
- Mensagens de erro claras e acessíveis

---

## 5. Observações

- Cadastro só é finalizado com todos documentos válidos e consentimento LGPD
- Todo fluxo auditável (logs por etapa)
- Expansão futura: integração gov.br para validação automática de documentos

---




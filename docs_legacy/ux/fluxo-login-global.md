[Home / Landing Page]
 ├──> [Botão: Login / Entrar]
 │      ├──> [Página Login Global]
 │      │      ├──> [Login via e-mail/senha OU via OIDC (Google, gov.br se ativado)]
 │      │      │      ├──> [Login bem-sucedido]
 │      │      │      │      ├──> [Redireciona para dashboard aluno OU instrutor, conforme role]
 │      │      │      └──> [Login falhou]
 │      │      │             ├──> [Mensagem de erro, retry, opção de redefinir senha]
 │      │      │             └──> [Esqueci minha senha] → [Fluxo de recuperação]
 │      │      ├──> [Botão: “Cadastrar como Instrutor”]
 │      │      │      ├──> [Redireciona para página de cadastro instrutor (wizard, multi-etapas)]
 │      │      ├──> [Botão: “Cadastrar como Aluno”]
 │      │      │      ├──> [Redireciona para página de cadastro aluno (wizard, multi-etapas)]
 │      │      ├──> [Política de privacidade e termos de uso visíveis]
 │      │      └──> [Links úteis: suporte, dúvidas, contato]
 │      │
 │      └──> [Cadastro via social (OIDC)]
 │             ├──> [Permite registro automático via Google/gov.br]
 │             └──> [Solicita complementação de dados, se faltar info obrigatória]
 │
 └──> [Se usuário já logado, redireciona para dashboard correspondente]

---

[Fluxo de Cadastro Instrutor]
 ├──> [Página de cadastro (wizard prático, etapas separadas)]
 │      ├──> [1. Dados pessoais: nome, email, celular, senha]
 │      ├──> [2. Endereço completo, localização (para mapa)]
 │      ├──> [3. Upload de selfie, documentos (RG/CNH, comprovante de endereço, credencial Detran, docs do veículo)]
 │      ├──> [4. Cadastro de serviços: tipo de veículo, categoria de aula, preço/hora]
 │      ├──> [5. Cadastro de veículos: marca, modelo, placa, upload CRLV]
 │      ├──> [6. Cadastro de chave Pix para recebimento]
 │      ├──> [7. Revisão de dados e envio]
 │      ├──> [Confirmação de envio, status: “KYC pendente”]
 │      ├──> [Feedback visual: “Aguardando aprovação”]
 │      └──> [Notificação por email/app]
 ├──> [Se reprovar algum doc, fluxo de reenvio/correção com logs e feedback]
 ├──> [Após aprovação KYC, instrutor pode acessar dashboard e cadastrar serviços normalmente]
 ├──> [Permite pausar e retornar, dados salvos como rascunho]

---

[Fluxo de Cadastro Aluno]
 ├──> [Página de cadastro (wizard prático, etapas separadas)]
 │      ├──> [1. Dados pessoais: nome, email, celular, senha]
 │      ├──> [2. Endereço completo, localização]
 │      ├──> [3. Upload de selfie, documentos (RG/CNH, comprovante teórico, comprovante de endereço)]
 │      ├──> [4. Indicação de status (já habilitado? Sim/Não)]
 │      ├──> [5. Revisão de dados e envio]
 │      ├──> [Confirmação de envio, status: “KYC pendente”]
 │      ├──> [Feedback visual: “Aguardando aprovação”]
 │      └──> [Notificação por email/app]
 ├──> [Se reprovar algum doc, fluxo de reenvio/correção com logs e feedback]
 ├──> [Após aprovação KYC, aluno pode agendar aulas]
 ├──> [Permite pausar e retornar, dados salvos como rascunho]

---

[Recuperação de Senha]
 ├──> [Esqueci minha senha]
 │      ├──> [Solicita email cadastrado]
 │      ├──> [Envia código ou link de redefinição]
 │      ├──> [Usuário cria nova senha]
 │      ├──> [Feedback visual, retorna para login]
 │      └──> [Logs de recuperação]

---

[Exceções e Retornos]
 ├──> [Qualquer erro: mensagem clara, opção de retry]
 ├──> [Abandono do cadastro: mantém dados rascunho]
 ├──> [Bloqueio após múltiplas tentativas erradas]
 ├──> [Feedback visual (toast, modal, push) em toda ação relevante]
 ├──> [Possibilidade de voltar etapas, revisar antes de enviar]
 └──> [Menu de navegação para suporte, termos, contato em todo fluxo]

---

**Logs e Notificações**
- Toda ação registrada (cadastro, login, reprovação, recuperação de senha)
- Notificações automáticas para ações críticas
- Logs exportáveis para auditoria

---




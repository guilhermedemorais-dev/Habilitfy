# Fluxo – Mapa & Descoberta de Instrutores

## 1. Entrada

- Acesso pelo menu (“Mapa”) ou botão “Encontrar Instrutor Agora” na Home.

---

## 2. Exibição Inicial

- Mapa centralizado na localização do usuário (geolocalização via browser) ou ponto padrão (ex: RJ capital).
- Exibe pins/ícones dos instrutores ativos/aprovados em cada localidade.
- Se não encontrar localização: pede permissão manual ou oferece campo para CEP/bairro.

---

## 3. Filtros & Busca

- Filtros visuais acionados pelo botão flutuante (“Filtro”):
    - Tipo de serviço (carro, moto, ônibus, caminhão)
    - Avaliação mínima (nota)
    - Preço/hora (faixa)
    - Bairro, cidade, raio de distância
    - Disponibilidade (dia/horário)
    - Tipo de veículo do instrutor (próprio/alugado)
- Campo de busca livre (nome do instrutor, localidade)
- Estado dos filtros fica salvo em sessão/localStorage

---

## 4. Interação com o Mapa

- Clicar em um pin: mostra card-resumo do instrutor (nome, nota, foto, preço/hora, disponibilidade, botão “Ver Perfil”)
- Botão “Lista”: alterna visualização entre mapa e lista (mesmo filtro aplicado)
- No modo lista: ordena por relevância, preço, avaliação ou proximidade
- Hover/tap em pin destaca o instrutor na lista (e vice-versa)

---

## 5. Seleção e Navegação

- Ao clicar em “Ver Perfil”, direciona para a página de perfil do instrutor selecionado
    - [Fluxo do perfil do instrutor segue no fluxo-instrutor.md]
- Se perfil do instrutor aberto, opção para voltar ao mapa/lista sem perder filtros/posição

---

## 6. Agendamento

- No perfil do instrutor: botão “Agendar Aula”/“Solicitar Aula”
- Redireciona para fluxo de agendamento (pré-seleciona instrutor e serviço escolhido)

---

## 7. Exceções, Retornos e Feedback

- Sem instrutores no raio/filtro: exibe mensagem e sugere ampliar busca ou alterar filtros
- Erro de localização/falha no mapa: oferece fallback para busca manual (CEP/bairro)
- Feedback visual a cada interação (loading, sem resultados, filtro ativo, instrução)

---

## 8. Logs e Auditoria

- Todas interações de busca, filtros, cliques em instrutor, tentativas de agendamento são logadas (para analytics e auditoria)
- Logs exportáveis via painel admin

---

## 9. Regras Especiais

- Somente instrutores com KYC aprovado e disponibilidade ativa aparecem no mapa/lista
- Instrutor pode configurar localização e raio de atendimento no painel próprio
- Respeita privacidade: só mostra área aproximada (não exibe endereço exato do instrutor)

---

## 10. Observações

- Suporte a mobile/touch e desktop
- Atalhos para voltar à Home, acessar perfil/logar (se não autenticado)
- Possibilidade futura: clusterização de pins se houver muitos instrutores na região
- Feedback e tutorial curto na primeira visita ao mapa

---


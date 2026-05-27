# PRD Jurídico-Operacional — Hardening do KYC Habilitfy

## 1. Classificação da Feature

**Feature:** KYC / Verificação de Identidade  
**Sistema:** Habilitfy  
**Tipo:** Segurança, LGPD, antifraude, evidência legal e controle operacional  
**Prioridade:** P0  
**Status atual:** implementado parcialmente  
**Objetivo:** corrigir o KYC existente para operar com padrão jurídico de feature crítica.

---

## 2. Diagnóstico do Estado Atual

O sistema já possui:

- análise automatizada de selfie;
- análise de documento CNH/RG;
- extração de nome, CPF, data de nascimento e número de documento;
- comparação facial entre selfie e documento;
- cálculo de liveness;
- status de verificação;
- revisão manual;
- armazenamento de URLs de documentos;
- logs básicos de IP, user agent e device fingerprint;
- documentação legada de fluxo e PRD.

O problema não é ausência de KYC.

O problema é que o KYC ainda não está suficientemente blindado para:

- LGPD;
- auditoria;
- cadeia de custódia;
- solicitação judicial;
- retenção de dados sensíveis;
- justificativa de decisão manual;
- falha segura quando IA/provedor externo estiver indisponível.

---

## 3. Problema Jurídico Principal

O KYC coleta e processa dados de alto risco:

- selfie;
- imagem de documento;
- CPF;
- data de nascimento;
- possível biometria facial;
- dados de CNH/RG;
- IP;
- user agent;
- device fingerprint.

Pela LGPD, dado biométrico vinculado a pessoa natural é dado pessoal sensível; logo, o fluxo precisa seguir finalidade, necessidade, transparência, segurança, prevenção e responsabilização.

---

## 4. Objetivo da Correção

Transformar o KYC existente em um módulo juridicamente defensável, capaz de:

1. verificar identidade;
2. impedir fraude;
3. liberar ou bloquear uso da plataforma;
4. registrar decisões humanas e automatizadas;
5. preservar evidências em caso de incidente;
6. gerar dossiê auditável;
7. controlar acesso a documentos sensíveis;
8. permitir resposta formal à Justiça/autoridade competente;
9. garantir retenção e descarte adequados;
10. impedir autoaprovação insegura.

---

## 5. Escopo da Correção

### Dentro do escopo

- Corrigir fail-safe do KYC.
- Criar consentimento KYC destacado.
- Versionar aceite do usuário.
- Criar logs jurídicos imutáveis.
- Criar dossiê jurídico do usuário.
- Criar legal hold.
- Criar política de retenção.
- Reforçar RBAC para dados sensíveis.
- Impedir acesso indevido a documentos/selfies.
- Padronizar motivos de aprovação/reprovação.
- Registrar revisão manual com justificativa obrigatória.
- Criar fluxo de solicitação de exclusão/revisão.
- Atualizar documentação de LGPD.

### Fora do escopo

- Trocar todo o KYC por fornecedor pago.
- Garantir validade judicial absoluta.
- Substituir revisão jurídica profissional.
- Criar integração imediata com gov.br, Detran ou CNH Digital.

---

## 6. Correção P0 — Fail-Safe do KYC

### Problema

Hoje o código possui fallback permissivo quando a API Anthropic não está configurada.

Exemplo crítico:

- `analyzeSelfie` retorna `hasFace: true`, `quality: good`;
- `analyzeDocument` retorna `isValid: true`;
- `compareFaces` retorna `match: true`, `similarity: 0.90`.

Isso é perigoso juridicamente e operacionalmente.

### Regra nova

Se `ANTHROPIC_API_KEY` estiver ausente, inválida ou se a análise falhar:

```text
NUNCA aprovar automaticamente.
Enviar para requires_review.
Registrar motivo técnico.
Não expor erro sensível ao usuário.
```

### Critérios de aceite

* Sem provider, status final deve ser `requires_review`.
* Erro de IA deve gerar `requires_review`, não `approved`.
* Falha de parsing JSON deve gerar `requires_review`.
* Timeout deve gerar `requires_review`.
* Logs internos devem registrar causa técnica.
* Frontend deve mostrar mensagem neutra: "Sua verificação foi enviada para análise manual."

---

## 7. Estados Oficiais do KYC

Estados atuais:

```text
pending
processing
approved
rejected
requires_review
```

Estados necessários para padrão jurídico:

```text
not_started
consent_pending
pending
processing
requires_review
approved
rejected
resubmission_required
blocked_fraud
expired
legal_hold
deletion_requested
anonymized
```

### Regra

Nenhum status crítico pode ser alterado sem gerar evento de auditoria.

---

## 8. Consentimento KYC Destacado

Antes do upload de selfie/documento, o usuário deve aceitar uma tela específica:

> Para validar sua identidade, prevenir fraudes, proteger usuários da plataforma e permitir apuração de incidentes, coletaremos dados cadastrais, documento oficial, selfie e informações técnicas de acesso. Esses dados serão tratados conforme nossa Política de Privacidade e poderão ser preservados quando necessário para exercício regular de direitos, segurança, prevenção à fraude ou cumprimento de solicitação legal válida.

### Deve registrar

```text
user_id
consent_version
policy_version
consent_text_hash
accepted_at
ip_address
user_agent
device_fingerprint
source_screen
```

---

## 9. Decisão Manual Obrigatoriamente Justificada

Toda ação admin precisa registrar:

```text
admin_id
user_id
kyc_verification_id
previous_status
new_status
decision_type
reason_code
reason_text
review_notes
ip_address
user_agent
created_at
```

### Proibido

* Aprovar sem motivo.
* Reprovar sem motivo.
* Bloquear sem motivo.
* Visualizar documento sem log.
* Exportar dados sem justificativa.

---

## 10. Motivos Padronizados

### Aprovação

```text
DOCUMENT_AND_SELFIE_MATCH
MANUAL_REVIEW_CONFIRMED
LOW_RISK_VERIFICATION
INSTRUCTOR_CREDENTIAL_VALIDATED
STUDENT_DOCUMENT_VALIDATED
```

### Reprovação

```text
DOCUMENT_UNREADABLE
DOCUMENT_INVALID
SELFIE_INVALID
FACE_MISMATCH
LIVENESS_FAILED
CPF_MISMATCH
DUPLICATE_DOCUMENT
SUSPECTED_FRAUD
INSTRUCTOR_CREDENTIAL_INVALID
VEHICLE_DOCUMENT_INVALID
UNDERAGE_OR_NOT_ELIGIBLE
```

### Revisão manual

```text
AI_PROVIDER_UNAVAILABLE
LOW_CONFIDENCE_RESULT
INCONSISTENT_DATA
DOCUMENT_NEEDS_HUMAN_REVIEW
MULTIPLE_ATTEMPTS
TECHNICAL_ANALYSIS_FAILED
```

---

## 11. Dossiê Jurídico do Usuário

Criar funcionalidade interna para gerar dossiê em caso de incidente, fraude ou solicitação formal.

### Conteúdo mínimo

```text
user_id
nome
cpf
email
telefone
tipo de usuário: aluno/instrutor
status KYC atual
histórico de KYC
documentos enviados
hash dos arquivos
resultado de OCR
score facial
score de liveness
motivos de rejeição
decisões manuais
admin responsável
logs de acesso
IP e user agent relevantes
versão do consentimento
versão da política
histórico de exportações
legal_hold status
```

### Critérios

* Apenas perfil `legal_compliance` ou `admin_supervisor`.
* Toda visualização gera log.
* Toda exportação exige motivo/protocolo.
* Exportação deve gerar hash SHA-256 do pacote.
* Dados exportados devem ter timestamp.

---

## 12. Legal Hold

Criar flag de preservação legal.

```text
legal_hold: boolean
legal_hold_reason: text
legal_hold_protocol: varchar
legal_hold_created_by
legal_hold_created_at
legal_hold_released_by
legal_hold_released_at
```

### Regras

* Usuário em `legal_hold` não pode ter documentos apagados por rotina automática.
* Exclusão solicitada pelo usuário fica suspensa enquanto houver base jurídica.
* Toda ativação/desativação exige justificativa.

---

## 13. Retenção e Descarte

Tabela recomendada para validar com jurídico:

| Dado            |                                  Retenção | Regra                                       |
| --------------- | ----------------------------------------: | ------------------------------------------- |
| Consentimento   | enquanto conta existir + prazo defensável | prova de aceite                             |
| Status KYC      |                    enquanto conta existir | necessário para operação                    |
| Documento bruto |                      menor prazo possível | apagar após validação se não houver disputa |
| Selfie bruta    |                      menor prazo possível | dado sensível/biométrico                    |
| Hash do arquivo |                          prazo antifraude | manter sem reconstruir imagem               |
| Logs de decisão |                prazo jurídico/operacional | auditoria                                   |
| Legal hold      |                          até encerramento | preservação obrigatória                     |

---

## 14. Segurança de Arquivos

Hoje `saveBase64Image` salva em `/uploads/kyc/{userId}/{filename}` e retorna URL relativa.

Correção necessária:

* não usar URL pública direta;
* armazenar fora de diretório público;
* servir arquivo por endpoint autenticado;
* exigir permissão;
* gerar log de visualização;
* aplicar assinatura temporária quando necessário;
* criptografar arquivo em repouso;
* gerar hash do arquivo original;
* não sobrescrever evidência anterior.

---

## 15. RBAC Obrigatório

Perfis:

```text
support_viewer
kyc_reviewer
kyc_supervisor
legal_compliance
system_admin
```

### Permissões

| Perfil           | Pode ver status |  Pode ver docs |    Pode aprovar | Pode exportar dossiê | Pode legal hold |
| ---------------- | --------------: | -------------: | --------------: | -------------------: | --------------: |
| support_viewer   |             sim |            não |             não |                  não |             não |
| kyc_reviewer     |             sim |            sim |             sim |                  não |             não |
| kyc_supervisor   |             sim |            sim |             sim |                  não |             sim |
| legal_compliance |             sim |            sim | não obrigatório |                  sim |             sim |
| system_admin     |         técnico | não por padrão |             não |                  não |             não |

---

## 16. Eventos de Auditoria Obrigatórios

```text
KYC_CONSENT_ACCEPTED
KYC_STARTED
KYC_DOCUMENT_UPLOADED
KYC_SELFIE_UPLOADED
KYC_AI_ANALYSIS_STARTED
KYC_AI_ANALYSIS_FAILED
KYC_AI_ANALYSIS_COMPLETED
KYC_SENT_TO_MANUAL_REVIEW
KYC_ADMIN_VIEWED_DOCUMENT
KYC_APPROVED
KYC_REJECTED
KYC_RESUBMISSION_REQUESTED
KYC_BLOCKED_FRAUD
KYC_LEGAL_HOLD_ENABLED
KYC_LEGAL_HOLD_DISABLED
KYC_DOSSIER_VIEWED
KYC_DOSSIER_EXPORTED
KYC_DELETION_REQUESTED
KYC_DATA_DELETED
KYC_DATA_ANONYMIZED
```

---

## 17. Alterações de Banco Necessárias

Criar/adaptar tabelas:

```text
kyc_consents
kyc_audit_events
kyc_legal_holds
kyc_dossier_exports
kyc_retention_jobs
```

Adicionar em `kyc_verifications`:

```text
consent_id
risk_level
risk_reasons
provider_status
provider_error_code
file_hash_selfie
file_hash_document_front
file_hash_document_back
storage_provider
encryption_status
retention_until
legal_hold
```

---

## 18. Testes Obrigatórios

### Testes P0

* Sem `ANTHROPIC_API_KEY`, KYC vai para `requires_review`.
* Erro Claude Vision não aprova usuário.
* JSON inválido da IA não aprova usuário.
* Usuário sem consentimento não envia documento.
* Admin não aprova sem motivo.
* Suporte não acessa documento.
* Exportação sem protocolo é bloqueada.
* Legal hold impede exclusão.
* Documento não abre por URL pública.
* Toda visualização de documento gera log.

---

## 19. Definition of Done

```text
QA_STATUS = PASS
SECURITY_STATUS = PASS
PRIVACY_STATUS = PASS
AUDIT_STATUS = PASS
LEGAL_REVIEW_STATUS = PENDING_EXTERNAL_REVIEW | APPROVED
```

Para produção:

```text
QA_STATUS = PASS
SECURITY_STATUS = PASS
PRIVACY_STATUS = PASS
AUDIT_STATUS = PASS
LEGAL_REVIEW_STATUS = APPROVED
```

---

## 20. Ordem de Execução

### Fase 1 — P0 Segurança

1. Corrigir fail-safe.
2. Remover fallback permissivo.
3. Adicionar testes do provider ausente.
4. Bloquear autoaprovação insegura.

### Fase 2 — LGPD

1. Consentimento destacado.
2. Versionamento de política.
3. Registro de aceite.
4. Política de retenção.

### Fase 3 — Auditoria

1. Eventos imutáveis.
2. Logs de visualização.
3. Logs de decisão.
4. Motivos padronizados.

### Fase 4 — Jurídico

1. Dossiê.
2. Exportação com hash.
3. Legal hold.
4. Protocolo de solicitação.

### Fase 5 — Hardening

1. Criptografia.
2. Storage privado.
3. RBAC refinado.
4. Testes de autorização.

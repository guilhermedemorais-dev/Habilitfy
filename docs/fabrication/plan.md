# Bugfix Plan: API Instructors (Erro 400)

## Contexto
A API `POST /api/instructors` retorna 400 Bad Request ao enviar o formulário de cadastro.
A causa suspeita é a validação dos campos `pricePerHour`, `lat` e `lng`, que são numéricos no banco mas podem estar chegando como strings do frontend (Multipart Form Data).

## Research
- **Arquivo:** `server/routes.ts`
- **Schema:** `shared/schema.ts` (`insertInstructorSchema`)
- **Problema:** Zod espera `number` ou `decimal`, mas `formData` envia `string`.

## Solução Proposta
1. Atualizar o Zod schema em `shared/schema.ts` para usar `z.coerce.number()` ou similar, permitindo input string que vira número.
2. OU converter manualmente no `server/routes.ts` antes de passar pro parse (já existe algo assim, verificar se está correto).

## Implementação Técnica
- Arquivo: `shared/schema.ts`
- Alteração: Usar `z.coerce.number()` para campos `pricePerHour`, `lat`, `lng` dentro do `createInsertSchema` ou extendendo-o.
- Exemplo:
```typescript
export const insertInstructorSchema = createInsertSchema(instructors).extend({
  pricePerHour: z.coerce.number().min(0),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});
```

## Verificação
- Testar cadastro de instrutor via UI (que usa FormData).
- Verificar se `req.body` é processado corretamente sem erro 400.

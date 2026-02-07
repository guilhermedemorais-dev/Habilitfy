# Plano: Captura Remota de Foto via QR Code

## Visão Geral
Permitir que usuários desktop sem webcam tirem foto no celular e continuem o cadastro no desktop.

```
┌─────────────┐    QR Code    ┌─────────────┐
│   Desktop   │ ───────────► │   Celular   │
│  (aguarda)  │               │ (tira foto) │
└──────┬──────┘               └──────┬──────┘
       │         Polling             │
       ▼                             ▼
    ┌──────────────────────────────────┐
    │     Backend (capture-sessions)   │
    └──────────────────────────────────┘
```

---

## Fase 1: Backend

### [NEW] Tabela `capture_sessions` em `shared/schema.ts`
```typescript
export const captureSessionStatusEnum = mysqlEnum('capture_session_status', [
  'pending',
  'completed',
  'expired',
]);

export const captureSessions = mysqlTable("capture_sessions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  sessionToken: varchar("session_token", { length: 64 }).notNull().unique(),
  imageData: text("image_data"), // Base64 da imagem
  status: captureSessionStatusEnum.default('pending').notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### [MODIFY] Endpoints em `server/routes.ts`

#### `POST /api/capture-session` - Criar sessão
```typescript
app.post("/api/capture-session", async (req, res) => {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  
  const session = await db.insert(captureSessions).values({
    sessionToken,
    expiresAt,
  });
  
  res.json({ sessionToken, expiresAt });
});
```

#### `GET /api/capture-session/:token` - Verificar status
```typescript
app.get("/api/capture-session/:token", async (req, res) => {
  const session = await db.query.captureSessions.findFirst({
    where: eq(captureSessions.sessionToken, req.params.token),
  });
  
  if (!session || session.expiresAt < new Date()) {
    return res.status(404).json({ error: "Session not found or expired" });
  }
  
  res.json({ 
    status: session.status,
    imageData: session.imageData 
  });
});
```

#### `POST /api/capture-session/:token/upload` - Upload da foto
```typescript
app.post("/api/capture-session/:token/upload", async (req, res) => {
  const { imageData } = req.body; // Base64
  
  await db.update(captureSessions)
    .set({ imageData, status: 'completed', updatedAt: new Date() })
    .where(eq(captureSessions.sessionToken, req.params.token));
  
  res.json({ success: true });
});
```

---

## Fase 2: Página Mobile

### [NEW] Rota `/capture/:token` em `client/src/pages/RemoteCapture.tsx`
Página simples e otimizada para mobile:
- Título: "Tirar Foto"
- Botão para ativar câmera
- Preview da foto
- Botão "Enviar" → chama `/api/capture-session/:token/upload`
- Tela de sucesso: "Foto enviada! Volte ao computador."

---

## Fase 3: Desktop - WebcamCapture

### [MODIFY] `client/src/components/WebcamCapture.tsx`

#### Novo estado:
```typescript
const [remoteSessionToken, setRemoteSessionToken] = useState<string | null>(null);
const [isPolling, setIsPolling] = useState(false);
```

#### Lógica quando câmera falha:
```typescript
// No catch do fallback de câmera:
const createRemoteSession = async () => {
  const res = await fetch('/api/capture-session', { method: 'POST' });
  const { sessionToken } = await res.json();
  setRemoteSessionToken(sessionToken);
  startPolling(sessionToken);
};
```

#### Polling:
```typescript
const startPolling = (token: string) => {
  setIsPolling(true);
  const interval = setInterval(async () => {
    const res = await fetch(`/api/capture-session/${token}`);
    const { status, imageData } = await res.json();
    if (status === 'completed' && imageData) {
      clearInterval(interval);
      setCapturedImage(imageData);
      onCapture(imageData);
      setIsPolling(false);
    }
  }, 2000); // Polling a cada 2s
};
```

#### QR Code com URL correta:
```typescript
<QRCodeSVG value={`${window.location.origin}/capture/${remoteSessionToken}`} />
```

---

## Arquivos a Criar/Modificar

| Ação | Arquivo |
|------|---------|
| MODIFY | `shared/schema.ts` - Adicionar tabela `captureSessions` |
| MODIFY | `server/routes.ts` - Adicionar 3 endpoints |
| NEW | `client/src/pages/RemoteCapture.tsx` - Página mobile |
| MODIFY | `client/src/App.tsx` - Adicionar rota `/capture/:token` |
| MODIFY | `client/src/components/WebcamCapture.tsx` - Integrar polling |

---

## Verificação
- [ ] Testar fluxo: desktop → QR → mobile → foto → desktop recebe
- [ ] Testar expiração de sessão (10 min)
- [ ] Testar quando câmera funciona (não deve mostrar QR)

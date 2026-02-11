# PRD - Product Requirements Document
## Habilitfy.com.br - Melhorias de Performance e Escalabilidade V2.0

---

## 1. Contexto do Produto

### 1.1 Visão Geral
O **Habilitfy.com.br** é uma plataforma web que conecta alunos de autoescola com instrutores de direção em tempo real, utilizando um modelo de marketplace similar ao Uber. A plataforma permite que alunos encontrem instrutores próximos através de um mapa interativo e solicitem aulas de forma instantânea.

**URL do Produto:** https://habilitfy.com.br

### 1.2 Stack Tecnológica Atual

#### 🎨 Frontend (SPA)
- **Framework:** React 19 + Vite 7 (Latest)
- **Linguagem:** TypeScript 5.6
- **Estilização:** Tailwind CSS v4 + `tailwindcss-animate`
- **Componentes:** shadcn/ui (baseado em Radix UI Primitives)
- **Ícones:** Lucide React
- **Forms:** React Hook Form + Zod
- **Mapas:** Leaflet / React Leaflet
- **Biometria:** face-api.js (Detecção facial local)

#### ⚙️ Backend (API REST)
- **Runtime:** Node.js (Express 4)
- **Linguagem:** TypeScript (executado via `tsx` em dev, `node` em prod)
- **ORM:** Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- **Banco de Dados:** MySQL (Driver `mysql2`) - Hospedado na **Hostinger hPanel**
- **Autenticação:** Passport.js (Strategies: Local + Google OAuth 2.0)
- **Sessão:** `express-session` com `express-mysql-session` (persistência no banco)
- **Emails:** Nodemailer

#### 🛠️ Tooling & Infra
- **Build:** esbuild (Server) + Vite (Client)
- **Testes:** Vitest (Unitários) + Playwright (E2E)
- **Validação:** `zod` + `cpf-cnpj-validator`
- **IA:** OpenAI SDK (para futuras integrações)
- **Hospedagem:** Hostinger hPanel (VPS Linux)

### 1.3 Problema Atual
O projeto está em produção, mas enfrenta limitações de performance e escalabilidade que podem comprometer a experiência do usuário à medida que a base cresce:

- **Busca geográfica lenta:** Cálculo de distância para cada instrutor individualmente sem indexação
- **Ausência de cache:** Queries repetitivas sobrecarregam o MySQL
- **Processamento síncrono:** Solicitações de aula bloqueiam o servidor
- **Falta de filas:** Notificações e jobs processados inline
- **Logging básico:** Dificuldade para debug e monitoramento em produção
- **Índices não otimizados:** Queries lentas em tabelas grandes
- **Sem real-time otimizado:** Atualizações de localização via polling ou WebSocket básico

### 1.4 Objetivo do PRD
Este documento especifica as melhorias técnicas necessárias para transformar o Habilitfy em uma plataforma escalável, performática e confiável, utilizando bibliotecas e padrões validados por Big Techs (Uber, Google, Vercel, Microsoft), **mantendo compatibilidade total com a stack atual** (Drizzle ORM, MySQL, TypeScript, React 19).

---

## 2. Objetivos de Negócio

### 2.1 Objetivos Primários
- **Reduzir tempo de busca de instrutores** de ~2s para <100ms
- **Suportar 1.000+ usuários simultâneos** sem degradação
- **Aumentar taxa de conversão** (solicitação → aula confirmada) em 25%
- **Reduzir custos de infraestrutura** via cache e otimizações
- **Melhorar observabilidade** para debug rápido em produção

### 2.2 Métricas de Sucesso (KPIs)

| Métrica | Atual | Meta | Prazo |
|---------|-------|------|-------|
| Tempo de busca de instrutores | ~2000ms | <100ms | Sprint 2 |
| Tempo de criação de aula | ~500ms | <200ms | Sprint 3 |
| Disponibilidade do sistema | 95% | 99.9% | Sprint 4 |
| Cache hit rate | 0% | >80% | Sprint 2 |
| Tempo de resposta P95 | ~3s | <500ms | Sprint 3 |
| Usuários simultâneos suportados | ~100 | 1000+ | Sprint 4 |

### 2.3 Impacto Esperado
- **Experiência do usuário:** Busca instantânea de instrutores
- **Retenção:** Menos abandono por lentidão
- **Escalabilidade:** Crescimento sem reescrever o sistema
- **Custos:** Menor uso de CPU/RAM via cache
- **Confiabilidade:** Sistema resiliente a picos de tráfego

---

## 3. Escopo das Melhorias

### 3.1 Incluído neste PRD ✅

#### 3.1.1 Sistema de Busca Geográfica de Alta Performance
**Problema:** Buscar instrutores próximos é lento (loop calculando distância para cada um)

**Solução:** Implementar indexação geoespacial hexagonal (H3) da Uber

**Tecnologias:**
- **H3 (Uber)** - Sistema de indexação hexagonal
  - Repositório principal: https://github.com/uber/h3
  - Binding Node.js: https://github.com/uber/h3-js
  - Documentação: https://h3geo.org/
  - Instalação: `npm install h3-js`

- **Geolib** - Cálculos geoespaciais complementares
  - Repositório: https://github.com/manuelbieh/geolib
  - Uso: Cálculo de distância precisa, validação de coordenadas
  - Instalação: `npm install geolib`

**Integração com Drizzle ORM:**
```typescript
// Adicionar coluna h3Index na tabela instrutores
import { varchar } from 'drizzle-orm/mysql-core';

export const instrutores = mysqlTable('instrutores', {
  // ... campos existentes
  h3Index: varchar('h3_index', { length: 20 }).index(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
});
```

**Benefícios:**
- Busca 100x mais rápida (O(1) vs O(n))
- Usado em produção pela Uber para milhões de motoristas
- Escalável para milhares de instrutores
- Zero impacto no schema atual do Drizzle

#### 3.1.2 Sistema de Cache Distribuído com Redis
**Problema:** Queries repetitivas sobrecarregam MySQL na Hostinger

**Solução:** Cache em Redis com invalidação inteligente

**Tecnologias:**
- **ioredis** - Cliente Redis robusto e moderno
  - Repositório: https://github.com/redis/ioredis
  - Features: Connection pooling, pub/sub, cluster support, TypeScript nativo
  - Instalação: `npm install ioredis`
  - Documentação: https://github.com/redis/ioredis#readme

**Opções de Redis para Hostinger:**
1. **Redis Cloud** (Recomendado - Free tier 30MB): https://redis.com/try-free/
2. **Upstash Redis** (Serverless, free tier): https://upstash.com/
3. **Redis no próprio VPS** (se tiver acesso SSH)

**Integração com Drizzle:**
```typescript
import Redis from 'ioredis';
import { db } from './drizzle';

const redis = new Redis(process.env.REDIS_URL);

// Wrapper para queries com cache
async function getInstrutoresComCache(h3Indexes: string[]) {
  const cacheKey = `instrutores:${h3Indexes.join(',')}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const resultado = await db.select()
    .from(instrutores)
    .where(inArray(instrutores.h3Index, h3Indexes));
  
  await redis.setex(cacheKey, 300, JSON.stringify(resultado)); // 5min TTL
  return resultado;
}
```

**Benefícios:**
- Redução de 80%+ nas queries ao MySQL
- Tempo de resposta <10ms para dados cacheados
- Suporta milhões de operações/segundo
- Compatível com VPS Hostinger

#### 3.1.3 Sistema de Filas e Processamento Assíncrono
**Problema:** Processamento síncrono bloqueia requisições

**Solução:** Filas com BullMQ + Redis

**Tecnologias:**
- **BullMQ** - Sistema de filas moderno (sucessor do Bull)
  - Repositório: https://github.com/taskforcesh/bullmq
  - Documentação: https://docs.bullmq.io/
  - Features: Retry automático, priorização, scheduling, rate limiting
  - Instalação: `npm install bullmq`

- **@bull-board/express** - UI para monitorar filas
  - Repositório: https://github.com/felixmosh/bull-board
  - Instalação: `npm install @bull-board/express @bull-board/api`

**Casos de uso:**
- Envio de notificações push
- Processamento de solicitações de aula
- Jobs agendados (limpeza de dados, relatórios)
- Envio de emails via Nodemailer
- Processamento de imagens (face-api.js no backend)

**Integração com Express + TypeScript:**
```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL);

// Fila de solicitações
export const filaSolicitacoes = new Queue('solicitacoes', { connection });

// Worker
const worker = new Worker('solicitacoes', async (job) => {
  const { alunoId, instrutorId, dataHora } = job.data;
  
  // Processar solicitação
  await db.insert(aulas).values({
    alunoId,
    instrutorId,
    dataHora,
    status: 'PENDENTE'
  });
  
  // Adicionar job de notificação
  await filaNotificacoes.add('push', { instrutorId, tipo: 'nova-solicitacao' });
}, { connection });
```

**Benefícios:**
- Resposta imediata ao usuário (job enfileirado)
- Retry automático em falhas (3 tentativas com exponential backoff)
- Processamento paralelo
- Monitoramento via Bull Board em `/admin/queues`

#### 3.1.4 WebSocket Otimizado para Real-Time
**Problema:** Atualizações de localização via polling ou Socket.IO básico

**Solução:** Socket.IO com rooms e namespaces otimizados

**Tecnologias:**
- **Socket.IO** (já pode estar no projeto, mas otimizar uso)
  - Repositório: https://github.com/socketio/socket.io
  - Cliente: https://github.com/socketio/socket.io-client
  - Usado por: Microsoft, Trello, Zendesk
  - Instalação: `npm install socket.io socket.io-client`

**Arquitetura de Rooms:**
```typescript
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL }
});

// Namespace para instrutores
const instrutorNamespace = io.of('/instrutor');

instrutorNamespace.on('connection', (socket) => {
  const instrutorId = socket.handshake.auth.userId;
  
  // Entrar na room da cidade
  socket.join(`cidade:${instrutor.cidade}`);
  
  // Atualizar localização
  socket.on('localizacao', async (data) => {
    const h3Index = h3.geoToH3(data.lat, data.lng, 9);
    
    // Atualizar no banco (Drizzle)
    await db.update(instrutores)
      .set({ latitude: data.lat, longitude: data.lng, h3Index })
      .where(eq(instrutores.id, instrutorId));
    
    // Invalidar cache
    await redis.del(`instrutores:*`);
    
    // Broadcast para alunos da mesma cidade
    socket.to(`cidade:${instrutor.cidade}`).emit('instrutor-atualizado', {
      id: instrutorId,
      lat: data.lat,
      lng: data.lng
    });
  });
});
```

**Benefícios:**
- Latência <50ms para eventos
-Rooms para segmentar comunicação (por cidade, por status)
- Fallback automático para polling se WebSocket falhar
- Suporta milhares de conexões simultâneas

#### 3.1.5 Logging Estruturado e Observabilidade
**Problema:** Logs desestruturados dificultam debug em produção

**Solução:** Logging JSON estruturado com Pino

**Tecnologias:**
- **Pino** - Logger de alta performance (5x-10x mais rápido que Winston)
  - Repositório: https://github.com/pinojs/pino
  - HTTP middleware: https://github.com/pinojs/pino-http
  - Pretty print dev: https://github.com/pinojs/pino-pretty
  - Usado por: Fastify, Uber, Netflix
  - Instalação: `npm install pino pino-http pino-pretty`

**Integração com Express + TypeScript:**
```typescript
import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

// Middleware Express
app.use(pinoHttp({ logger }));

// Usar em controllers
logger.info({ instrutorId, alunoId }, 'Aula criada com sucesso');
logger.error({ err, userId }, 'Erro ao processar solicitação');
```

**Estrutura de logs:**
```json
{
  "level": 30,
  "time": 1707398400000,
  "pid": 12345,
  "hostname": "habilitfy-server",
  "req": {
    "id": "req-uuid-123",
    "method": "POST",
    "url": "/api/aulas"
  },
  "instrutorId": "uuid-instrutor",
  "alunoId": "uuid-aluno",
  "msg": "Aula criada com sucesso"
}
```

**Benefícios:**
- Logs estruturados em JSON (fácil parsing)
- Request ID automático para rastrear requisições
- Performance mínima (assíncrono por padrão)
- Fácil integração com: Datadog, CloudWatch, Logtail, BetterStack

#### 3.1.6 Validação Robusta com Zod (já está no projeto!)
**Status:** ✅ Já implementado

**Melhoria:** Centralizar schemas e compartilhar entre frontend/backend

**Estrutura sugerida:**
```typescript
// shared/schemas/aula.schema.ts
import { z } from 'zod';

export const criarAulaSchema = z.object({
  instrutorId: z.string().uuid(),
  dataHora: z.string().datetime(),
  duracao: z.number().min(30).max(240),
  tipo: z.enum(['PRATICA', 'TEORICA', 'SIMULADOR']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  endereco: z.string().min(5).max(255)
});

export type CriarAulaDTO = z.infer<typeof criarAulaSchema>;
```

**Usar no backend:**
```typescript
import { criarAulaSchema } from '../shared/schemas';

app.post('/api/aulas', async (req, res) => {
  const resultado = criarAulaSchema.safeParse(req.body);
  
  if (!resultado.success) {
    return res.status(400).json({ 
      erro: 'Dados inválidos',
      detalhes: resultado.error.format()
    });
  }
  
  // Processar com dados validados (resultado.data)
});
```

**Usar no frontend (React Hook Form):**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { criarAulaSchema } from '../shared/schemas';

const { register, handleSubmit } = useForm({
  resolver: zodResolver(criarAulaSchema)
});
```

#### 3.1.7 Notificações Push com Firebase
**Problema:** Ausência de notificações push nativas

**Solução:** Firebase Cloud Messaging (FCM)

**Tecnologias:**
- **Firebase Admin SDK** - Backend
  - Repositório: https://github.com/firebase/firebase-admin-node
  - Documentação: https://firebase.google.com/docs/cloud-messaging
  - Instalação: `npm install firebase-admin`

- **Firebase JS SDK** - Frontend
  - Repositório: https://github.com/firebase/firebase-js-sdk
  - Instalação: `npm install firebase`

**Setup Backend (TypeScript):**
```typescript
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

export async function enviarNotificacao(userId: string, payload: any) {
  const user = await db.select().from(usuarios).where(eq(usuarios.id, userId));
  
  if (!user.fcmToken) return;
  
  await admin.messaging().send({
    token: user.fcmToken,
    notification: {
      title: payload.titulo,
      body: payload.mensagem
    },
    data: payload.data
  });
}
```

**Setup Frontend (React):**
```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Pedir permissão e obter token
const token = await getToken(messaging, { 
  vapidKey: 'seu-vapid-key' 
});

// Enviar token para backend
await api.post('/api/users/fcm-token', { token });
```

**Casos de uso:**
- Instrutor recebe solicitação de aula
- Aluno recebe confirmação/recusa
- Lembrete de aula próxima (15min antes)
- Notificação de cancelamento

**Benefícios:**
- Suporte Web + Android + iOS
- Entrega garantida mesmo com app fechado
- Rich notifications (botões, imagens)
- Analytics integrado

#### 3.1.8 State Management Frontend com SWR
**Problema:** Re-fetching desnecessário de dados no React

**Solução:** SWR da Vercel para cache automático

**Tecnologias:**
- **SWR** - React Hooks para data fetching
  - Repositório: https://github.com/vercel/swr
  - Documentação: https://swr.vercel.app/
  - Criado por: Vercel (criadores do Next.js)
  - Instalação: `npm install swr`

**Integração com React 19 + TypeScript:**
```typescript
import useSWR from 'swr';
import type { CriarAulaDTO } from '../shared/schemas';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function ListaInstrutores() {
  const { lat, lng } = useGeolocation();
  
  const { data, error, mutate } = useSWR<Instrutor[]>(
    lat && lng ? `/api/instrutores/proximos?lat=${lat}&lng=${lng}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Atualiza a cada 10s
      revalidateOnFocus: true,
      dedupingInterval: 5000
    }
  );
  
  if (error) return <ErrorState />;
  if (!data) return <Skeleton />;
  
  return (
    <div>
      {data.map(i => <CardInstrutor key={i.id} {...i} />)}
      <Button onClick={() => mutate()}>🔄 Atualizar</Button>
    </div>
  );
}
```

**Benefícios:**
- Cache automático no client
- Revalidação em background
- Deduplicação de requests
- Mutation otimista
- TypeScript nativo

#### 3.1.9 Otimização de Mapas (Leaflet já está!)
**Status:** ✅ Leaflet já implementado

**Melhorias sugeridas:**

1. **Clustering para muitos marcadores:**
```bash
npm install react-leaflet-cluster
```

```typescript
import MarkerClusterGroup from 'react-leaflet-cluster';

<MapContainer>
  <MarkerClusterGroup>
    {instrutores.map(i => (
      <Marker key={i.id} position={[i.latitude, i.longitude]} />
    ))}
  </MarkerClusterGroup>
</MapContainer>
```

2. **Canvas renderer para performance:**
```typescript
import L from 'leaflet';

const canvasRenderer = L.canvas({ padding: 0.5 });

<Marker renderer={canvasRenderer} />
```

**Repositórios úteis:**
- Leaflet: https://github.com/Leaflet/Leaflet
- React Leaflet: https://github.com/PaulLeCam/react-leaflet
- Clustering: https://github.com/YUzhva/react-leaflet-cluster

#### 3.1.10 Drizzle ORM - Schema Otimizado
**Status:** ✅ Drizzle já implementado

**Melhorias de schema:**

**Adicionar campos para H3 e geolocalização:**
```typescript
import { mysqlTable, varchar, decimal, index, datetime, mysqlEnum } from 'drizzle-orm/mysql-core';

export const instrutores = mysqlTable('instrutores', {
  id: varchar('id', { length: 36 }).primaryKey(),
  // ... campos existentes
  
  // Geolocalização
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  h3Index: varchar('h3_index', { length: 20 }),
  cidade: varchar('cidade', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  
  // Controle de disponibilidade
  disponivel: mysqlEnum('disponivel', ['true', 'false']).default('true'),
  ultimaLocalizacao: datetime('ultima_localizacao'),
  
  // Stats
  avaliacao: decimal('avaliacao', { precision: 3, scale: 2 }).default('5.00'),
  totalAulas: int('total_aulas').default(0)
}, (table) => ({
  h3Idx: index('h3_idx').on(table.h3Index),
  disponivelIdx: index('disponivel_idx').on(table.disponivel),
  cidadeIdx: index('cidade_idx').on(table.cidade),
  compositeIdx: index('composite_idx').on(table.h3Index, table.disponivel)
}));
```

**Migration para adicionar campos:**
```typescript
// drizzle/migrations/0001_add_geo_fields.sql
ALTER TABLE instrutores 
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8),
ADD COLUMN h3_index VARCHAR(20),
ADD INDEX h3_idx (h3_index),
ADD INDEX composite_idx (h3_index, disponivel);
```

**Query otimizada com Drizzle:**
```typescript
import { eq, inArray, and, gte } from 'drizzle-orm';

// Buscar instrutores por H3
const resultado = await db.select()
  .from(instrutores)
  .where(
    and(
      inArray(instrutores.h3Index, hexagonosVizinhos),
      eq(instrutores.disponivel, 'true'),
      gte(instrutores.avaliacao, 4.0)
    )
  )
  .limit(20);
```

**Documentação Drizzle:**
- Repositório: https://github.com/drizzle-team/drizzle-orm
- Docs: https://orm.drizzle.team/docs/overview
- MySQL: https://orm.drizzle.team/docs/get-started-mysql

---

## 4. Arquitetura Proposta

### 4.1 Diagrama de Arquitetura Completo

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 SPA)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │    SWR     │  │ Socket.IO  │  │   Leaflet  │  │React Hook │ │
│  │   Cache    │  │   Client   │  │    Maps    │  │Form + Zod │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  shadcn/ui │  │face-api.js │  │  Firebase  │  │  Lucide   │ │
│  │ Components │  │ (Biometria)│  │  Messaging │  │   Icons   │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
│                                                                  │
│  Build: Vite 7 + TypeScript 5.6 + Tailwind CSS v4              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌──────────────────────────────────────────────────────────────────┐
│              API GATEWAY (Express 4 + TypeScript)                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Passport.js│  │    Pino    │  │    Zod     │  │   CORS    │ │
│  │Google OAuth│  │   Logger   │  │ Validation │  │ Middleware│ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
│  ┌────────────┐  ┌────────────┐                                 │
│  │   express  │  │   helmet   │                                 │
│  │  -session  │  │  Security  │                                 │
│  └────────────┘  └────────────┘                                 │
│                                                                  │
│  Build: esbuild + tsx (dev) / node (prod)                       │
└──────────────────────────────────────────────────────────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────────────────┐
│  Socket.IO    │  │     BullMQ     │  │   Service Layer          │
│   Server      │  │    Workers     │  │  ┌────────────────────┐  │
│               │  │                │  │  │ GeoService (H3)    │  │
│ - Namespaces  │  │ - Notificações │  │  │ NotifService (FCM) │  │
│ - Rooms       │  │ - Emails       │  │  │ AuthService        │  │
│ - Events      │  │ - Cleanup Jobs │  │  │ AulaService        │  │
│               │  │ - Bull Board   │  │  └────────────────────┘  │
└───────────────┘  └────────────────┘  └──────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Redis (ioredis)     │
              │                       │
              │  - H3 geo cache       │
              │  - Sessions           │
              │  - Bull queues        │
              │  - Pub/Sub            │
              │                       │
              │  Provider: Upstash/   │
              │  Redis Cloud          │
              └───────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│              DATA LAYER (Drizzle ORM)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ instrutores│  │   alunos   │  │   aulas    │  │avaliações│  │
│  │            │  │            │  │            │  │          │  │
│  │ - h3Index  │  │            │  │            │  │          │  │
│  │ - lat/lng  │  │            │  │            │  │          │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
│                                                                  │
│  Driver: mysql2 (connection pooling)                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   MySQL Database      │
                  │                       │
                  │  - Indexes (H3)       │
                  │  - Spatial Index      │
                  │  - Foreign Keys       │
                  │  - express-session    │
                  │                       │
                  │  Hostinger hPanel     │
                  │  (VPS MySQL)          │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  External Services    │
                  │                       │
                  │  - Firebase FCM       │
                  │  - Nodemailer (Email) │
                  │  - OpenAI (futuro)    │
                  └───────────────────────┘
```

### 4.2 Fluxo de Dados Crítico: Busca de Instrutores

```
1. Aluno abre mapa no React
   └─> useGeolocation() obtém (lat, lng)

2. SWR faz request automático
   └─> useSWR(`/api/instrutores/proximos?lat=-22.9&lng=-43.1&raio=5`)

3. Express recebe request
   └─> Middleware Pino loga request
   └─> Middleware Passport valida JWT

4. Backend verifica cache Redis
   └─> const cached = await redis.get("instrutores:-22.9:-43.1:5")
       ├─> HIT: Retorna JSON em <10ms ✅
       └─> MISS: Continua para passo 5

5. Backend calcula H3 index
   └─> const h3Index = h3.geoToH3(lat, lng, 9)
   └─> const hexagonos = h3.kRing(h3Index, Math.ceil(raio / 0.5))

6. Query Drizzle com índice H3
   └─> const instrutores = await db.select()
         .from(instrutores)
         .where(inArray(instrutores.h3Index, hexagonos))
         .where(eq(instrutores.disponivel, 'true'))

7. Filtrar por distância exata (Geolib)
   └─> geolib.getDistance() para cada resultado
   └─> Ordenar por score (40% distância + 40% avaliação + 20% preço)

8. Salvar no Redis
   └─> await redis.setex(cacheKey, 300, JSON.stringify(resultado))

9. Retornar JSON
   └─> res.json(instrutores)
   └─> Pino loga response time

10. Frontend (SWR) cacheia automaticamente
    └─> Atualiza mapa Leaflet com marcadores
    └─> Re-valida em background após 10s
```

**Performance esperada:** <100ms total

### 4.3 Fluxo de Dados Crítico: Solicitação de Aula

```
1. Aluno preenche formulário
   └─> React Hook Form + Zod validation no client

2. Submit envia POST
   └─> fetch('/api/aulas', { body: JSON.stringify(dados) })

3. Express recebe request
   └─> Middleware Pino loga
   └─> Middleware Passport valida auth

4. Validação Zod no backend
   └─> const resultado = criarAulaSchema.safeParse(req.body)
   ├─> INVÁLIDO: 400 Bad Request com detalhes
   └─> VÁLIDO: Continua

5. Verificar disponibilidade (cache primeiro)
   └─> const key = `disponibilidade:${instrutorId}:${dataHora}`
   └─> const disponivel = await redis.get(key)
   ├─> CACHE HIT: Usa valor cacheado
   └─> CACHE MISS: Query Drizzle + cachear resultado

6. Criar job na fila BullMQ
   └─> await filaSolicitacoes.add('criar-aula', {
         alunoId, instrutorId, dataHora, ...
       }, {
         attempts: 3,
         backoff: { type: 'exponential', delay: 2000 }
       })

7. Resposta imediata ao aluno
   └─> res.status(202).json({ 
         mensagem: "Solicitação enviada ao instrutor!",
         jobId: job.id 
       })

--- Background Processing (BullMQ Worker) ---

8. Worker processa job
   └─> Drizzle: Criar registro na tabela `aulas`
   └─> Status: 'PENDENTE'
   └─> Invalidar cache de disponibilidade

9. Adicionar job de notificação
   └─> await filaNotificacoes.add('push', {
         userId: instrutorId,
         tipo: 'nova-solicitacao',
         data: { aulaId, alunoNome }
       })

10. Worker de notificação
    └─> Firebase Admin SDK: enviar push
    └─> Socket.IO: emitir evento para instrutor online
    └─> Nodemailer: enviar email de confirmação

11. Instrutor recebe (app ou web)
    └─> Push notification
    └─> WebSocket real-time se online
    └─> Email como fallback

12. Instrutor responde
    └─> PATCH /api/aulas/:id/status { status: 'CONFIRMADA' }
    └─> Drizzle UPDATE
    └─> Invalidar caches relacionados
    └─> Notificar aluno via push + socket
    └─> SWR revalida automaticamente no frontend
```

**Performance esperada:** <200ms até job enfileirado

---

## 5. Stack de Dependências Atualizada

### 5.1 Backend (`package.json`)

```json
{
  "name": "habilitfy-backend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "esbuild src/server.ts --bundle --platform=node --outfile=dist/server.js",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate:mysql",
    "db:migrate": "drizzle-kit push:mysql",
    "db:studio": "drizzle-kit studio",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    
    "drizzle-orm": "^0.29.0",
    "mysql2": "^3.9.0",
    
    "express-session": "^1.17.3",
    "express-mysql-session": "^3.0.0",
    
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "passport-google-oauth20": "^2.0.0",
    "bcrypt": "^5.1.1",
    
    "socket.io": "^4.6.1",
    
    "ioredis": "^5.3.2",
    "bullmq": "^5.1.0",
    "@bull-board/express": "^5.10.0",
    "@bull-board/api": "^5.10.0",
    
    "h3-js": "^4.1.0",
    "geolib": "^3.3.4",
    
    "zod": "^3.22.4",
    "cpf-cnpj-validator": "^1.0.3",
    
    "pino": "^8.19.0",
    "pino-http": "^9.0.0",
    "pino-pretty": "^10.3.1",
    
    "firebase-admin": "^12.0.0",
    
    "nodemailer": "^6.9.8",
    
    "date-fns": "^3.3.1",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.6.0",
    "esbuild": "^0.20.0",
    "drizzle-kit": "^0.20.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.16",
    "@types/bcrypt": "^5.0.2",
    "@types/passport": "^1.0.16",
    "@types/nodemailer": "^6.4.14",
    "vitest": "^1.2.1",
    "@vitest/coverage-v8": "^1.2.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.20.0",
    "@typescript-eslint/parser": "^6.20.0"
  }
}
```

### 5.2 Frontend (`frontend/package.json`)

```json
{
  "name": "habilitfy-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.21.3",
    
    "swr": "^2.2.4",
    "axios": "^1.6.5",
    
    "socket.io-client": "^4.6.1",
    
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "react-leaflet-cluster": "^2.1.0",
    
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    
    "face-api.js": "^0.22.2",
    
    "firebase": "^10.7.2",
    
    "lucide-react": "^0.312.0",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    
    "date-fns": "^3.3.1"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "typescript": "^5.6.0",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss-animate": "^1.0.7",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/leaflet": "^1.9.8",
    "vitest": "^1.2.1",
    "@playwright/test": "^1.40.0",
    "eslint": "^8.56.0"
  }
}
```

---

## 6. Configuração de Ambiente

### 6.1 Variáveis de Ambiente (`.env`)

```bash
# ============================================
# DATABASE (Hostinger MySQL)
# ============================================
DATABASE_URL="mysql://usuario:senha@host-mysql.hostinger.com:3306/habilitfy_db"
DB_HOST="host-mysql.hostinger.com"
DB_PORT=3306
DB_USER="usuario_habilitfy"
DB_PASSWORD="senha_segura"
DB_NAME="habilitfy_db"

# ============================================
# REDIS (Upstash ou Redis Cloud)
# ============================================
# Opção 1: Upstash Redis (Serverless)
REDIS_URL="rediss://default:senha@your-redis.upstash.io:6379"

# Opção 2: Redis Cloud
# REDIS_HOST="redis-12345.c123.us-east-1-2.ec2.cloud.redislabs.com"
# REDIS_PORT=12345
# REDIS_PASSWORD="sua-senha-redis"

# ============================================
# JWT & SESSION
# ============================================
JWT_SECRET="gere-um-secret-complexo-aqui-min-32-chars"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="outro-secret-diferente-para-sessions"

# ============================================
# GOOGLE OAUTH 2.0
# ============================================
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefg123456"
GOOGLE_CALLBACK_URL="https://habilitfy.com.br/api/auth/google/callback"

# ============================================
# FIREBASE (Push Notifications)
# ============================================
FIREBASE_PROJECT_ID="habilitfy-prod"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@habilitfy-prod.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0B...\n-----END PRIVATE KEY-----\n"
FIREBASE_VAPID_KEY="BH8rJKT..." # Para Web Push

# ============================================
# EMAIL (Nodemailer)
# ============================================
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="noreply@habilitfy.com.br"
EMAIL_PASSWORD="senha-app-gmail-16-digitos"
EMAIL_FROM="HabilitFy <noreply@habilitfy.com.br>"

# ============================================
# MAPBOX (opcional, se usar react-map-gl)
# ============================================
VITE_MAPBOX_TOKEN="pk.eyJ1IjoieW91ciIsImEiOiJjbGFiY2RlZiJ9.xyz"

# ============================================
# APP CONFIG
# ============================================
NODE_ENV="production"
PORT=3000
FRONTEND_URL="https://habilitfy.com.br"
API_URL="https://api.habilitfy.com.br"

# ============================================
# LOGS
# ============================================
LOG_LEVEL="info" # debug | info | warn | error

# ============================================
# OPENAI (futuro)
# ============================================
OPENAI_API_KEY="sk-proj-..."
```

### 6.2 Setup Redis (Opção Upstash - Recomendada)

**Por que Upstash?**
- ✅ Free tier: 10.000 comandos/dia
- ✅ Serverless (paga por uso)
- ✅ TLS nativo
- ✅ Dashboard web
- ✅ Zero config de infraestrutura

**Como configurar:**
1. Criar conta: https://upstash.com/
2. Create Database → Choose region (us-east-1 mais próximo do Brasil)
3. Copiar `REDIS_URL` (formato `rediss://...`)
4. Colar no `.env`

**Código de conexão:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

await redis.connect();
```

### 6.3 Setup Firebase (Push Notifications)

**Passo a passo:**

1. **Criar projeto:** https://console.firebase.google.com/
   - Criar projeto "HabilitFy"
   - Adicionar app Web

2. **Gerar Service Account:**
   - Project Settings → Service Accounts
   - Generate New Private Key (baixar JSON)
   - Extrair: `project_id`, `client_email`, `private_key`

3. **Configurar Cloud Messaging:**
   - Cloud Messaging → Web Push certificates
   - Generate Key Pair (copiar VAPID key)

4. **Frontend (`firebase-messaging-sw.js` na pasta `public/`):**
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "...",
  authDomain: "habilitfy-prod.firebaseapp.com",
  projectId: "habilitfy-prod",
  messagingSenderId: "...",
  appId: "..."
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

---

## 7. Roadmap de Implementação

### Sprint 1: Fundação (Semana 1-2)

**Objetivos:**
- Setup Redis + BullMQ
- Logging com Pino
- Validação Zod centralizada

**Tasks:**

**Backend:**
- [ ] Instalar: `ioredis`, `bullmq`, `pino`, `pino-http`
- [ ] Configurar conexão Redis (Upstash)
- [ ] Setup Pino logger + middleware Express
- [ ] Criar pasta `/shared/schemas` para Zod schemas
- [ ] Migrar validações existentes para Zod
- [ ] Configurar Bull Board em `/admin/queues`

**Código exemplo:**
```typescript
// src/lib/redis.ts
import Redis from 'ioredis';
import { logger } from './logger';

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

redis.on('error', (err) => logger.error({ err }, 'Redis error'));
await redis.connect();
logger.info('Redis connected');

// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

// src/server.ts
import pinoHttp from 'pino-http';
app.use(pinoHttp({ logger }));
```

**Métricas de sucesso:**
- [ ] Redis conectado e funcional
- [ ] Logs estruturados em JSON
- [ ] Bull Board acessível
- [ ] Validações Zod centralizadas

---

### Sprint 2: Busca Geográfica (Semana 3-4)

**Objetivos:**
- Implementar H3 indexing
- Cache Redis de instrutores
- Otimizar queries Drizzle

**Tasks:**

**Backend:**
- [ ] Instalar: `h3-js`, `geolib`
- [ ] Migration Drizzle: adicionar `h3_index`, `latitude`, `longitude`
- [ ] Service: `GeoService.ts` com funções H3
- [ ] Endpoint: `GET /api/instrutores/proximos` com cache
- [ ] Job BullMQ: atualizar H3 index em background
- [ ] Índices MySQL otimizados

**Frontend:**
- [ ] Hook: `useInstrutoresProximos()` com SWR
- [ ] Otimizar renderização Leaflet (clustering)

**Código exemplo:**
```typescript
// src/services/geo.service.ts
import h3 from 'h3-js';
import { getDistance } from 'geolib';
import { db } from '../db';
import { instrutores } from '../db/schema';
import { inArray, eq } from 'drizzle-orm';
import { redis } from '../lib/redis';

export class GeoService {
  static RESOLUTION = 9; // ~500m hexagons
  
  static async buscarInstrutoresProximos(
    lat: number, 
    lng: number, 
    raioKm: number = 5
  ) {
    const cacheKey = `instrutores:${lat.toFixed(3)}:${lng.toFixed(3)}:${raioKm}`;
    
    // 1. Tentar cache
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // 2. Calcular hexágonos
    const h3Index = h3.geoToH3(lat, lng, this.RESOLUTION);
    const kRings = Math.ceil(raioKm / 0.5);
    const hexagonos = h3.kRing(h3Index, kRings);
    
    // 3. Query Drizzle
    const resultado = await db.select()
      .from(instrutores)
      .where(
        inArray(instrutores.h3Index, hexagonos),
        eq(instrutores.disponivel, 'true')
      );
    
    // 4. Filtrar por distância exata
    const filtrados = resultado
      .map(i => ({
        ...i,
        distancia: getDistance(
          { latitude: lat, longitude: lng },
          { latitude: Number(i.latitude), longitude: Number(i.longitude) }
        ) / 1000 // converter para km
      }))
      .filter(i => i.distancia <= raioKm)
      .sort((a, b) => this.calcularScore(a) - this.calcularScore(b))
      .slice(0, 20);
    
    // 5. Cachear (5min)
    await redis.setex(cacheKey, 300, JSON.stringify(filtrados));
    
    return filtrados;
  }
  
  static calcularScore(instrutor: any) {
    const distanciaScore = 1 - (instrutor.distancia / 10);
    const avaliacaoScore = Number(instrutor.avaliacao) / 5;
    const precoScore = 1 - ((Number(instrutor.precoHora) - 50) / 100);
    
    return (distanciaScore * 0.4) + (avaliacaoScore * 0.4) + (precoScore * 0.2);
  }
  
  static atualizarH3Index(lat: number, lng: number) {
    return h3.geoToH3(lat, lng, this.RESOLUTION);
  }
}

// src/routes/instrutores.routes.ts
import { Router } from 'express';
import { GeoService } from '../services/geo.service';

const router = Router();

router.get('/proximos', async (req, res) => {
  const { lat, lng, raio } = req.query;
  
  const instrutores = await GeoService.buscarInstrutoresProximos(
    Number(lat),
    Number(lng),
    Number(raio) || 5
  );
  
  res.json({ total: instrutores.length, instrutores });
});

export default router;
```

**Frontend:**
```typescript
// src/hooks/useInstrutoresProximos.ts
import useSWR from 'swr';
import { useGeolocation } from './useGeolocation';

export function useInstrutoresProximos(raio = 5) {
  const { latitude, longitude } = useGeolocation();
  
  const { data, error, mutate } = useSWR(
    latitude && longitude 
      ? `/api/instrutores/proximos?lat=${latitude}&lng=${longitude}&raio=${raio}`
      : null,
    fetcher,
    {
      refreshInterval: 10000, // 10s
      revalidateOnFocus: true,
      dedupingInterval: 5000
    }
  );
  
  return {
    instrutores: data?.instrutores || [],
    isLoading: !error && !data,
    error,
    refresh: mutate
  };
}
```

**Métricas de sucesso:**
- [ ] Busca em <100ms (95% das requests)
- [ ] Cache hit rate >70%
- [ ] Índices H3 criados para todos instrutores
- [ ] Leaflet renderizando 100+ marcadores sem lag

---

### Sprint 3: Filas e Notificações (Semana 5-6)

**Objetivos:**
- Sistema de filas BullMQ
- Firebase Push Notifications
- WebSocket otimizado

**Tasks:**

**Backend:**
- [ ] Setup Firebase Admin SDK
- [ ] Criar filas: `solicitacoes`, `notificacoes`, `emails`
- [ ] Workers para cada fila
- [ ] Endpoint: `POST /api/aulas` com fila
- [ ] Socket.IO com namespaces e rooms
- [ ] Tabela `fcm_tokens` no Drizzle

**Frontend:**
- [ ] Setup Firebase Messaging
- [ ] Solicitar permissão de notificações
- [ ] Enviar FCM token para backend
- [ ] Listener de notificações

**Código exemplo:**
```typescript
// src/queues/solicitacoes.queue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { db } from '../db';
import { aulas } from '../db/schema';
import { logger } from '../lib/logger';

const connection = redis;

export const filaSolicitacoes = new Queue('solicitacoes', { connection });

export const workerSolicitacoes = new Worker('solicitacoes', async (job) => {
  const { alunoId, instrutorId, dataHora, ...rest } = job.data;
  
  logger.info({ jobId: job.id }, 'Processando solicitação de aula');
  
  // 1. Criar aula
  const [aula] = await db.insert(aulas).values({
    alunoId,
    instrutorId,
    dataHora: new Date(dataHora),
    status: 'PENDENTE',
    ...rest
  }).returning();
  
  // 2. Invalidar cache
  await redis.del(`disponibilidade:${instrutorId}:*`);
  
  // 3. Enfileirar notificação
  await filaNotificacoes.add('push', {
    userId: instrutorId,
    tipo: 'nova-solicitacao',
    data: { aulaId: aula.id }
  });
  
  return aula;
}, { connection });

workerSolicitacoes.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Solicitação processada com sucesso');
});

workerSolicitacoes.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Falha ao processar solicitação');
});

// src/services/notification.service.ts
import admin from 'firebase-admin';
import { db } from '../db';
import { usuarios } from '../db/schema';
import { eq } from 'drizzle-orm';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

export class NotificationService {
  static async enviarPush(userId: string, payload: {
    titulo: string;
    mensagem: string;
    data?: any;
  }) {
    const [user] = await db.select()
      .from(usuarios)
      .where(eq(usuarios.id, userId));
    
    if (!user?.fcmToken) {
      logger.warn({ userId }, 'Usuário sem FCM token');
      return;
    }
    
    await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title: payload.titulo,
        body: payload.mensagem
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'habilitfy-alerts'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });
    
    logger.info({ userId }, 'Push notification enviada');
  }
}
```

**Frontend:**
```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
});

export const messaging = getMessaging(app);

export async function solicitarPermissaoNotificacoes() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    
    // Enviar token para backend
    await api.post('/api/users/fcm-token', { token });
    
    return token;
  }
}

// Listener de notificações em foreground
onMessage(messaging, (payload) => {
  console.log('Notificação recebida:', payload);
  
  // Mostrar toast ou atualizar UI
  toast({
    title: payload.notification?.title,
    description: payload.notification?.body
  });
});
```

**Métricas de sucesso:**
- [ ] Jobs processados em <500ms
- [ ] Retry automático funcionando
- [ ] Push notifications entregues em <3s
- [ ] Bull Board mostrando métricas
- [ ] WebSocket com <100ms de latência

---

### Sprint 4: Otimizações Finais (Semana 7-8)

**Objetivos:**
- Testes automatizados
- Monitoramento em produção
- Deploy otimizado

**Tasks:**

- [ ] Testes unitários (Vitest) - cobertura >70%
- [ ] Testes E2E (Playwright) - fluxos críticos
- [ ] Setup monitoramento (BetterStack ou Logtail)
- [ ] Docker Compose para dev
- [ ] CI/CD (GitHub Actions)
- [ ] Documentação API (Swagger/OpenAPI)

**Métricas de sucesso:**
- [ ] Cobertura de testes >70%
- [ ] Deploy automatizado
- [ ] Monitoramento ativo
- [ ] Documentação completa

---

## 8. Métricas de Performance

### 8.1 Benchmarks Esperados

| Endpoint | Antes | Depois | Melhoria |
|----------|-------|--------|----------|
| GET /instrutores/proximos | ~2000ms | <100ms | 20x |
| POST /aulas | ~500ms | <200ms | 2.5x |
| WebSocket latency | ~200ms | <50ms | 4x |
| Cache hit rate | 0% | >80% | ∞ |

### 8.2 Monitoramento

**Opções gratuitas/baratas:**
1. **BetterStack** (ex-Logtail): https://betterstack.com/ - 1GB logs/mês grátis
2. **Axiom**: https://axiom.co/ - 500MB/mês grátis
3. **Highlight.io**: https://highlight.io/ - Monitoramento full-stack grátis

**Setup BetterStack + Pino:**
```typescript
import pino from 'pino';

export const logger = pino({
  transport: {
    target: '@logtail/pino',
    options: { sourceToken: process.env.LOGTAIL_TOKEN }
  }
});
```

---

## 9. Checklist de Deploy

### 9.1 Pre-Deploy

- [ ] Todas as ENVs configuradas
- [ ] Redis configurado (Upstash)
- [ ] Firebase configurado
- [ ] MySQL migrations rodadas
- [ ] Índices criados
- [ ] Testes passando
- [ ] Build funcionando

### 9.2 Deploy

- [ ] Build: `npm run build`
- [ ] Copiar `dist/` para servidor
- [ ] Instalar dependências de prod
- [ ] PM2 ou systemd para manter app rodando
- [ ] Nginx como reverse proxy
- [ ] SSL configurado (Let's Encrypt)

### 9.3 Post-Deploy

- [ ] Health check: `GET /health`
- [ ] Logs no BetterStack
- [ ] Bull Board acessível (autenticado)
- [ ] Redis conectado
- [ ] WebSocket funcionando
- [ ] Push notifications testadas

---

## 10. Recursos e Links

### 10.1 Documentações Oficiais

**Core Stack:**
- Drizzle ORM: https://orm.drizzle.team/
- TypeScript: https://www.typescriptlang.org/docs/
- React 19: https://react.dev/
- Vite: https://vitejs.dev/

**Novas Bibliotecas:**
- H3 (Uber): https://h3geo.org/
- ioredis: https://github.com/redis/ioredis
- BullMQ: https://docs.bullmq.io/
- Pino: https://getpino.io/
- SWR: https://swr.vercel.app/
- Socket.IO: https://socket.io/docs/
- Firebase: https://firebase.google.com/docs/

### 10.2 Repositórios de Referência

**Uber Open Source:**
- H3: https://github.com/uber/h3
- H3-js: https://github.com/uber/h3-js
- Deck.gl: https://github.com/visgl/deck.gl
- React-Map-GL: https://github.com/visgl/react-map-gl

**Performance & Logs:**
- Pino: https://github.com/pinojs/pino
- ioredis: https://github.com/redis/ioredis

**Queues:**
- BullMQ: https://github.com/taskforcesh/bullmq
- Bull Board: https://github.com/felixmosh/bull-board

**Validação:**
- Zod: https://github.com/colinhacks/zod
- CPF/CNPJ: https://github.com/carvalhoviniciusluiz/cpf-cnpj-validator

**Mapas:**
- Leaflet: https://github.com/Leaflet/Leaflet
- React Leaflet: https://github.com/PaulLeCam/react-leaflet
- Clustering: https://github.com/YUzhva/react-leaflet-cluster

**Geolocalização:**
- Geolib: https://github.com/manuelbieh/geolib

**Notificações:**
- Firebase Admin: https://github.com/firebase/firebase-admin-node
- Firebase JS SDK: https://github.com/firebase/firebase-js-sdk

**State Management:**
- SWR: https://github.com/vercel/swr
- React Hook Form: https://github.com/react-hook-form/react-hook-form

**Real-time:**
- Socket.IO: https://github.com/socketio/socket.io
- Socket.IO Client: https://github.com/socketio/socket.io-client

**Testes:**
- Vitest: https://github.com/vitest-dev/vitest
- Playwright: https://github.com/microsoft/playwright

**Emails:**
- Nodemailer: https://github.com/nodemailer/nodemailer

### 10.3 Projetos Clone para Estudo

- Uber Clone completo: https://github.com/iamnadhu/uber-clone
- Airbnb Clone (Drizzle): https://github.com/AntonioErdeljac/next13-airbnb-clone
- Booking System: https://github.com/topics/booking-system
- Real-time Tracking: https://github.com/hypertrack/hypertrack-live-android

---

## 11. Conclusão

Este PRD define um roadmap claro para evoluir o **Habilitfy.com.br** de um MVP funcional para uma plataforma escalável e performática, utilizando as melhores práticas e bibliotecas validadas por Big Techs.

**Principais melhorias:**
1. ✅ Busca geográfica 20x mais rápida (H3)
2. ✅ Cache Redis reduzindo 80% das queries
3. ✅ Sistema de filas para processamento assíncrono
4. ✅ Push notifications profissionais
5. ✅ Logging estruturado para observabilidade
6. ✅ WebSocket otimizado para real-time
7. ✅ State management inteligente no frontend

**Compatibilidade total com stack atual:**
- ✅ Drizzle ORM mantido
- ✅ TypeScript em todo projeto
- ✅ React 19 + Vite
- ✅ MySQL na Hostinger
- ✅ Leaflet para mapas
- ✅ shadcn/ui preservado

**Próximos passos:**
1. Revisar este PRD com a equipe
2. Priorizar sprints conforme recursos
3. Começar por Sprint 1 (fundação)
4. Iterar com base em métricas

---

**Documento criado em:** 08/02/2026  
**Versão:** 2.0  
**Autor:** Equipe HabilitFy  
**Projeto:** https://habilitfy.com.br
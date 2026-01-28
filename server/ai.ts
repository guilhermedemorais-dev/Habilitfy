import OpenAI from "openai";
import { storage } from "./storage";

// =============================================================================
// AI Chat Service for HabilitFy ChatCommerce
// =============================================================================

const SYSTEM_PROMPT = `Você é o Assistente Virtual da HabilitFy, uma plataforma de aulas práticas de direção.
Seu papel é ajudar alunos e instrutores com:

1. **Suporte ao Aluno:**
   - Tirar dúvidas sobre como agendar aulas
   - Explicar o processo de pagamento
   - Ajudar a encontrar instrutores disponíveis
   - Orientar sobre o check-in/check-out via QR Code
   - Responder sobre avaliações e feedback

2. **Suporte ao Instrutor:**
   - Esclarecer dúvidas sobre recebimentos
   - Ajudar com gestão de disponibilidade
   - Orientar sobre o processo de aprovação KYC
   - Explicar o funcionamento do split de pagamento

3. **Agendamento de Ponto de Encontro:**
   - Sugerir locais seguros para encontro
   - Ajudar a coordenar horários
   - Confirmar detalhes da aula

**Diretrizes:**
- Seja sempre educado, prestativo e profissional
- Use português brasileiro informal mas respeitoso
- Se não souber a resposta, direcione para o suporte humano
- Nunca invente informações que não tenha certeza
- Mantenha respostas concisas (máximo 3-4 frases quando possível)
- Use emojis ocasionalmente para tornar a conversa mais amigável

**Informações da Plataforma:**
- Pagamento via Pix ou Cartão (AbacatePay)
- Taxa mínima de serviço: R$ 5,00
- Aulas confirmadas com QR Code
- Instrutores passam por verificação KYC
`;

interface AIMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface AIConfigOverrides {
    apiKey?: string | null;
    model?: string | null;
    maxTokens?: number;
}

const resolveAIConfig = (overrides?: AIConfigOverrides) => {
    const apiKey = overrides?.apiKey ?? process.env.OPENAI_API_KEY;
    const model = overrides?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const maxTokens = overrides?.maxTokens ?? 500;
    return { apiKey, model, maxTokens };
};

export async function getAIIntegrationConfig() {
    const environment = process.env.NODE_ENV === "production" ? "production" : "development";
    const integration = await storage.getIntegrationBySlug("openai", environment);

    if (!integration || integration.status !== "active") {
        return {};
    }

    const fields = Array.isArray(integration.fields) ? integration.fields : [];
    const readField = (key: string) =>
        fields.find((field) => field.key === key)?.value ?? null;

    const apiKey = readField("apiKey") || readField("api_key");
    const model = readField("model");

    return {
        apiKey: apiKey?.trim() || undefined,
        model: model?.trim() || undefined,
    };
}

export async function chatWithAI(
    messages: AIMessage[],
    userContext?: { userId?: string; role?: string; name?: string },
    overrides?: AIConfigOverrides
) {
    const integrationConfig = await getAIIntegrationConfig();
    const config = resolveAIConfig({
        ...integrationConfig,
        ...overrides,
    });

    if (!config.apiKey) {
        throw new Error("OpenAI API key not configured");
    }

    const openai = new OpenAI({
        apiKey: config.apiKey,
    });

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (userContext) {
        const roleName = userContext.role === "instructor" ? "Instrutor" : "Aluno";
        systemPrompt += `\n\n**Contexto do Usuário Atual:**
- Nome: ${userContext.name || "Não informado"}
- Tipo: ${roleName}
- ID: ${userContext.userId || "Anônimo"}`;
    }

    const fullMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        })),
    ];

    const completion = await openai.chat.completions.create({
        model: config.model!,
        messages: fullMessages,
        max_tokens: config.maxTokens,
        temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    return {
        reply,
        model: config.model,
        usage: completion.usage,
    };
}

// Pre-defined quick replies for common questions
export const QUICK_REPLIES = {
    greeting: [
        "Como agendar uma aula?",
        "Quais formas de pagamento?",
        "Como funciona o check-in?",
        "Falar com suporte humano",
    ],
    booking: [
        "Alterar horário da aula",
        "Cancelar agendamento",
        "Escolher ponto de encontro",
        "Ver meus agendamentos",
    ],
    payment: [
        "Quando recebo meu pagamento?",
        "Como funciona o split?",
        "Solicitar reembolso",
        "Ver histórico financeiro",
    ],
};

export function getQuickReplies(context: "greeting" | "booking" | "payment" = "greeting") {
    return QUICK_REPLIES[context] || QUICK_REPLIES.greeting;
}

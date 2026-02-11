import Stripe from "stripe";
import type { Booking } from "@shared/schema";

const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

type StripeConfigOverrides = {
    apiKey?: string | null;
    webhookSecret?: string | null;
};

const resolveStripeConfig = (overrides?: StripeConfigOverrides) => {
    const apiKey = overrides?.apiKey ?? STRIPE_API_KEY;
    const webhookSecret = overrides?.webhookSecret ?? STRIPE_WEBHOOK_SECRET;
    return { apiKey, webhookSecret };
};

export const getStripeClient = (apiKey?: string) => {
    const key = apiKey || STRIPE_API_KEY;
    if (!key) {
        throw new Error("Stripe API Key não configurada");
    }
    return new Stripe(key, {
        apiVersion: "2023-10-16" as any, // Bypass strict type check for now to fix build
        typescript: true,
    });
};

export async function createStripeCheckoutSession(
    booking: Booking,
    successUrl: string,
    cancelUrl: string,
    overrides?: StripeConfigOverrides
) {
    const { apiKey } = resolveStripeConfig(overrides);
    const stripe = getStripeClient(apiKey || undefined);

    // Convert total price to cents
    const amountInCents = Math.round(Number(booking.totalPrice) * 100);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"], // PIX can be added here if enabled in Stripe Dashboard 'payment_method_types: ["card", "boleto", "pix"]' but usually 'card' covers most, specific methods configured in Dashboard
        line_items: [
            {
                price_data: {
                    currency: "brl",
                    product_data: {
                        name: `Reserva HabilitFy #${booking.id}`,
                        description: `Aula de direção com instrutor ID ${booking.instructorId}`,
                    },
                    unit_amount: amountInCents,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            bookingId: booking.id,
            studentId: booking.studentId,
            instructorId: booking.instructorId,
        },
    });

    return session;
}

export function constructStripeWebhookEvent(
    payload: string | Buffer,
    signature: string,
    overrides?: StripeConfigOverrides
) {
    const { apiKey, webhookSecret } = resolveStripeConfig(overrides);
    const stripe = getStripeClient(apiKey || undefined);

    if (!webhookSecret) {
        throw new Error("Stripe Webhook Secret não configurado");
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

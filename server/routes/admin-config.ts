import type { Express, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import {
  mergeSecretIntegrationFields,
  maskIntegrationFields,
  normalizeIntegrationFields,
} from "../integrations.helpers";

const gatewayStatusValues = ["active", "inactive"] as const;
const integrationStatusValues = ["active", "inactive"] as const;
const integrationEnvironmentValues = ["development", "production"] as const;
const integrationFieldTypes = ["text", "secret", "url", "number", "boolean"] as const;

const gatewayCreateSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().optional().nullable(),
  status: z.enum(gatewayStatusValues).optional().default("active"),
  isDefault: z.boolean().optional().default(false),
});

const gatewayUpdateSchema = z.object({
  provider: z.string().min(1).optional(),
  apiKey: z.string().optional().nullable(),
  status: z.enum(gatewayStatusValues).optional(),
  isDefault: z.boolean().optional(),
});

const integrationFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional().nullable(),
  type: z.enum(integrationFieldTypes).optional().default("text"),
  value: z.string().optional().nullable(),
  required: z.boolean().optional().default(false),
  placeholder: z.string().optional().nullable(),
});

const integrationCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional().nullable(),
  category: z.string().min(1).optional().default("payment"),
  status: z.enum(integrationStatusValues).optional().default("active"),
  environment: z.enum(integrationEnvironmentValues)
    .optional()
    .default("production"),
  isDefault: z.boolean().optional().default(false),
  fields: z.array(integrationFieldSchema).optional().default([]),
});

const integrationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional().nullable(),
  category: z.string().min(1).optional(),
  status: z.enum(integrationStatusValues).optional(),
  environment: z.enum(integrationEnvironmentValues).optional(),
  isDefault: z.boolean().optional(),
  fields: z.array(integrationFieldSchema).optional(),
});

const maskApiKey = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  return `**** ${trimmed.slice(-4)} `;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function registerAdminConfigRoutes(app: Express) {
  app.get('/api/admin/settings', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/admin/settings', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const payload = req.body ?? {};
      const cancellationFeePercent = Number(payload.cancellationFeePercent);
      const cancellationInstructorSharePercent = Number(
        payload.cancellationInstructorSharePercent,
      );
      const platformFeePercent = Number(payload.platformFeePercent);

      if (
        !Number.isFinite(cancellationFeePercent) ||
        cancellationFeePercent < 0 ||
        cancellationFeePercent > 100
      ) {
        return res.status(400).json({ message: "Percentual de cancelamento invalido" });
      }
      if (
        !Number.isFinite(cancellationInstructorSharePercent) ||
        cancellationInstructorSharePercent < 0 ||
        cancellationInstructorSharePercent > 100
      ) {
        return res.status(400).json({ message: "Percentual do instrutor invalido" });
      }
      if (
        !Number.isFinite(platformFeePercent) ||
        platformFeePercent < 0 ||
        platformFeePercent > 100
      ) {
        return res.status(400).json({ message: "Taxa da plataforma invalida" });
      }

      const updated = await storage.updateAdminSettings({
        cancellationFeePercent: cancellationFeePercent.toFixed(2),
        cancellationInstructorSharePercent: cancellationInstructorSharePercent.toFixed(2),
        platformFeePercent: platformFeePercent.toFixed(2),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get('/api/admin/payment-gateways', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const gateways = await storage.getPaymentGateways();
      res.json(
        gateways.map((gateway) => ({
          id: gateway.id,
          provider: gateway.provider,
          status: gateway.status,
          isDefault: gateway.isDefault,
          maskedKey: maskApiKey(gateway.apiKey),
          updatedAt: gateway.updatedAt,
          createdAt: gateway.createdAt,
        })),
      );
    } catch (error) {
      console.error("Error fetching payment gateways:", error);
      res.status(500).json({ message: "Failed to fetch payment gateways" });
    }
  });

  app.post('/api/admin/payment-gateways', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = gatewayCreateSchema.parse(req.body);
      const apiKey = payload.apiKey?.trim() || null;

      const gateway = await storage.createPaymentGateway({
        provider: payload.provider,
        apiKey,
        status: payload.status,
        isDefault: payload.isDefault,
      });

      res.status(201).json({
        id: gateway.id,
        provider: gateway.provider,
        status: gateway.status,
        isDefault: gateway.isDefault,
        maskedKey: maskApiKey(gateway.apiKey),
        updatedAt: gateway.updatedAt,
        createdAt: gateway.createdAt,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating payment gateway:", error);
      res.status(500).json({ message: "Failed to create payment gateway" });
    }
  });

  app.patch('/api/admin/payment-gateways/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = gatewayUpdateSchema.parse(req.body);
      const apiKey =
        typeof payload.apiKey === "string" ? payload.apiKey.trim() : payload.apiKey;

      const gateway = await storage.updatePaymentGateway(req.params.id, {
        provider: payload.provider,
        apiKey: typeof apiKey === "string" ? apiKey : apiKey ?? undefined,
        status: payload.status,
        isDefault: payload.isDefault,
      });

      res.json({
        id: gateway.id,
        provider: gateway.provider,
        status: gateway.status,
        isDefault: gateway.isDefault,
        maskedKey: maskApiKey(gateway.apiKey),
        updatedAt: gateway.updatedAt,
        createdAt: gateway.createdAt,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating payment gateway:", error);
      res.status(500).json({ message: "Failed to update payment gateway" });
    }
  });

  app.get('/api/admin/integrations', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;
      const environment = req.query.environment as string | undefined;

      if (status && !integrationStatusValues.includes(status as any)) {
        return res.status(400).json({ message: "Invalid integration status" });
      }
      if (environment && !integrationEnvironmentValues.includes(environment as any)) {
        return res.status(400).json({ message: "Invalid integration environment" });
      }

      const integrations = await storage.getIntegrations({
        status,
        category,
        environment,
      });

      res.json(
        integrations.map((integration) => ({
          ...integration,
          fields: maskIntegrationFields(integration.fields as any),
        })),
      );
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/admin/integrations', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = integrationCreateSchema.parse(req.body);
      const slug = payload.slug?.trim() || slugify(payload.name);
      if (!slug) {
        return res.status(400).json({ message: "Slug inválido" });
      }

      const existing = await storage.getIntegrationBySlug(
        slug,
        payload.environment,
      );
      if (existing) {
        return res.status(409).json({ message: "Integração já cadastrada" });
      }

      const integration = await storage.createIntegration({
        name: payload.name.trim(),
        slug,
        category: payload.category.trim(),
        status: payload.status,
        environment: payload.environment,
        isDefault: payload.isDefault,
        fields: normalizeIntegrationFields(payload.fields),
      });

      res.status(201).json({
        ...integration,
        fields: maskIntegrationFields(integration.fields as any),
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating integration:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.patch('/api/admin/integrations/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = integrationUpdateSchema.parse(req.body);
      const current = await storage.getIntegration(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Integração não encontrada" });
      }

      let slug: string | undefined;
      if (payload.slug !== undefined) {
        const candidate = payload.slug?.trim() || slugify(payload.name || current.name);
        if (!candidate) {
          return res.status(400).json({ message: "Slug inválido" });
        }
        slug = candidate;

        const envToCheck = payload.environment || current.environment;
        if (candidate !== current.slug || envToCheck !== current.environment) {
          const existing = await storage.getIntegrationBySlug(
            candidate,
            envToCheck,
          );
          if (existing && existing.id !== current.id) {
            return res.status(409).json({ message: "Integração já cadastrada" });
          }
        }
      }

      const fields =
        payload.fields === undefined
          ? undefined
          : mergeSecretIntegrationFields(
              normalizeIntegrationFields(payload.fields),
              current.fields as any,
            );

      const integration = await storage.updateIntegration(req.params.id, {
        name: payload.name?.trim(),
        slug,
        category: payload.category?.trim(),
        status: payload.status,
        environment: payload.environment,
        isDefault: payload.isDefault,
        fields,
      });

      res.json({
        ...integration,
        fields: maskIntegrationFields(integration.fields as any),
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });
}

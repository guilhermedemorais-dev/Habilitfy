import { logger } from "./utils/logger";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import * as crypto from "crypto";
import {
    kycAuditEvents,
    kycConsents,
    kycVerifications,
    kycLegalHolds,
    kycDossierExports,
    KYC_AUDIT_EVENTS,
    KYC_CONSENT_VERSION,
    KYC_POLICY_VERSION,
    KYC_ROLE_PERMISSIONS,
} from "@shared/kyc-schema";

// ============================================================
// CONSENT SERVICE (Phase 2 — LGPD)
// ============================================================

const CONSENT_TEXT = `Para validar sua identidade, prevenir fraudes, proteger usuários da plataforma e permitir apuração de incidentes, coletaremos dados cadastrais, documento oficial, selfie e informações técnicas de acesso. Esses dados serão tratados conforme nossa Política de Privacidade e poderão ser preservados quando necessário para exercício regular de direitos, segurança, prevenção à fraude ou cumprimento de solicitação legal válida.`;

function hashConsentText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

export async function recordConsent(
    userId: string,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint?: string,
    sourceScreen?: string,
): Promise<string> {
    const consentTextHash = hashConsentText(CONSENT_TEXT);

    const [result] = await db.insert(kycConsents).values({
        userId,
        consentVersion: KYC_CONSENT_VERSION,
        policyVersion: KYC_POLICY_VERSION,
        consentTextHash,
        accepted: true,
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
        deviceFingerprint,
        sourceScreen,
    });

    const consentId = (result as any).insertId || crypto.randomUUID();

    // Audit event
    await logKycAuditEvent({
        userId,
        eventType: KYC_AUDIT_EVENTS.CONSENT_ACCEPTED,
        metadata: { consentVersion: KYC_CONSENT_VERSION, policyVersion: KYC_POLICY_VERSION },
        ipAddress,
        userAgent,
    });

    logger.info(`[KYC-CONSENT] Consent recorded for user ${userId}`, { userId, version: KYC_CONSENT_VERSION });
    return consentId;
}

export async function getUserConsent(userId: string) {
    const [consent] = await db.select()
        .from(kycConsents)
        .where(eq(kycConsents.userId, userId))
        .orderBy(desc(kycConsents.createdAt))
        .limit(1);
    return consent || null;
}

export async function hasValidConsent(userId: string): Promise<boolean> {
    const consent = await getUserConsent(userId);
    if (!consent) return false;
    return consent.accepted && consent.consentVersion === KYC_CONSENT_VERSION;
}

export function getConsentText(): string {
    return CONSENT_TEXT;
}

// ============================================================
// AUDIT SERVICE (Phase 3 — Auditoria)
// ============================================================

interface AuditEventParams {
    userId: string;
    adminId?: string;
    kycVerificationId?: string;
    eventType: string;
    previousStatus?: string;
    newStatus?: string;
    reasonCode?: string;
    reasonText?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export async function logKycAuditEvent(params: AuditEventParams): Promise<void> {
    try {
        await db.insert(kycAuditEvents).values({
            userId: params.userId,
            adminId: params.adminId,
            kycVerificationId: params.kycVerificationId,
            eventType: params.eventType,
            previousStatus: params.previousStatus,
            newStatus: params.newStatus,
            reasonCode: params.reasonCode,
            reasonText: params.reasonText,
            metadata: params.metadata,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
        logger.info(`[KYC-AUDIT] ${params.eventType} for user ${params.userId}`, {
            userId: params.userId,
            eventType: params.eventType,
            adminId: params.adminId,
        });
    } catch (error) {
        // Audit logging should never crash the main flow
        logger.error('[KYC-AUDIT] Failed to log audit event', { error, params });
    }
}

export async function getAuditLog(userId: string) {
    return db.select()
        .from(kycAuditEvents)
        .where(eq(kycAuditEvents.userId, userId))
        .orderBy(desc(kycAuditEvents.createdAt));
}

// ============================================================
// LEGAL HOLD SERVICE (Phase 4 — Jurídico)
// ============================================================

export async function enableLegalHold(
    userId: string,
    reason: string,
    protocol: string | undefined,
    createdBy: string,
    ipAddress?: string,
    userAgent?: string,
): Promise<void> {
    await db.insert(kycLegalHolds).values({
        userId,
        reason,
        protocol,
        createdBy,
        active: true,
    });

    // Mark user's KYC verifications as legal hold
    await db.update(kycVerifications)
        .set({ legalHold: true })
        .where(eq(kycVerifications.userId, userId));

    await logKycAuditEvent({
        userId,
        adminId: createdBy,
        eventType: KYC_AUDIT_EVENTS.LEGAL_HOLD_ENABLED,
        reasonText: reason,
        metadata: { protocol },
        ipAddress,
        userAgent,
    });

    logger.info(`[KYC-LEGAL] Legal hold enabled for user ${userId}`, { userId, createdBy, protocol });
}

export async function disableLegalHold(
    holdId: string,
    releasedBy: string,
    ipAddress?: string,
    userAgent?: string,
): Promise<void> {
    const [hold] = await db.select().from(kycLegalHolds).where(eq(kycLegalHolds.id, holdId)).limit(1);
    if (!hold) throw new Error('Legal hold not found');

    await db.update(kycLegalHolds)
        .set({ active: false, releasedBy, releasedAt: new Date() })
        .where(eq(kycLegalHolds.id, holdId));

    // Check if user still has any active holds
    const activeHolds = await db.select()
        .from(kycLegalHolds)
        .where(and(eq(kycLegalHolds.userId, hold.userId), eq(kycLegalHolds.active, true)));

    if (activeHolds.length === 0) {
        await db.update(kycVerifications)
            .set({ legalHold: false })
            .where(eq(kycVerifications.userId, hold.userId));
    }

    await logKycAuditEvent({
        userId: hold.userId,
        adminId: releasedBy,
        eventType: KYC_AUDIT_EVENTS.LEGAL_HOLD_DISABLED,
        metadata: { holdId },
        ipAddress,
        userAgent,
    });

    logger.info(`[KYC-LEGAL] Legal hold released for user ${hold.userId}`, { holdId, releasedBy });
}

export async function getUserLegalHolds(userId: string) {
    return db.select()
        .from(kycLegalHolds)
        .where(eq(kycLegalHolds.userId, userId))
        .orderBy(desc(kycLegalHolds.createdAt));
}

export async function hasActiveLegalHold(userId: string): Promise<boolean> {
    const [hold] = await db.select()
        .from(kycLegalHolds)
        .where(and(eq(kycLegalHolds.userId, userId), eq(kycLegalHolds.active, true)))
        .limit(1);
    return Boolean(hold);
}

// ============================================================
// DOSSIER SERVICE (Phase 4 — Jurídico)
// ============================================================

export async function generateDossier(
    userId: string,
    exportedBy: string,
    reason: string,
    protocol: string | undefined,
    ipAddress?: string,
) {
    // Log the view event
    await logKycAuditEvent({
        userId,
        adminId: exportedBy,
        eventType: KYC_AUDIT_EVENTS.DOSSIER_VIEWED,
        reasonText: reason,
        metadata: { protocol },
        ipAddress,
    });

    // Gather all data
    const verifications = await db.select()
        .from(kycVerifications)
        .where(eq(kycVerifications.userId, userId))
        .orderBy(desc(kycVerifications.createdAt));

    const consents = await db.select()
        .from(kycConsents)
        .where(eq(kycConsents.userId, userId))
        .orderBy(desc(kycConsents.createdAt));

    const auditLog = await getAuditLog(userId);
    const legalHolds = await getUserLegalHolds(userId);

    const dossier = {
        generatedAt: new Date().toISOString(),
        userId,
        exportedBy,
        reason,
        protocol,
        verifications,
        consents,
        auditLog,
        legalHolds,
    };

    // Generate hash of the dossier content
    const exportHash = crypto.createHash('sha256')
        .update(JSON.stringify(dossier))
        .digest('hex');

    // Record the export
    await db.insert(kycDossierExports).values({
        userId,
        exportedBy,
        reason,
        protocol,
        exportHash,
        ipAddress,
    });

    await logKycAuditEvent({
        userId,
        adminId: exportedBy,
        eventType: KYC_AUDIT_EVENTS.DOSSIER_EXPORTED,
        reasonText: reason,
        metadata: { protocol, exportHash },
        ipAddress,
    });

    logger.info(`[KYC-DOSSIER] Dossier exported for user ${userId}`, { userId, exportedBy, exportHash });

    return { ...dossier, exportHash };
}

// ============================================================
// FILE HASH SERVICE (Phase 5 — Hardening)
// ============================================================

export function computeFileHash(base64Data: string): string {
    const clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    return crypto.createHash('sha256').update(Buffer.from(clean, 'base64')).digest('hex');
}

// ============================================================
// RBAC CHECK (Phase 5 — Hardening)
// ============================================================

export function hasKycPermission(adminRole: string | undefined, permission: string): boolean {
    if (!adminRole) return false;
    const permissions = KYC_ROLE_PERMISSIONS[adminRole] || [];
    return permissions.includes(permission);
}

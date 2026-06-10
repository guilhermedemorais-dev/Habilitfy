import { sql } from 'drizzle-orm';
import {
    mysqlTable,
    timestamp,
    varchar,
    text,
    json,
    mysqlEnum,
    boolean,
    decimal,
    int,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================
// ENUMS
// ============================================================

// KYC Verification Status
export const kycVerificationStatusEnum = mysqlEnum('status', [
    'pending',
    'processing',
    'approved',
    'rejected',
    'requires_review',
]);

// KYC Document Types
export const kycDocumentTypeEnum = mysqlEnum('kyc_document_type', [
    'selfie',
    'document_front',
    'document_back',
    'proof_of_address',
    'driver_license',
    'vehicle_document',
]);

// ============================================================
// TABLES
// ============================================================

// --- KYC Verifications (existing, expanded) ---
export const kycVerifications = mysqlTable("kyc_verifications", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    consentId: varchar("consent_id", { length: 36 }),

    // Document URLs
    selfieUrl: varchar("selfie_url", { length: 500 }),
    documentFrontUrl: varchar("document_front_url", { length: 500 }),
    documentBackUrl: varchar("document_back_url", { length: 500 }),

    // File integrity hashes (SHA-256)
    fileHashSelfie: varchar("file_hash_selfie", { length: 64 }),
    fileHashDocumentFront: varchar("file_hash_document_front", { length: 64 }),
    fileHashDocumentBack: varchar("file_hash_document_back", { length: 64 }),

    // Extracted Data
    extractedName: varchar("extracted_name", { length: 255 }),
    extractedCpf: varchar("extracted_cpf", { length: 20 }),
    extractedBirthDate: timestamp("extracted_birth_date"),
    extractedDocumentNumber: varchar("extracted_document_number", { length: 100 }),

    // Face Matching
    faceMatchScore: decimal("face_match_score", { precision: 5, scale: 4 }),
    faceMatchPassed: boolean("face_match_passed").default(false),

    // Liveness Detection
    livenessScore: decimal("liveness_score", { precision: 5, scale: 4 }),
    livenessPassed: boolean("liveness_passed").default(false),

    // Document Validation
    documentValid: boolean("document_valid").default(false),
    documentValidationDetails: json("document_validation_details"),

    // Overall Status
    status: kycVerificationStatusEnum.default('pending').notNull(),
    rejectionReason: text("rejection_reason"),
    reasonCode: varchar("reason_code", { length: 100 }),
    reviewNotes: text("review_notes"),
    reviewedByUserId: varchar("reviewed_by_user_id", { length: 36 }),
    reviewedAt: timestamp("reviewed_at"),

    // Risk assessment
    riskLevel: varchar("risk_level", { length: 20 }), // 'low' | 'medium' | 'high' | 'critical'

    // Metadata
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    deviceFingerprint: varchar("device_fingerprint", { length: 255 }),

    // Provider tracking (fail-safe auditing)
    providerStatus: varchar("provider_status", { length: 50 }),
    providerError: text("provider_error"),

    // Legal hold flag
    legalHold: boolean("legal_hold").default(false),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- KYC Consents (Phase 2 — LGPD) ---
export const kycConsents = mysqlTable("kyc_consents", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    consentVersion: varchar("consent_version", { length: 20 }).notNull(),
    policyVersion: varchar("policy_version", { length: 20 }).notNull(),
    consentTextHash: varchar("consent_text_hash", { length: 64 }).notNull(),
    accepted: boolean("accepted").notNull().default(false),
    acceptedAt: timestamp("accepted_at"),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
    sourceScreen: varchar("source_screen", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
});

// --- KYC Audit Events (Phase 3 — Auditoria) ---
export const kycAuditEvents = mysqlTable("kyc_audit_events", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    adminId: varchar("admin_id", { length: 36 }),
    kycVerificationId: varchar("kyc_verification_id", { length: 36 }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    previousStatus: varchar("previous_status", { length: 50 }),
    newStatus: varchar("new_status", { length: 50 }),
    reasonCode: varchar("reason_code", { length: 100 }),
    reasonText: text("reason_text"),
    metadata: json("metadata"),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
});

// --- KYC Legal Holds (Phase 4 — Jurídico) ---
export const kycLegalHolds = mysqlTable("kyc_legal_holds", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    reason: text("reason").notNull(),
    protocol: varchar("protocol", { length: 100 }),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    releasedBy: varchar("released_by", { length: 36 }),
    releasedAt: timestamp("released_at"),
    active: boolean("active").notNull().default(true),
});

// --- KYC Dossier Exports (Phase 4 — Jurídico) ---
export const kycDossierExports = mysqlTable("kyc_dossier_exports", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    exportedBy: varchar("exported_by", { length: 36 }).notNull(),
    reason: text("reason").notNull(),
    protocol: varchar("protocol", { length: 100 }),
    exportHash: varchar("export_hash", { length: 64 }).notNull(),
    exportedAt: timestamp("exported_at").defaultNow(),
    ipAddress: varchar("ip_address", { length: 50 }),
});

// ============================================================
// INSERT SCHEMAS
// ============================================================

export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertKycConsentSchema = createInsertSchema(kycConsents).omit({
    id: true,
    createdAt: true,
});

export const insertKycAuditEventSchema = createInsertSchema(kycAuditEvents).omit({
    id: true,
    createdAt: true,
});

// ============================================================
// TYPES
// ============================================================

export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;
export type KycConsent = typeof kycConsents.$inferSelect;
export type InsertKycConsent = z.infer<typeof insertKycConsentSchema>;
export type KycAuditEvent = typeof kycAuditEvents.$inferSelect;
export type InsertKycAuditEvent = z.infer<typeof insertKycAuditEventSchema>;
export type KycLegalHold = typeof kycLegalHolds.$inferSelect;
export type KycDossierExport = typeof kycDossierExports.$inferSelect;

// ============================================================
// CONSTANTS
// ============================================================

export const KYC_THRESHOLDS = {
    FACE_MATCH_MIN: 0.85,
    LIVENESS_MIN: 0.90,
    AUTO_APPROVE_THRESHOLD: 0.95,
};

// Current consent/policy versions
export const KYC_CONSENT_VERSION = '1.0';
export const KYC_POLICY_VERSION = '1.0';

// Standardized audit event types (Phase 3)
export const KYC_AUDIT_EVENTS = {
    CONSENT_ACCEPTED: 'KYC_CONSENT_ACCEPTED',
    STARTED: 'KYC_STARTED',
    DOCUMENT_UPLOADED: 'KYC_DOCUMENT_UPLOADED',
    SELFIE_UPLOADED: 'KYC_SELFIE_UPLOADED',
    AI_ANALYSIS_STARTED: 'KYC_AI_ANALYSIS_STARTED',
    AI_ANALYSIS_FAILED: 'KYC_AI_ANALYSIS_FAILED',
    AI_ANALYSIS_COMPLETED: 'KYC_AI_ANALYSIS_COMPLETED',
    SENT_TO_MANUAL_REVIEW: 'KYC_SENT_TO_MANUAL_REVIEW',
    ADMIN_VIEWED_DOCUMENT: 'KYC_ADMIN_VIEWED_DOCUMENT',
    APPROVED: 'KYC_APPROVED',
    REJECTED: 'KYC_REJECTED',
    RESUBMISSION_REQUESTED: 'KYC_RESUBMISSION_REQUESTED',
    BLOCKED_FRAUD: 'KYC_BLOCKED_FRAUD',
    LEGAL_HOLD_ENABLED: 'KYC_LEGAL_HOLD_ENABLED',
    LEGAL_HOLD_DISABLED: 'KYC_LEGAL_HOLD_DISABLED',
    DOSSIER_VIEWED: 'KYC_DOSSIER_VIEWED',
    DOSSIER_EXPORTED: 'KYC_DOSSIER_EXPORTED',
    DELETION_REQUESTED: 'KYC_DELETION_REQUESTED',
    DATA_DELETED: 'KYC_DATA_DELETED',
    DATA_ANONYMIZED: 'KYC_DATA_ANONYMIZED',
} as const;

// Standardized reason codes (Phase 3)
export const KYC_REASON_CODES = {
    // Approval reasons
    DOCUMENT_AND_SELFIE_MATCH: 'DOCUMENT_AND_SELFIE_MATCH',
    MANUAL_REVIEW_CONFIRMED: 'MANUAL_REVIEW_CONFIRMED',
    LOW_RISK_VERIFICATION: 'LOW_RISK_VERIFICATION',
    INSTRUCTOR_CREDENTIAL_VALIDATED: 'INSTRUCTOR_CREDENTIAL_VALIDATED',
    STUDENT_DOCUMENT_VALIDATED: 'STUDENT_DOCUMENT_VALIDATED',
    // Rejection reasons
    DOCUMENT_UNREADABLE: 'DOCUMENT_UNREADABLE',
    DOCUMENT_INVALID: 'DOCUMENT_INVALID',
    SELFIE_INVALID: 'SELFIE_INVALID',
    FACE_MISMATCH: 'FACE_MISMATCH',
    LIVENESS_FAILED: 'LIVENESS_FAILED',
    CPF_MISMATCH: 'CPF_MISMATCH',
    DUPLICATE_DOCUMENT: 'DUPLICATE_DOCUMENT',
    SUSPECTED_FRAUD: 'SUSPECTED_FRAUD',
    INSTRUCTOR_CREDENTIAL_INVALID: 'INSTRUCTOR_CREDENTIAL_INVALID',
    VEHICLE_DOCUMENT_INVALID: 'VEHICLE_DOCUMENT_INVALID',
    UNDERAGE_OR_NOT_ELIGIBLE: 'UNDERAGE_OR_NOT_ELIGIBLE',
    // Manual review reasons
    AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
    LOW_CONFIDENCE_RESULT: 'LOW_CONFIDENCE_RESULT',
    INCONSISTENT_DATA: 'INCONSISTENT_DATA',
    DOCUMENT_NEEDS_HUMAN_REVIEW: 'DOCUMENT_NEEDS_HUMAN_REVIEW',
    MULTIPLE_ATTEMPTS: 'MULTIPLE_ATTEMPTS',
    TECHNICAL_ANALYSIS_FAILED: 'TECHNICAL_ANALYSIS_FAILED',
} as const;

// RBAC permissions for KYC operations (Phase 5)
export const KYC_ROLES = {
    SUPPORT_VIEWER: 'support_viewer',
    KYC_REVIEWER: 'kyc_reviewer',
    KYC_SUPERVISOR: 'kyc_supervisor',
    LEGAL_COMPLIANCE: 'legal_compliance',
    SYSTEM_ADMIN: 'system_admin',
} as const;

export const KYC_PERMISSIONS = {
    VIEW_STATUS: 'kyc:view_status',
    VIEW_DOCUMENTS: 'kyc:view_documents',
    APPROVE_REJECT: 'kyc:approve_reject',
    EXPORT_DOSSIER: 'kyc:export_dossier',
    MANAGE_LEGAL_HOLD: 'kyc:manage_legal_hold',
} as const;

// Role → permissions mapping
export const KYC_ROLE_PERMISSIONS: Record<string, string[]> = {
    [KYC_ROLES.SUPPORT_VIEWER]: [KYC_PERMISSIONS.VIEW_STATUS],
    [KYC_ROLES.KYC_REVIEWER]: [KYC_PERMISSIONS.VIEW_STATUS, KYC_PERMISSIONS.VIEW_DOCUMENTS, KYC_PERMISSIONS.APPROVE_REJECT],
    [KYC_ROLES.KYC_SUPERVISOR]: [KYC_PERMISSIONS.VIEW_STATUS, KYC_PERMISSIONS.VIEW_DOCUMENTS, KYC_PERMISSIONS.APPROVE_REJECT, KYC_PERMISSIONS.MANAGE_LEGAL_HOLD],
    [KYC_ROLES.LEGAL_COMPLIANCE]: [KYC_PERMISSIONS.VIEW_STATUS, KYC_PERMISSIONS.VIEW_DOCUMENTS, KYC_PERMISSIONS.EXPORT_DOSSIER, KYC_PERMISSIONS.MANAGE_LEGAL_HOLD],
    [KYC_ROLES.SYSTEM_ADMIN]: [KYC_PERMISSIONS.VIEW_STATUS],
};

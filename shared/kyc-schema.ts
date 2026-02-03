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
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// KYC Verification Status
export const kycVerificationStatusEnum = mysqlEnum('kyc_verification_status', [
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

// KYC Verifications Table
export const kycVerifications = mysqlTable("kyc_verifications", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).notNull(),

    // Document URLs
    selfieUrl: varchar("selfie_url", { length: 500 }),
    documentFrontUrl: varchar("document_front_url", { length: 500 }),
    documentBackUrl: varchar("document_back_url", { length: 500 }),

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
    reviewNotes: text("review_notes"),
    reviewedByUserId: varchar("reviewed_by_user_id", { length: 36 }),
    reviewedAt: timestamp("reviewed_at"),

    // Metadata
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    deviceFingerprint: varchar("device_fingerprint", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schema
export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

// Types
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;

// Validation thresholds
export const KYC_THRESHOLDS = {
    FACE_MATCH_MIN: 0.85,      // 85% similarity required
    LIVENESS_MIN: 0.90,        // 90% liveness confidence
    AUTO_APPROVE_THRESHOLD: 0.95, // Auto-approve above this score
};

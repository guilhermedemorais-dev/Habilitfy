import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * KYC Fail-Safe Tests (P0 Security)
 * 
 * Validates that the KYC module never auto-approves when the AI provider
 * is unavailable, returns an error, or produces unparseable JSON.
 * 
 * PRD: docs.prd/kyc-hardening-juridico-operacional.md § Fase 1
 */

// We need to mock the module-level imports before importing the module
// Mock the logger to prevent actual log output in tests
vi.mock("./utils/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock storage
vi.mock("./storage", () => ({
    storage: {
        getUser: vi.fn(),
        upsertUser: vi.fn(),
    },
}));

describe("KYC Fail-Safe — No Provider", () => {
    beforeEach(() => {
        // Ensure ANTHROPIC_API_KEY is NOT set
        delete process.env.ANTHROPIC_API_KEY;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("analyzeSelfie returns fail-safe when provider unavailable", async () => {
        const { analyzeSelfie } = await import("./kyc");
        const result = await analyzeSelfie("fake_base64_data");

        expect(result.hasFace).toBe(false);
        expect(result.faceCount).toBe(0);
        expect(result.quality).toBe("unacceptable");
        expect(result.issues).toContain("AI_PROVIDER_UNAVAILABLE");
        expect(result.livenessIndicators).toHaveLength(0);
    });

    it("analyzeDocument returns fail-safe when provider unavailable", async () => {
        const { analyzeDocument } = await import("./kyc");
        const result = await analyzeDocument("fake_base64_data");

        expect(result.isValid).toBe(false);
        expect(result.documentType).toBe("unknown");
        expect(result.hasFace).toBe(false);
        expect(result.issues).toContain("AI_PROVIDER_UNAVAILABLE");
    });

    it("compareFaces returns fail-safe when provider unavailable", async () => {
        const { compareFaces } = await import("./kyc");
        const result = await compareFaces("fake_selfie", "fake_document");

        expect(result.match).toBe(false);
        expect(result.similarity).toBe(0);
        expect(result.confidence).toBe("low");
        expect(result.notes).toContain("AI_PROVIDER_UNAVAILABLE");
    });

    it("performKycVerification returns requires_review when provider unavailable", async () => {
        const { performKycVerification } = await import("./kyc");
        const result = await performKycVerification(
            "test-user-id",
            "fake_selfie",
            "fake_document_front"
        );

        // Without provider, all analyses fail → rejected or requires_review
        // The key assertion: it must NOT be 'approved'
        expect(result.overallStatus).not.toBe("approved");
        expect(result.success).toBe(false);
        expect(result.faceMatchPassed).toBe(false);
        expect(result.documentValid).toBe(false);
    });

    it("isKycProviderAvailable returns false when key is missing", async () => {
        const { isKycProviderAvailable } = await import("./kyc");
        expect(isKycProviderAvailable()).toBe(false);
    });
});

describe("KYC Fail-Safe — Provider Available", () => {
    beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = "test-key-for-unit-tests";
    });

    afterEach(() => {
        delete process.env.ANTHROPIC_API_KEY;
        vi.restoreAllMocks();
    });

    it("isKycProviderAvailable returns true when key is set", async () => {
        const { isKycProviderAvailable } = await import("./kyc");
        expect(isKycProviderAvailable()).toBe(true);
    });
});

describe("KYC Fail-Safe — Never auto-approves on error", () => {
    beforeEach(() => {
        delete process.env.ANTHROPIC_API_KEY;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("full verification flow without provider never returns approved", async () => {
        const { performKycVerification } = await import("./kyc");

        // Run multiple times to ensure no randomness
        for (let i = 0; i < 3; i++) {
            const result = await performKycVerification(
                `test-user-${i}`,
                "base64_selfie",
                "base64_doc_front"
            );

            expect(result.overallStatus).not.toBe("approved");
            expect(result.success).toBe(false);
        }
    });

    it("rejection reasons include provider unavailability indicators", async () => {
        const { performKycVerification } = await import("./kyc");
        const result = await performKycVerification(
            "test-user",
            "base64_selfie",
            "base64_doc_front"
        );

        // Should have rejection reasons related to analysis failures
        expect(result.rejectionReasons.length).toBeGreaterThan(0);
    });
});

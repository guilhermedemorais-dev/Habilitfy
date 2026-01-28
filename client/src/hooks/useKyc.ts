import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

interface KycVerificationResult {
    success: boolean;
    faceMatchScore?: number;
    faceMatchPassed: boolean;
    livenessScore?: number;
    livenessPassed: boolean;
    documentValid: boolean;
    extractedData?: {
        name?: string;
        cpf?: string;
        birthDate?: string;
        documentNumber?: string;
    };
    overallStatus: 'approved' | 'rejected' | 'requires_review';
    rejectionReasons: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
}

interface KycStatus {
    status: 'pending' | 'approved' | 'rejected' | 'requires_review' | 'not_started';
    lastVerification?: KycVerificationResult;
    canRetry: boolean;
    retryAfter?: string;
}

export function useKyc() {
    const [isVerifying, setIsVerifying] = useState(false);

    // Check current KYC status
    const {
        data: kycStatus,
        isLoading: isLoadingStatus,
        refetch: refetchStatus,
    } = useQuery<KycStatus>({
        queryKey: ['kyc-status'],
        queryFn: async () => {
            const response = await fetch('/api/kyc/status');
            if (!response.ok) {
                throw new Error('Failed to fetch KYC status');
            }
            return response.json();
        },
        staleTime: 1000 * 60, // 1 minute
    });

    // Submit KYC verification
    const verifyMutation = useMutation({
        mutationFn: async (data: { selfie: string; documentFront: string; documentBack?: string }) => {
            setIsVerifying(true);
            const response = await fetch('/api/kyc/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Verification failed');
            }
            return response.json() as Promise<KycVerificationResult>;
        },
        onSettled: () => {
            setIsVerifying(false);
            refetchStatus();
        },
    });

    // Get verification requirements
    const { data: requirements } = useQuery({
        queryKey: ['kyc-requirements'],
        queryFn: async () => {
            const response = await fetch('/api/kyc/requirements');
            if (!response.ok) {
                throw new Error('Failed to fetch requirements');
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Helper to check if user needs KYC
    const needsVerification = useCallback(() => {
        if (!kycStatus) return false;
        return kycStatus.status === 'not_started' ||
            (kycStatus.status === 'rejected' && kycStatus.canRetry);
    }, [kycStatus]);

    // Helper to check if verification is pending review
    const isPendingReview = useCallback(() => {
        return kycStatus?.status === 'requires_review' || kycStatus?.status === 'pending';
    }, [kycStatus]);

    // Helper to check if approved
    const isApproved = useCallback(() => {
        return kycStatus?.status === 'approved';
    }, [kycStatus]);

    return {
        // Status
        kycStatus,
        isLoadingStatus,
        refetchStatus,

        // Verification
        verify: verifyMutation.mutateAsync,
        isVerifying: verifyMutation.isPending || isVerifying,
        verificationError: verifyMutation.error,
        verificationResult: verifyMutation.data,

        // Requirements
        requirements,

        // Helpers
        needsVerification,
        isPendingReview,
        isApproved,
    };
}

export default useKyc;

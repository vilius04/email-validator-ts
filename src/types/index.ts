/**
 * Core types for the email validator
 */

export interface VerifyEmailResponse {
  email: string;
  status: 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';
  score: number;
  checks: {
    syntaxValid: boolean;
    mxRecordsFound: boolean;
    smtpValid: boolean;
    isDisposable: boolean;
    isRoleBased: boolean;
    isCatchAll: boolean;
    isFreeProvider: boolean;
  };
  domain: string;
  verifiedAt: Date;
  mxRecords?: string[];
  smtpResponse?: {
    error?: string;
    responseCode?: number;
  };
}

export interface EmailClassification {
  type: 'personal' | 'generic';
  department: string | null;
  confidence: number;
  isValid: boolean;
}

export interface ClassifiedEmail {
  email: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  classification: EmailClassification;
}

export interface VerifyOptions {
  timeout?: number;
  verifyMx?: boolean;
  verifySmtp?: boolean;
  checkDisposable?: boolean;
  checkFree?: boolean;
}

export interface BatchVerifyOptions extends VerifyOptions {
  concurrency?: number;
}

export interface BatchVerifyResult {
  results: VerifyEmailResponse[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    risky: number;
    unknown: number;
  };
}

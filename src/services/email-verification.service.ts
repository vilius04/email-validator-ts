import {
  verifyEmailDetailed,
  verifyEmailBatch,
  isDisposableEmail,
  isFreeEmail,
  isValidEmail,
  clearAllCaches,
  type DetailedVerificationResult,
} from '@devmehq/email-validator-js';
import { VerifyEmailResponse, VerifyOptions, BatchVerifyOptions, BatchVerifyResult } from '../types';

/**
 * Default verification options
 */
const DEFAULT_OPTIONS: VerifyOptions = {
  timeout: 10000,         // 10 seconds
  verifyMx: true,         // Check MX records
  verifySmtp: true,       // Check SMTP server
  checkDisposable: true,  // Check if disposable
  checkFree: true,        // Check if free provider
};

/**
 * Map library result to our API format
 */
function mapToApiResponse(
  email: string,
  result: DetailedVerificationResult
): VerifyEmailResponse {
  // Calculate score based on validation results
  let score = 0;
  
  if (result.format.valid) score += 30;
  if (result.domain.valid) score += 40;
  if (result.smtp.valid === true) score += 25; // SMTP confirmed mailbox exists
  // Note: smtp.valid === null means couldn't verify (timeout, blocked, etc.)
  // We don't give points for unknown - be conservative
  
  // Penalties
  if (result.disposable) score -= 40;
  if (result.freeProvider) score -= 5;
  
  score = Math.max(0, Math.min(100, score));
  
  // Determine status
  let status: 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';
  
  if (!result.format.valid || !result.domain.valid) {
    status = 'INVALID';
  } else if (result.disposable) {
    status = 'RISKY';
  } else if (result.smtp.valid === false) {
    // SMTP explicitly rejected the mailbox
    status = 'INVALID';
  } else if (result.smtp.valid === true && score >= 80) {
    // SMTP confirmed mailbox exists
    status = 'VALID';
  } else if (result.smtp.valid === null) {
    // SMTP couldn't verify (timeout, connection failed, blocked)
    // We can't confirm mailbox exists, so mark as RISKY
    status = 'RISKY';
  } else if (score >= 60) {
    status = 'RISKY';
  } else {
    status = 'UNKNOWN';
  }
  
  return {
    email,
    status,
    score,
    checks: {
      syntaxValid: result.format.valid,
      mxRecordsFound: result.domain.valid === true,
      smtpValid: result.smtp.valid === true,
      isDisposable: result.disposable,
      isRoleBased: false, // Not checked by library, use classification service
      isCatchAll: false,  // Not explicitly checked by library
      isFreeProvider: result.freeProvider,
    },
    domain: email.split('@')[1],
    verifiedAt: new Date(),
    mxRecords: result.domain.mxRecords || [],
    smtpResponse: {
      error: result.smtp.error,
      responseCode: result.smtp.responseCode,
    },
  };
}

/**
 * Verify a single email address
 * 
 * @param email - Email address to verify
 * @param options - Verification options
 * @returns Promise<VerifyEmailResponse>
 * 
 * @example
 * ```typescript
 * const result = await verifyEmail('john@example.com');
 * console.log(result.status); // 'VALID', 'INVALID', 'RISKY', or 'UNKNOWN'
 * console.log(result.score);  // 0-100
 * ```
 */
export async function verifyEmail(
  email: string,
  options: VerifyOptions = {}
): Promise<VerifyEmailResponse> {
  const normalizedEmail = email.toLowerCase().trim();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log(`[Email Verification] Verifying: ${normalizedEmail}`);
  
  try {
    // Use detailed verification from the library
    const result = await verifyEmailDetailed({
      emailAddress: normalizedEmail,
      timeout: opts.timeout,
      verifyMx: opts.verifyMx,
      verifySmtp: opts.verifySmtp,
      checkDisposable: opts.checkDisposable,
      checkFree: opts.checkFree,
      debug: false,
    });
    
    console.log(`[Email Verification] Result for ${normalizedEmail}:`, {
      valid: result.valid,
      format: result.format.valid,
      domain: result.domain.valid,
      smtp: result.smtp.valid,
      disposable: result.disposable,
      free: result.freeProvider,
    });
    
    const apiResponse = mapToApiResponse(normalizedEmail, result);
    
    console.log(`[Email Verification] ✅ ${normalizedEmail}: ${apiResponse.status} (score: ${apiResponse.score})`);
    return apiResponse;
    
  } catch (error: any) {
    console.error(`[Email Verification] Error verifying ${normalizedEmail}:`, error);
    
    // Return a failed result
    const failedResponse: VerifyEmailResponse = {
      email: normalizedEmail,
      status: 'UNKNOWN',
      score: 0,
      checks: {
        syntaxValid: isValidEmail(normalizedEmail),
        mxRecordsFound: false,
        smtpValid: false,
        isDisposable: isDisposableEmail(normalizedEmail),
        isRoleBased: false,
        isCatchAll: false,
        isFreeProvider: isFreeEmail(normalizedEmail),
      },
      domain: normalizedEmail.split('@')[1] || '',
      verifiedAt: new Date(),
    };
    
    return failedResponse;
  }
}

/**
 * Verify multiple emails in batch
 * 
 * @param emails - Array of email addresses to verify
 * @param options - Batch verification options
 * @returns Promise<BatchVerifyResult>
 * 
 * @example
 * ```typescript
 * const result = await verifyEmailsBatch([
 *   'john@example.com',
 *   'jane@example.com'
 * ], { concurrency: 5 });
 * 
 * console.log(result.summary);
 * // { total: 2, valid: 1, invalid: 0, risky: 1, unknown: 0 }
 * ```
 */
export async function verifyEmailsBatch(
  emails: string[],
  options: BatchVerifyOptions = {}
): Promise<BatchVerifyResult> {
  const uniqueEmails = [...new Set(emails.map((e) => e.toLowerCase().trim()))];
  const opts = { ...DEFAULT_OPTIONS, concurrency: 10, ...options };
  
  console.log(`[Email Verification] Batch verification of ${uniqueEmails.length} emails`);
  
  // Use the library's batch function
  const batchResult = await verifyEmailBatch({
    emailAddresses: uniqueEmails,
    concurrency: opts.concurrency,
    timeout: opts.timeout,
    verifyMx: opts.verifyMx,
    verifySmtp: opts.verifySmtp,
    checkDisposable: opts.checkDisposable,
    checkFree: opts.checkFree,
    detailed: true,
  });
  
  console.log(`[Email Verification] Batch complete: ${batchResult.summary.valid} valid, ${batchResult.summary.invalid} invalid`);
  
  // Map results to our format
  const results: VerifyEmailResponse[] = [];
  const summary = {
    total: uniqueEmails.length,
    valid: 0,
    invalid: 0,
    risky: 0,
    unknown: 0,
  };
  
  for (const [email, result] of batchResult.results) {
    if ('valid' in result) {
      // DetailedVerificationResult - successful verification
      const apiResponse = mapToApiResponse(email, result as DetailedVerificationResult);
      results.push(apiResponse);
      
      // Update summary
      if (apiResponse.status === 'VALID') summary.valid++;
      else if (apiResponse.status === 'INVALID') summary.invalid++;
      else if (apiResponse.status === 'RISKY') summary.risky++;
      else summary.unknown++;
      
    } else {
      // Error result - verification failed but we still need to return a result
      console.error(`[Email Verification] Error in batch for ${email}:`, result);
      
      const errorResponse: VerifyEmailResponse = {
        email,
        status: 'UNKNOWN',
        score: 0,
        checks: {
          syntaxValid: isValidEmail(email),
          mxRecordsFound: false,
          smtpValid: false,
          isDisposable: isDisposableEmail(email),
          isRoleBased: false,
          isCatchAll: false,
          isFreeProvider: isFreeEmail(email),
        },
        domain: email.split('@')[1] || '',
        verifiedAt: new Date(),
      };
      
      results.push(errorResponse);
      summary.unknown++;
    }
  }
  
  return {
    results,
    summary,
  };
}

/**
 * Clear all verification caches
 * Useful when you want to force re-verification
 */
export function clearVerificationCache(): void {
  clearAllCaches();
  console.log('[Email Verification] Cleared all caches');
}

/**
 * Quick check if email is valid (syntax only)
 */
export { isValidEmail };

/**
 * Quick check if email is from a disposable provider
 */
export { isDisposableEmail };

/**
 * Quick check if email is from a free provider (Gmail, Yahoo, etc.)
 */
export { isFreeEmail };

export default {
  verifyEmail,
  verifyEmailsBatch,
  clearVerificationCache,
  isValidEmail,
  isDisposableEmail,
  isFreeEmail,
};

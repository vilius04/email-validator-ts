/**
 * Advanced Email Validator
 * Comprehensive email verification and classification tool
 * 
 * @author Vilius Brazdeikis
 * @license MIT
 */

// Main verification functions
export {
  verifyEmail,
  verifyEmailsBatch,
  clearVerificationCache,
  isValidEmail,
  isDisposableEmail,
  isFreeEmail,
} from './services/email-verification.service';

// Classification functions
export {
  cleanEmail,
  isGenericEmail,
  detectDepartment,
  classifyEmail,
  classifyEmails,
} from './services/email-classification.service';

// Export types
export * from './types';

// Default export
import emailVerification from './services/email-verification.service';
import emailClassification from './services/email-classification.service';

export default {
  ...emailVerification,
  ...emailClassification,
};

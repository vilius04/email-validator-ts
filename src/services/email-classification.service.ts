import { EmailClassification, ClassifiedEmail } from '../types';

/**
 * Comprehensive role-based email patterns
 */
const ROLE_BASED_PATTERNS = [
  // Administrative
  'admin', 'administrator', 'postmaster', 'hostmaster', 'webmaster', 'root',
  
  // Support/Help
  'support', 'help', 'helpdesk', 'service', 'services', 'customerservice',
  'customersupport', 'techsupport', 'tech', 'it', 'itsupport',
  
  // Sales/Marketing
  'sales', 'marketing', 'info', 'information', 'inquiries', 'inquiry',
  'business', 'commercial', 'partnerships', 'partner',
  
  // Communication
  'contact', 'hello', 'hi', 'welcome', 'feedback', 'team', 'staff',
  'office', 'headquarters', 'hq',
  
  // Operations
  'billing', 'accounts', 'accounting', 'finance', 'invoice', 'invoices',
  'orders', 'order', 'shipping', 'warehouse', 'logistics',
  
  // HR/Recruiting
  'hr', 'humanresources', 'recruitment', 'recruiting', 'careers', 'jobs',
  'hiring',
  
  // Technical
  'dev', 'developer', 'developers', 'engineering', 'api', 'security',
  'abuse', 'legal', 'privacy', 'compliance',
  
  // System/Automated
  'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'mail', 'mailer',
  'notification', 'notifications', 'alerts', 'automated', 'system',
  
  // General
  'general', 'reception', 'front-desk', 'frontdesk', 'media', 'press',
  'pr', 'public-relations', 'corporate', 'company',
];

/**
 * Department keywords and patterns
 */
const DEPARTMENT_PATTERNS = {
  engineering: [
    'engineer', 'developer', 'dev', 'engineering', 'development', 'tech', 'technical',
    'software', 'backend', 'frontend', 'fullstack', 'devops', 'sre', 'platform',
    'infrastructure', 'architect', 'cto', 'vp.engineering', 'head.of.engineering'
  ],
  sales: [
    'sales', 'account', 'business.development', 'bd', 'revenue', 'commercial',
    'cro', 'vp.sales', 'head.of.sales', 'account.executive', 'ae', 'sales.rep'
  ],
  marketing: [
    'marketing', 'market', 'brand', 'content', 'seo', 'sem', 'growth', 'demand',
    'cmo', 'vp.marketing', 'head.of.marketing', 'digital.marketing', 'product.marketing'
  ],
  operations: [
    'operations', 'ops', 'operations.manager', 'coo', 'vp.operations',
    'head.of.operations', 'logistics', 'supply.chain', 'procurement'
  ],
  finance: [
    'finance', 'accounting', 'financial', 'cfo', 'controller', 'treasurer',
    'vp.finance', 'head.of.finance', 'bookkeeping', 'payroll', 'budget'
  ],
  hr: [
    'hr', 'human.resources', 'people', 'talent', 'recruiting', 'recruitment',
    'recruiter', 'hiring', 'chro', 'vp.people', 'head.of.people', 'people.ops'
  ],
  support: [
    'support', 'customer.success', 'customer.service', 'help', 'service',
    'success', 'client.service', 'customer.care', 'customer.support'
  ],
  legal: [
    'legal', 'counsel', 'attorney', 'lawyer', 'compliance', 'regulatory',
    'general.counsel', 'legal.affairs', 'contracts'
  ],
  product: [
    'product', 'product.manager', 'pm', 'product.management', 'cpo',
    'vp.product', 'head.of.product', 'product.design', 'product.owner'
  ],
  design: [
    'design', 'designer', 'ux', 'ui', 'creative', 'visual', 'graphic',
    'product.design', 'user.experience', 'user.interface'
  ],
  executive: [
    'ceo', 'founder', 'cofounder', 'co-founder', 'president', 'cto', 'cfo',
    'coo', 'cmo', 'cpo', 'chro', 'ciso', 'executive', 'chief', 'vp', 'vice.president'
  ],
  it: [
    'it', 'information.technology', 'systems', 'network', 'security', 'cybersecurity',
    'infosec', 'sysadmin', 'system.administrator', 'helpdesk', 'ciso'
  ],
};

/**
 * Clean and validate email
 * Removes URL encoding, invalid characters, and malformed emails
 */
export function cleanEmail(email: string): string | null {
  try {
    // Decode URL encoding only if % is present (conditional)
    let cleaned = email.includes('%') ? decodeURIComponent(email) : email;
    
    // Remove any whitespace
    cleaned = cleaned.trim().toLowerCase();
    
    // After decoding, check for spaces (indicates malformed)
    if (cleaned.includes(' ')) {
      console.log(`[Classification] Rejected email with spaces: ${cleaned}`);
      return null;
    }
    
    // Use simpler, more permissive email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(cleaned)) {
      console.log(`[Classification] Rejected email - failed regex: ${cleaned}`);
      return null;
    }
    
    // Check for common malformations
    const parts = cleaned.split('@');
    if (parts.length !== 2) {
      console.log(`[Classification] Rejected email - invalid @ structure: ${cleaned}`);
      return null;
    }
    
    const localPart = parts[0];
    const domain = parts[1];
    
    // Only reject obvious malformations
    if (localPart.includes('..') || domain.includes('..')) {
      console.log(`[Classification] Rejected email - consecutive dots: ${cleaned}`);
      return null;
    }
    
    // Check domain has at least one dot
    if (!domain.includes('.')) {
      console.log(`[Classification] Rejected email - no TLD in domain: ${cleaned}`);
      return null;
    }
    
    return cleaned;
  } catch (error) {
    // Fail-safe: return original email instead of null
    console.warn(`[Classification] Error cleaning email, returning original: ${email}`, error);
    return email.trim().toLowerCase();
  }
}

/**
 * Check if email is role-based
 */
function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase();
  return ROLE_BASED_PATTERNS.some((pattern) => 
    localPart === pattern || localPart.startsWith(`${pattern}.`)
  );
}

/**
 * Determine if email is generic/role-based
 * 
 * @example
 * ```typescript
 * isGenericEmail('info@company.com')  // true
 * isGenericEmail('john@company.com')  // false
 * ```
 */
export function isGenericEmail(email: string): boolean {
  const cleanedEmail = cleanEmail(email);
  if (!cleanedEmail) return false;
  
  return isRoleBasedEmail(cleanedEmail);
}

/**
 * Detect department from email and job title
 * 
 * @example
 * ```typescript
 * detectDepartment('john.engineer@company.com')  // 'Engineering'
 * detectDepartment('sales@company.com', 'Sales Manager')  // 'Sales'
 * ```
 */
export function detectDepartment(
  email: string,
  jobTitle?: string
): string | null {
  const localPart = email.split('@')[0].toLowerCase().replace(/[._-]/g, '.');
  const searchText = `${localPart} ${jobTitle || ''}`.toLowerCase();
  
  // Check each department
  for (const [department, patterns] of Object.entries(DEPARTMENT_PATTERNS)) {
    for (const pattern of patterns) {
      const searchPattern = pattern.replace(/\./g, '[._-]?');
      const regex = new RegExp(`\\b${searchPattern}\\b`, 'i');
      
      if (regex.test(searchText)) {
        return department.charAt(0).toUpperCase() + department.slice(1);
      }
    }
  }
  
  return null;
}

/**
 * Classify email type (personal vs generic) with confidence score
 * 
 * @param email - Email address to classify
 * @param firstName - Optional first name
 * @param lastName - Optional last name
 * @param jobTitle - Optional job title
 * @returns EmailClassification
 * 
 * @example
 * ```typescript
 * const result = classifyEmail(
 *   'john.smith@company.com',
 *   'John',
 *   'Smith',
 *   'Software Engineer'
 * );
 * console.log(result);
 * // {
 * //   type: 'personal',
 * //   department: 'Engineering',
 * //   confidence: 95,
 * //   isValid: true
 * // }
 * ```
 */
export function classifyEmail(
  email: string,
  firstName?: string,
  lastName?: string,
  jobTitle?: string
): EmailClassification {
  // Clean email first
  const cleanedEmail = cleanEmail(email);
  
  if (!cleanedEmail) {
    return {
      type: 'generic',
      department: null,
      confidence: 0,
      isValid: false,
    };
  }
  
  // Check if generic/role-based
  const isGeneric = isGenericEmail(cleanedEmail);
  
  // Detect department
  const department = detectDepartment(cleanedEmail, jobTitle);
  
  // Calculate confidence
  let confidence = 50; // Base confidence
  
  if (isGeneric) {
    // Generic emails have lower confidence for personal outreach
    confidence = 30;
    
    // But if we have department info, it's more useful
    if (department) {
      confidence = 45;
    }
  } else {
    // Personal emails
    confidence = 70;
    
    // Increase confidence with more info
    if (firstName && lastName) {
      confidence += 15;
    }
    if (jobTitle) {
      confidence += 10;
    }
    if (department) {
      confidence += 5;
    }
  }
  
  return {
    type: isGeneric ? 'generic' : 'personal',
    department,
    confidence: Math.min(100, Math.max(0, confidence)),
    isValid: true,
  };
}

/**
 * Batch classify emails
 * 
 * @param emails - Array of emails to classify
 * @returns Array of classified emails
 * 
 * @example
 * ```typescript
 * const results = classifyEmails([
 *   { email: 'john@company.com', firstName: 'John', lastName: 'Doe' },
 *   { email: 'info@company.com' }
 * ]);
 * ```
 */
export function classifyEmails(
  emails: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
  }>
): ClassifiedEmail[] {
  console.log(`[Classification] Starting classification of ${emails.length} emails`);
  
  const results = emails
    .map((item) => {
      const cleaned = cleanEmail(item.email);
      if (!cleaned) {
        console.log(`[Classification] Rejected invalid email: ${item.email}`);
        return null; // Filter out invalid emails
      }
      
      return {
        ...item,
        email: cleaned, // Use cleaned version
        classification: classifyEmail(
          cleaned,
          item.firstName,
          item.lastName,
          item.jobTitle
        ),
      };
    })
    .filter((item): item is ClassifiedEmail => item !== null);
  
  console.log(`[Classification] After filtering: ${results.length} valid emails`);
  return results;
}

export default {
  cleanEmail,
  isGenericEmail,
  detectDepartment,
  classifyEmail,
  classifyEmails,
};

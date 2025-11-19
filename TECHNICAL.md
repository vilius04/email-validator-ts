# 📘 Technical Documentation

Comprehensive technical guide for developers implementing the email validator.

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Email Verification](#email-verification)
3. [Email Classification](#email-classification)
4. [Scoring Algorithms](#scoring-algorithms)
5. [Performance](#performance)
6. [Error Handling](#error-handling)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                   Email Validator                        │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │     Email Verification Service                   │   │
│  │  - Syntax validation (RFC 5322)                 │   │
│  │  - MX record lookup                             │   │
│  │  - SMTP mailbox verification                    │   │
│  │  - Disposable/Free provider detection           │   │
│  │  - Scoring algorithm                            │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │     Email Classification Service                 │   │
│  │  - Email cleaning & normalization               │   │
│  │  - Role-based detection (70+ patterns)          │   │
│  │  - Department detection (12 departments)        │   │
│  │  - Confidence scoring                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Powered by: @devmehq/email-validator-js               │
└─────────────────────────────────────────────────────────┘
```

### Module Structure

```
email-validator/
├── src/
│   ├── index.ts                              # Main exports
│   ├── types/
│   │   └── index.ts                          # TypeScript interfaces
│   └── services/
│       ├── email-verification.service.ts     # Core verification (240 lines)
│       └── email-classification.service.ts   # Classification (280 lines)
│
└── examples/
    ├── basic-usage.ts                        # Usage examples
    └── cli.ts                                # CLI interface
```

---

## Email Verification

### Verification Flow

```
Input Email
    │
    ├─> 1. Normalize (lowercase, trim)
    │
    ├─> 2. Syntax Validation (RFC 5322)
    │       └─> If invalid: Return INVALID
    │
    ├─> 3. MX Record Check
    │       └─> If no MX records: Return INVALID
    │
    ├─> 4. SMTP Verification (optional)
    │       ├─> If mailbox confirmed: +25 points
    │       ├─> If mailbox rejected: Return INVALID
    │       └─> If timeout/blocked: Continue (risky)
    │
    ├─> 5. Disposable Check
    │       └─> If disposable: -40 points, RISKY status
    │
    ├─> 6. Free Provider Check
    │       └─> If free: -5 points
    │
    └─> 7. Calculate Final Score & Status
```

### 1. Syntax Validation

Uses RFC 5322 compliant regex from `@devmehq/email-validator-js`:

```typescript
// Validates complex cases:
"john.doe"@example.com       // ✅ Quoted local part
user+tag@example.com          // ✅ Plus addressing
admin@[192.168.1.1]          // ✅ IP address domain
first.last@sub.domain.com    // ✅ Subdomain
```

### 2. MX Record Verification

Checks if domain has mail exchange servers:

```typescript
// DNS lookup for MX records
const result = await verifyEmailDetailed({
  emailAddress: 'john@example.com',
  verifyMx: true,
});

// Returns MX records:
result.domain.mxRecords = [
  'mx1.example.com',
  'mx2.example.com'
];
```

**Why it matters:**
- Confirms domain can receive emails
- Fast check (100-500ms)
- No alert to recipient

### 3. SMTP Verification

Connects to mail server to verify mailbox exists:

```typescript
// SMTP verification process:
1. Connect to mail server (port 25)
2. Send HELO/EHLO command
3. Send MAIL FROM command
4. Send RCPT TO command with test email
5. Check response code
6. Close connection gracefully
```

**Response Codes:**
- `250`: Mailbox exists ✅
- `550`: Mailbox doesn't exist ❌
- `450/451`: Temporary failure ⚠️
- `421`: Service unavailable ⚠️

**Limitations:**
- Can trigger security alerts
- Some servers block verification
- Takes 2-5 seconds
- May give false negatives

### 4. Disposable Email Detection

Checks against database of 3000+ disposable email providers:

```typescript
isDisposableEmail('test@mailinator.com')  // true
isDisposableEmail('test@10minutemail.com') // true
isDisposableEmail('john@gmail.com')       // false
```

**Common disposable providers:**
- mailinator.com
- guerrillamail.com
- 10minutemail.com
- temp-mail.org
- throwaway.email
- And 3000+ more...

### 5. Free Provider Detection

Identifies free email services:

```typescript
isFreeEmail('john@gmail.com')     // true
isFreeEmail('john@yahoo.com')     // true
isFreeEmail('john@outlook.com')   // true
isFreeEmail('john@company.com')   // false
```

**Why check free providers?**
- Business emails more valuable for B2B
- Personal emails less reliable
- Free emails easier to create/abandon

---

## Email Classification

### Classification Algorithm

```
Input: Email + Optional (FirstName, LastName, JobTitle)
    │
    ├─> 1. Clean Email
    │       └─> Remove encoding, normalize, validate
    │
    ├─> 2. Check Role-Based Patterns
    │       └─> 70+ patterns (info@, sales@, support@, etc.)
    │
    ├─> 3. Detect Department
    │       └─> 12 departments, 100+ keywords
    │
    └─> 4. Calculate Confidence
            ├─> Base: 50 points
            ├─> Personal: +20 (if not role-based)
            ├─> Name: +15 (first + last)
            ├─> Job Title: +10
            └─> Department: +5
```

### Role-Based Detection

**70+ patterns across 10 categories:**

```typescript
const ROLE_BASED_PATTERNS = [
  // Administrative (6)
  'admin', 'administrator', 'postmaster', 
  'hostmaster', 'webmaster', 'root',
  
  // Support/Help (11)
  'support', 'help', 'helpdesk', 'service',
  'customerservice', 'customersupport', 
  'techsupport', 'tech', 'it', 'itsupport',
  
  // Sales/Marketing (9)
  'sales', 'marketing', 'info', 'information',
  'inquiries', 'inquiry', 'business', 
  'commercial', 'partnerships',
  
  // Communication (9)
  'contact', 'hello', 'hi', 'welcome', 
  'feedback', 'team', 'staff', 'office', 'hq',
  
  // Operations (10)
  'billing', 'accounts', 'accounting', 'finance',
  'invoice', 'orders', 'order', 'shipping',
  'warehouse', 'logistics',
  
  // HR/Recruiting (7)
  'hr', 'humanresources', 'recruitment',
  'recruiting', 'careers', 'jobs', 'hiring',
  
  // Technical (9)
  'dev', 'developer', 'developers', 'engineering',
  'api', 'security', 'abuse', 'legal', 'privacy',
  
  // System/Automated (10)
  'noreply', 'no-reply', 'donotreply', 
  'do-not-reply', 'mail', 'mailer', 
  'notification', 'alerts', 'automated', 'system',
  
  // General (9)
  'general', 'reception', 'front-desk', 
  'frontdesk', 'media', 'press', 'pr', 
  'public-relations', 'corporate'
];
```

**Matching logic:**

```typescript
function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split('@')[0].toLowerCase();
  
  return ROLE_BASED_PATTERNS.some(pattern => 
    localPart === pattern ||           // Exact match: info@
    localPart.startsWith(`${pattern}.`) // Prefix: info.uk@
  );
}
```

### Department Detection

**12 departments with 100+ keywords:**

```typescript
const DEPARTMENT_PATTERNS = {
  engineering: [
    'engineer', 'developer', 'dev', 'software',
    'backend', 'frontend', 'fullstack', 'devops',
    'sre', 'platform', 'infrastructure', 'architect',
    'cto', 'vp.engineering'
  ],
  
  sales: [
    'sales', 'account', 'business.development', 'bd',
    'revenue', 'commercial', 'cro', 'account.executive'
  ],
  
  marketing: [
    'marketing', 'brand', 'content', 'seo', 'growth',
    'demand', 'cmo', 'digital.marketing'
  ],
  
  operations: [
    'operations', 'ops', 'coo', 'logistics',
    'supply.chain', 'procurement'
  ],
  
  finance: [
    'finance', 'accounting', 'cfo', 'controller',
    'treasurer', 'bookkeeping', 'payroll'
  ],
  
  hr: [
    'hr', 'human.resources', 'people', 'talent',
    'recruiting', 'chro', 'people.ops'
  ],
  
  support: [
    'support', 'customer.success', 'customer.service',
    'help', 'service', 'client.service'
  ],
  
  legal: [
    'legal', 'counsel', 'attorney', 'compliance',
    'regulatory', 'contracts'
  ],
  
  product: [
    'product', 'product.manager', 'pm', 'cpo',
    'product.design', 'product.owner'
  ],
  
  design: [
    'design', 'designer', 'ux', 'ui', 'creative',
    'visual', 'graphic'
  ],
  
  executive: [
    'ceo', 'founder', 'cofounder', 'president',
    'cto', 'cfo', 'coo', 'cmo', 'chief', 'vp'
  ],
  
  it: [
    'it', 'information.technology', 'systems',
    'network', 'security', 'cybersecurity', 'ciso'
  ]
};
```

**Detection algorithm:**

```typescript
export function detectDepartment(
  email: string,
  jobTitle?: string
): string | null {
  // Normalize email local part
  const localPart = email.split('@')[0]
    .toLowerCase()
    .replace(/[._-]/g, '.');
  
  // Combine email and job title for search
  const searchText = `${localPart} ${jobTitle || ''}`.toLowerCase();
  
  // Check each department
  for (const [dept, patterns] of Object.entries(DEPARTMENT_PATTERNS)) {
    for (const pattern of patterns) {
      // Allow . _ - as separators
      const searchPattern = pattern.replace(/\./g, '[._-]?');
      const regex = new RegExp(`\\b${searchPattern}\\b`, 'i');
      
      if (regex.test(searchText)) {
        return capitalize(dept);
      }
    }
  }
  
  return null;
}
```

---

## Scoring Algorithms

### Verification Score

**Calculation:**

```typescript
let score = 0;

// Syntax (30 points)
if (result.format.valid) score += 30;

// Domain/MX Records (40 points)
if (result.domain.valid) score += 40;

// SMTP Verification (25 points)
if (result.smtp.valid === true) score += 25;
// Note: smtp.valid === null doesn't add points (unverifiable)

// Penalties
if (result.disposable) score -= 40;     // Disposable
if (result.freeProvider) score -= 5;    // Free provider

// Clamp between 0-100
score = Math.max(0, Math.min(100, score));
```

**Examples:**

```typescript
// Perfect email
{
  format.valid: true,     // +30
  domain.valid: true,     // +40
  smtp.valid: true,       // +25
  disposable: false,      // +0
  freeProvider: false     // +0
}
// Score: 95 ⭐⭐⭐⭐⭐

// Free provider
{
  format.valid: true,     // +30
  domain.valid: true,     // +40
  smtp.valid: true,       // +25
  disposable: false,      // +0
  freeProvider: true      // -5
}
// Score: 90 ⭐⭐⭐⭐⭐

// Disposable email
{
  format.valid: true,     // +30
  domain.valid: true,     // +40
  smtp.valid: true,       // +25
  disposable: true,       // -40
  freeProvider: false     // +0
}
// Score: 55 ⭐⭐

// Unverifiable SMTP
{
  format.valid: true,     // +30
  domain.valid: true,     // +40
  smtp.valid: null,       // +0 (couldn't verify)
  disposable: false,      // +0
  freeProvider: false     // +0
}
// Score: 70 ⭐⭐⭐
```

### Status Determination

```typescript
function determineStatus(result: DetailedVerificationResult): Status {
  // Invalid cases
  if (!result.format.valid || !result.domain.valid) {
    return 'INVALID';
  }
  
  // Risky cases
  if (result.disposable) {
    return 'RISKY';
  }
  
  if (result.smtp.valid === false) {
    return 'INVALID';  // SMTP explicitly rejected
  }
  
  // Valid cases
  if (result.smtp.valid === true && score >= 80) {
    return 'VALID';
  }
  
  // Unverifiable cases
  if (result.smtp.valid === null) {
    return 'RISKY';  // Couldn't verify mailbox
  }
  
  // Default
  return score >= 60 ? 'RISKY' : 'UNKNOWN';
}
```

### Classification Confidence

**Calculation:**

```typescript
let confidence = 50; // Base

if (isGeneric) {
  // Generic emails: 30-45%
  confidence = 30;
  if (department) confidence = 45;
  
} else {
  // Personal emails: 70-100%
  confidence = 70;
  if (firstName && lastName) confidence += 15;
  if (jobTitle) confidence += 10;
  if (department) confidence += 5;
}

// Clamp 0-100
confidence = Math.min(100, Math.max(0, confidence));
```

**Examples:**

```typescript
// Personal with full info
classifyEmail(
  'john.smith@company.com',
  'John',           // +15
  'Smith',          // +15 (total)
  'CEO'             // +10
)
// Base: 70, +15, +10 = 95% ⭐⭐⭐⭐⭐

// Personal with partial info
classifyEmail(
  'john@company.com',
  'John',           // +10 (only first name)
  undefined,
  undefined
)
// Base: 70, +10 = 80% ⭐⭐⭐⭐

// Generic with department
classifyEmail('sales@company.com')
// Detected: Sales department
// Base: 30, +15 (dept) = 45% ⭐⭐

// Generic without department
classifyEmail('info@company.com')
// Base: 30% ⭐
```

---

## Performance

### Benchmarks

**Single Email Verification:**
- Syntax only: <1ms
- Syntax + MX: 100-500ms
- Full (+ SMTP): 2-5 seconds

**Batch Verification:**
```
10 emails (concurrency: 5):  ~4-8 seconds
50 emails (concurrency: 10): ~15-25 seconds
100 emails (concurrency: 10): ~30-50 seconds
```

### Optimization Strategies

#### 1. Built-in Caching

The library automatically caches results:

```typescript
// First call: Full verification (2-5s)
await verifyEmail('john@example.com');

// Subsequent calls: Instant (cached)
await verifyEmail('john@example.com'); // <1ms
```

**Cache duration:** Configurable (default: persistent)

#### 2. Batch Processing

Process multiple emails concurrently:

```typescript
// Sequential (slow): 10 emails × 3s = 30s
for (const email of emails) {
  await verifyEmail(email);
}

// Concurrent (fast): 10 emails ÷ 5 = ~6s
await verifyEmailsBatch(emails, { concurrency: 5 });
```

#### 3. Timeout Configuration

Adjust timeouts for your use case:

```typescript
// Fast but may miss some verifications
await verifyEmail('john@example.com', { timeout: 5000 });

// Thorough but slower
await verifyEmail('john@example.com', { timeout: 15000 });
```

#### 4. Selective Verification

Skip expensive checks when not needed:

```typescript
// Quick check (no SMTP)
await verifyEmail('john@example.com', {
  verifySmtp: false  // Skip SMTP (2-4s faster)
});

// Syntax + MX only
await verifyEmail('john@example.com', {
  verifySmtp: false,
  checkDisposable: false,
  checkFree: false
});
```

---

## Error Handling

### Error Types

**1. Network Errors**
```typescript
try {
  await verifyEmail('john@example.com');
} catch (error) {
  // Timeout, connection failed, DNS error
  console.error('Network error:', error);
}
```

**2. Invalid Input**
```typescript
const result = await verifyEmail('invalid@');
// Returns: { status: 'INVALID', score: 0, ... }
// Does NOT throw
```

**3. Rate Limiting**
```typescript
// Some mail servers may rate limit
// Result: { smtp: { valid: null, error: 'Rate limited' } }
```

### Graceful Degradation

The validator never throws on verification failure:

```typescript
const result = await verifyEmail('john@blocked-server.com');

if (result.status === 'UNKNOWN') {
  console.log('Verification failed, but email may still be valid');
  console.log('Reason:', result.smtpResponse?.error);
  
  // Still get basic checks
  console.log('Syntax valid:', result.checks.syntaxValid);
  console.log('MX found:', result.checks.mxRecordsFound);
}
```

### Retry Strategy

For production use, implement retries:

```typescript
async function verifyWithRetry(
  email: string,
  maxRetries: number = 3
): Promise<VerifyEmailResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await verifyEmail(email);
      
      // If got a definitive result, return it
      if (result.status !== 'UNKNOWN') {
        return result;
      }
      
      // If unknown, retry
      if (i < maxRetries - 1) {
        console.log(`Retry ${i + 1}/${maxRetries - 1}...`);
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

---

## API Reference

### Types

```typescript
interface VerifyEmailResponse {
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

interface EmailClassification {
  type: 'personal' | 'generic';
  department: string | null;
  confidence: number;
  isValid: boolean;
}

interface BatchVerifyResult {
  results: VerifyEmailResponse[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    risky: number;
    unknown: number;
  };
}
```

### Functions

#### `verifyEmail(email, options?)`

Verify a single email address.

```typescript
const result = await verifyEmail('john@example.com', {
  timeout: 10000,        // 10 seconds
  verifyMx: true,
  verifySmtp: true,
  checkDisposable: true,
  checkFree: true
});
```

#### `verifyEmailsBatch(emails, options?)`

Verify multiple emails concurrently.

```typescript
const result = await verifyEmailsBatch(['email1@test.com', 'email2@test.com'], {
  concurrency: 10,       // Process 10 at a time
  timeout: 10000,
  verifyMx: true,
  verifySmtp: true,
  checkDisposable: true,
  checkFree: true
});
```

#### `classifyEmail(email, firstName?, lastName?, jobTitle?)`

Classify email type and detect department.

```typescript
const result = classifyEmail(
  'john.smith@company.com',
  'John',
  'Smith',
  'Software Engineer'
);
```

#### `isGenericEmail(email)`

Quick check if email is role-based.

```typescript
isGenericEmail('info@company.com'); // true
isGenericEmail('john@company.com'); // false
```

#### `detectDepartment(email, jobTitle?)`

Detect department from email address.

```typescript
detectDepartment('john.engineer@company.com'); // 'Engineering'
detectDepartment('sales@company.com'); // 'Sales'
```

---

## Best Practices

### 1. Use Batch Processing

```typescript
// ❌ Bad: Sequential
for (const email of emails) {
  await verifyEmail(email); // 3s each
}
// Time: 3s × 100 = 300s (5 minutes)

// ✅ Good: Batch
await verifyEmailsBatch(emails, { concurrency: 10 });
// Time: ~30s
```

### 2. Handle Timeouts Appropriately

```typescript
// For critical verifications
await verifyEmail(email, { timeout: 15000 }); // Give more time

// For bulk processing
await verifyEmail(email, { timeout: 5000 });  // Fail fast
```

### 3. Cache Results

```typescript
// The library caches automatically, but you can also:
const cache = new Map<string, VerifyEmailResponse>();

async function getCachedVerification(email: string) {
  if (cache.has(email)) {
    return cache.get(email);
  }
  
  const result = await verifyEmail(email);
  cache.set(email, result);
  return result;
}
```

### 4. Filter by Status and Score

```typescript
const result = await verifyEmailsBatch(emails);

// High-quality emails only
const good = result.results.filter(r => 
  r.status === 'VALID' && 
  r.score >= 80 &&
  !r.checks.isDisposable
);

// Remove definitely invalid
const notInvalid = result.results.filter(r => 
  r.status !== 'INVALID'
);
```

### 5. Respect Mail Servers

```typescript
// Don't overwhelm servers
await verifyEmailsBatch(emails, {
  concurrency: 5,  // Not too high
  timeout: 10000   // Give reasonable time
});

// Add delays between batches
for (let i = 0; i < batches.length; i++) {
  await verifyEmailsBatch(batches[i]);
  if (i < batches.length - 1) {
    await new Promise(r => setTimeout(r, 5000)); // Wait 5s
  }
}
```

---

## Testing

### Unit Tests

```typescript
describe('Email Verification', () => {
  it('should verify valid email', async () => {
    const result = await verifyEmail('test@gmail.com');
    expect(result.status).toBe('VALID');
    expect(result.score).toBeGreaterThan(80);
  });
  
  it('should detect disposable email', async () => {
    const result = await verifyEmail('test@mailinator.com');
    expect(result.checks.isDisposable).toBe(true);
    expect(result.status).toBe('RISKY');
  });
});
```

### Integration Tests

```typescript
describe('Batch Verification', () => {
  it('should handle mixed emails', async () => {
    const result = await verifyEmailsBatch([
      'valid@gmail.com',
      'invalid@fake.com',
      'disposable@mailinator.com'
    ]);
    
    expect(result.summary.total).toBe(3);
    expect(result.summary.valid).toBeGreaterThan(0);
    expect(result.summary.invalid).toBeGreaterThan(0);
  });
});
```

---

## License

MIT License - See LICENSE file for details.

---

**Questions?** Open an issue on GitHub!

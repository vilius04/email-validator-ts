# 📧 Advanced Email Validator

A comprehensive email verification and classification tool that checks syntax, MX records, SMTP validity, and classifies emails by type and department. Built with TypeScript for production use.

## ✨ Features

### **Email Verification**
- ✅ **Syntax Validation**: RFC 5322 compliant
- ✅ **MX Record Check**: Verifies domain has mail servers
- ✅ **SMTP Verification**: Confirms mailbox exists
- ✅ **Disposable Detection**: Identifies temp email services (10minutemail, etc.)
- ✅ **Free Provider Detection**: Flags Gmail, Yahoo, Outlook, etc.
- ✅ **Scoring System**: 0-100 confidence score

### **Email Classification**
- 🎯 **Type Detection**: Personal vs Generic/Role-based
- 🏢 **Department Detection**: 12 departments (Engineering, Sales, Marketing, etc.)
- 📊 **Confidence Scoring**: Quality rating for each email
- 🧹 **Email Cleaning**: Handles URL encoding and malformed addresses

### **Performance**
- ⚡ **Batch Processing**: Verify multiple emails concurrently
- 🔄 **Built-in Caching**: Automatic caching for faster repeat checks
- 🚀 **Fast**: Typical verification in 2-5 seconds

## 🚀 Quick Start

### Installation

```bash
npm install
npm run build
```

### Basic Usage

```typescript
import { verifyEmail, classifyEmail } from './src';

// Verify an email
const result = await verifyEmail('john@example.com');
console.log(result.status);  // 'VALID', 'INVALID', 'RISKY', or 'UNKNOWN'
console.log(result.score);   // 0-100

// Classify an email
const classification = classifyEmail(
  'john.smith@company.com',
  'John',
  'Smith',
  'Software Engineer'
);
console.log(classification.type);       // 'personal' or 'generic'
console.log(classification.department); // 'Engineering'
console.log(classification.confidence); // 95
```

### CLI Usage

```bash
# Verify single email
npm run example verify john@example.com

# Batch verification
npm run example batch email1@test.com email2@test.com email3@test.com

# Classify email
npm run example classify john.smith@company.com John Smith "Software Engineer"
```

## 📖 Examples

### Example 1: Single Email Verification

```typescript
import { verifyEmail } from './src';

const result = await verifyEmail('john.doe@gmail.com');

console.log(result);
// {
//   email: 'john.doe@gmail.com',
//   status: 'VALID',
//   score: 85,
//   checks: {
//     syntaxValid: true,
//     mxRecordsFound: true,
//     smtpValid: true,
//     isDisposable: false,
//     isRoleBased: false,
//     isCatchAll: false,
//     isFreeProvider: true
//   },
//   domain: 'gmail.com',
//   verifiedAt: 2025-11-19T...
// }
```

### Example 2: Batch Verification

```typescript
import { verifyEmailsBatch } from './src';

const result = await verifyEmailsBatch([
  'valid@gmail.com',
  'invalid@fake-domain.com',
  'disposable@mailinator.com',
], {
  concurrency: 5 // Process 5 at a time
});

console.log(result.summary);
// { total: 3, valid: 1, invalid: 1, risky: 1, unknown: 0 }

console.log(result.results[0]);
// { email: 'valid@gmail.com', status: 'VALID', score: 85, ... }
```

### Example 3: Email Classification

```typescript
import { classifyEmail, detectDepartment } from './src';

// Classify with full context
const result = classifyEmail(
  'john.engineer@company.com',
  'John',
  'Doe',
  'Senior Software Engineer'
);

console.log(result);
// {
//   type: 'personal',
//   department: 'Engineering',
//   confidence: 95,
//   isValid: true
// }

// Quick department check
const dept = detectDepartment('sales.team@company.com');
console.log(dept); // 'Sales'
```

### Example 4: Filter by Quality

```typescript
import { verifyEmailsBatch } from './src';

const emails = [
  'john@company.com',
  'info@company.com',
  'sales@company.com',
  'test@mailinator.com',
];

const result = await verifyEmailsBatch(emails);

// Get only high-quality emails
const highQuality = result.results.filter(e => 
  e.status === 'VALID' && 
  e.score >= 80 &&
  !e.checks.isDisposable
);

console.log(`${highQuality.length} high-quality emails found`);
```

### Example 5: Check Email Types

```typescript
import { isGenericEmail, cleanEmail } from './src';

const emails = [
  'john@company.com',
  'info@company.com',
  'sales@company.com',
];

emails.forEach(email => {
  const cleaned = cleanEmail(email);
  const isGeneric = isGenericEmail(email);
  console.log(`${email}: ${isGeneric ? 'Generic' : 'Personal'}`);
});

// Output:
// john@company.com: Personal
// info@company.com: Generic
// sales@company.com: Generic
```

## 📊 Understanding Results

### Status Values

| Status | Meaning | Description |
|--------|---------|-------------|
| `VALID` | ✅ Good | Email exists and is deliverable |
| `INVALID` | ❌ Bad | Email doesn't exist or syntax error |
| `RISKY` | ⚠️ Caution | Disposable, catch-all, or unverifiable |
| `UNKNOWN` | ❓ Unknown | Couldn't verify (timeout, blocked, etc.) |

### Score Ranges

| Score | Quality | Stars | Description |
|-------|---------|-------|-------------|
| 90-100 | Excellent | ⭐⭐⭐⭐⭐ | Valid, deliverable, permanent |
| 80-89 | Good | ⭐⭐⭐⭐ | Valid but may be free provider |
| 70-79 | Fair | ⭐⭐⭐ | Valid but limited verification |
| 50-69 | Poor | ⭐⭐ | Risky or partial verification |
| 0-49 | Very Poor | ⭐ | Invalid or disposable |

### Classification Types

**Personal Email:**
- Format: firstname.lastname@company.com
- Confidence: 70-100%
- Best for: Direct outreach

**Generic Email:**
- Format: info@, sales@, support@company.com
- Confidence: 30-45%
- Best for: General inquiries

### Department Detection

The validator can detect 12 departments:
- Engineering
- Sales
- Marketing
- Operations
- Finance
- HR
- Support
- Legal
- Product
- Design
- Executive
- IT

## 🔧 Configuration

### Verification Options

```typescript
import { verifyEmail } from './src';

const result = await verifyEmail('john@example.com', {
  timeout: 10000,        // Timeout in ms (default: 10000)
  verifyMx: true,        // Check MX records (default: true)
  verifySmtp: true,      // Check SMTP (default: true)
  checkDisposable: true, // Check if disposable (default: true)
  checkFree: true,       // Check if free provider (default: true)
});
```

### Batch Options

```typescript
import { verifyEmailsBatch } from './src';

const result = await verifyEmailsBatch(emails, {
  concurrency: 10,       // Process 10 at a time (default: 10)
  timeout: 10000,        // Timeout per email
  verifyMx: true,
  verifySmtp: true,
  checkDisposable: true,
  checkFree: true,
});
```

## 🎯 Common Use Cases

### Use Case 1: Lead Validation

```typescript
// Validate leads before adding to CRM
const leads = [
  { email: 'john@company.com', name: 'John Doe' },
  { email: 'info@company.com', name: 'Info' },
  // ... more leads
];

const emails = leads.map(l => l.email);
const result = await verifyEmailsBatch(emails);

// Filter only valid, non-generic emails
const validLeads = result.results
  .filter(r => r.status === 'VALID' && r.score >= 70)
  .map(r => leads.find(l => l.email === r.email));

console.log(`${validLeads.length} valid leads out of ${leads.length}`);
```

### Use Case 2: Email List Cleaning

```typescript
// Clean an email list
const emailList = [
  'john@company.com',
  'invalid@',
  'test@mailinator.com',
  'info@company.com',
];

const result = await verifyEmailsBatch(emailList);

// Remove invalid and disposable
const cleanList = result.results
  .filter(r => 
    r.status !== 'INVALID' && 
    !r.checks.isDisposable
  )
  .map(r => r.email);

console.log(`Cleaned list: ${cleanList.length}/${emailList.length} emails`);
```

### Use Case 3: Personalization Routing

```typescript
// Route emails based on type
const email = 'john.smith@company.com';
const classification = classifyEmail(email, 'John', 'Smith', 'CEO');

if (classification.type === 'personal' && classification.confidence >= 70) {
  // Send personalized email
  console.log('Sending personalized email...');
} else if (classification.department) {
  // Send department-specific email
  console.log(`Sending ${classification.department} email...`);
} else {
  // Send generic email
  console.log('Sending generic email...');
}
```

## 🧪 Testing

```bash
# Run basic examples
npm run dev

# Run CLI
npm run example verify test@example.com

# Batch verification
npm run example batch email1@test.com email2@test.com
```

## ⚠️ Important Notes

### SMTP Verification

- **May trigger alerts**: Some servers log SMTP checks as suspicious activity
- **Can be slow**: SMTP checks take 2-5 seconds per email
- **May be blocked**: Some servers block verification attempts
- **False negatives**: Some valid emails may show as unverifiable

### Best Practices

1. **Cache results**: The library automatically caches for performance
2. **Use batch processing**: Much faster for multiple emails
3. **Handle timeouts**: Set appropriate timeouts for your use case
4. **Respect rate limits**: Don't overwhelm mail servers
5. **Test thoroughly**: Verify behavior with your specific email domains

## 📝 API Reference

### Main Functions

#### `verifyEmail(email, options?)`

Verify a single email address.

**Returns:** `Promise<VerifyEmailResponse>`

#### `verifyEmailsBatch(emails, options?)`

Verify multiple emails in batch.

**Returns:** `Promise<BatchVerifyResult>`

#### `classifyEmail(email, firstName?, lastName?, jobTitle?)`

Classify email type and detect department.

**Returns:** `EmailClassification`

#### `isGenericEmail(email)`

Quick check if email is generic/role-based.

**Returns:** `boolean`

#### `detectDepartment(email, jobTitle?)`

Detect department from email and job title.

**Returns:** `string | null`

#### `cleanEmail(email)`

Clean and normalize email address.

**Returns:** `string | null`

#### `isValidEmail(email)`

Quick syntax validation.

**Returns:** `boolean`

#### `isDisposableEmail(email)`

Check if email is from disposable provider.

**Returns:** `boolean`

#### `isFreeEmail(email)`

Check if email is from free provider (Gmail, Yahoo, etc.).

**Returns:** `boolean`

## 📚 More Information

For detailed technical documentation, see [TECHNICAL.md](TECHNICAL.md)

## 🤝 Contributing

Contributions welcome! This tool was extracted from a production SaaS application.

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Vilius Brazdeikis**

---

**⭐ Star this repo if you find it useful!**

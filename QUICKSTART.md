# 🚀 Quick Start Guide

Get up and running with the email validator in under 5 minutes!

## Installation

```bash
cd email-validator
npm install
```

## Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Run Your First Verification

### Option 1: Using the CLI

```bash
# Verify a single email
npm run example verify john@example.com

# Batch verification
npm run example batch john@test.com jane@test.com info@test.com

# Classify an email
npm run example classify john.smith@company.com John Smith "Software Engineer"
```

### Option 2: Run Examples

```bash
npm run dev
```

This runs `examples/basic-usage.ts` with 5 complete examples.

### Option 3: Custom Script

Create a file `my-validator.ts`:

```typescript
import { verifyEmail } from './src';

async function main() {
  const result = await verifyEmail('test@gmail.com');
  
  console.log(`Status: ${result.status}`);
  console.log(`Score: ${result.score}/100`);
  console.log(`Valid: ${result.checks.syntaxValid}`);
  console.log(`MX Records: ${result.checks.mxRecordsFound}`);
  console.log(`SMTP Valid: ${result.checks.smtpValid}`);
}

main();
```

Run it:
```bash
ts-node my-validator.ts
```

## Understanding Results

### Status Values

- **VALID** ✅: Email exists and is deliverable
- **INVALID** ❌: Email doesn't exist or has syntax error
- **RISKY** ⚠️: Disposable, catch-all, or unverifiable
- **UNKNOWN** ❓: Couldn't verify (timeout, blocked, etc.)

### Score Ranges

- **90-100** ⭐⭐⭐⭐⭐: Excellent - Safe to use
- **80-89** ⭐⭐⭐⭐: Good - Probably valid
- **70-79** ⭐⭐⭐: Fair - Use with caution
- **50-69** ⭐⭐: Poor - Risky
- **0-49** ⭐: Very poor - Avoid

## Common Tasks

### Task 1: Verify an Email

```typescript
import { verifyEmail } from './src';

const result = await verifyEmail('john@example.com');
if (result.status === 'VALID' && result.score >= 80) {
  console.log('Good email!');
}
```

### Task 2: Batch Verify

```typescript
import { verifyEmailsBatch } from './src';

const emails = ['email1@test.com', 'email2@test.com'];
const result = await verifyEmailsBatch(emails);

console.log(`${result.summary.valid} valid emails`);
```

### Task 3: Check if Generic

```typescript
import { isGenericEmail } from './src';

const isGeneric = isGenericEmail('info@company.com');
console.log(isGeneric); // true

const isPersonal = isGenericEmail('john@company.com');
console.log(isPersonal); // false
```

### Task 4: Detect Department

```typescript
import { detectDepartment } from './src';

const dept1 = detectDepartment('john.engineer@company.com');
console.log(dept1); // 'Engineering'

const dept2 = detectDepartment('sales@company.com');
console.log(dept2); // 'Sales'
```

### Task 5: Classify with Full Info

```typescript
import { classifyEmail } from './src';

const result = classifyEmail(
  'john.smith@company.com',
  'John',
  'Smith',
  'Software Engineer'
);

console.log(result.type);       // 'personal'
console.log(result.department); // 'Engineering'
console.log(result.confidence); // 95
```

## Configuration

### Basic Options

```typescript
await verifyEmail('john@example.com', {
  timeout: 10000,        // 10 seconds (default)
  verifyMx: true,        // Check MX records (default)
  verifySmtp: true,      // Check SMTP (default)
  checkDisposable: true, // Check if disposable (default)
  checkFree: true,       // Check if free provider (default)
});
```

### Batch Options

```typescript
await verifyEmailsBatch(emails, {
  concurrency: 10,  // Process 10 at once (default)
  timeout: 10000,   // Timeout per email
  // ... same options as single verify
});
```

## Troubleshooting

### "SMTP verification failed"
- Some servers block verification attempts
- Try with `verifySmtp: false` for faster check
- Still get syntax + MX validation

### "Timeout error"
- Increase timeout: `timeout: 15000` (15 seconds)
- Or disable SMTP: `verifySmtp: false`

### "Too slow"
- Use batch processing for multiple emails
- Reduce concurrency: `concurrency: 5`
- Disable SMTP verification

### "All emails showing RISKY"
- This is normal for unverifiable SMTP
- Filter by score instead: `score >= 70`
- Check specific flags: `!isDisposable`

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Read [TECHNICAL.md](TECHNICAL.md) for implementation details
- Check [examples/](examples/) for more code samples

## Common Use Cases

### Use Case 1: Email List Cleaning

```typescript
const emails = [/* your list */];
const result = await verifyEmailsBatch(emails);

const clean = result.results
  .filter(r => r.status !== 'INVALID' && !r.checks.isDisposable)
  .map(r => r.email);

console.log(`Kept ${clean.length}/${emails.length} emails`);
```

### Use Case 2: Lead Validation

```typescript
const leads = [
  { email: 'john@company.com', name: 'John' },
  { email: 'info@company.com', name: 'Info' }
];

const validLeads = [];
for (const lead of leads) {
  const result = await verifyEmail(lead.email);
  const classification = classifyEmail(lead.email);
  
  if (result.status === 'VALID' && classification.type === 'personal') {
    validLeads.push(lead);
  }
}
```

### Use Case 3: Real-time Validation

```typescript
// In your signup form
async function validateEmailOnSubmit(email: string) {
  const result = await verifyEmail(email, {
    timeout: 5000,  // Fast response
    verifySmtp: false  // Skip slow SMTP check
  });
  
  if (result.status === 'INVALID') {
    return 'Invalid email address';
  }
  
  if (result.checks.isDisposable) {
    return 'Disposable emails not allowed';
  }
  
  return null; // Valid
}
```

## Performance Tips

1. **Use batch processing** for multiple emails
2. **Cache results** - library does this automatically
3. **Adjust timeouts** based on your needs
4. **Skip SMTP** if you need speed over accuracy
5. **Lower concurrency** if hitting rate limits

---

**Need Help?** Check [TECHNICAL.md](TECHNICAL.md) or open an issue!

**Ready to go?** Try: `npm run dev`

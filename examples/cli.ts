#!/usr/bin/env node

import { verifyEmail, verifyEmailsBatch, classifyEmail } from '../src';
import * as fs from 'fs';

/**
 * Simple CLI interface for the email validator
 * 
 * Usage:
 *   Single email:  ts-node examples/cli.ts verify john@example.com
 *   Batch:         ts-node examples/cli.ts batch email1@test.com email2@test.com
 *   Classify:      ts-node examples/cli.ts classify john.smith@company.com John Smith "Software Engineer"
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'verify':
      await handleVerify(args.slice(1));
      break;
    case 'batch':
      await handleBatch(args.slice(1));
      break;
    case 'classify':
      await handleClassify(args.slice(1));
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`
📧 Email Validator CLI

Usage:
  Verify single email:
    ts-node examples/cli.ts verify <email>
    
  Batch verification:
    ts-node examples/cli.ts batch <email1> <email2> ...
    
  Classify email:
    ts-node examples/cli.ts classify <email> [firstName] [lastName] [jobTitle]

Examples:
  ts-node examples/cli.ts verify john@example.com
  ts-node examples/cli.ts batch john@test.com jane@test.com
  ts-node examples/cli.ts classify john.smith@company.com John Smith "Software Engineer"
`);
}

async function handleVerify(args: string[]) {
  if (args.length === 0) {
    console.error('Error: No email provided');
    printUsage();
    process.exit(1);
  }
  
  const email = args[0];
  console.log(`\n🔍 Verifying: ${email}...\n`);
  
  try {
    const result = await verifyEmail(email);
    
    console.log('═'.repeat(60));
    console.log(`📧 VERIFICATION RESULT`);
    console.log('═'.repeat(60));
    console.log(`Email:    ${result.email}`);
    console.log(`Status:   ${getStatusIcon(result.status)} ${result.status}`);
    console.log(`Score:    ${result.score}/100 ${getScoreStars(result.score)}`);
    console.log(`Domain:   ${result.domain}`);
    console.log(`Verified: ${result.verifiedAt.toISOString()}`);
    
    console.log('\n' + '─'.repeat(60));
    console.log('CHECKS');
    console.log('─'.repeat(60));
    console.log(`  Syntax Valid:     ${result.checks.syntaxValid ? '✅' : '❌'}`);
    console.log(`  MX Records Found: ${result.checks.mxRecordsFound ? '✅' : '❌'}`);
    console.log(`  SMTP Valid:       ${result.checks.smtpValid ? '✅' : '❌'}`);
    console.log(`  Is Disposable:    ${result.checks.isDisposable ? '⚠️  Yes' : '✅ No'}`);
    console.log(`  Is Free Provider: ${result.checks.isFreeProvider ? '⚠️  Yes' : '✅ No'}`);
    console.log(`  Is Role Based:    ${result.checks.isRoleBased ? '⚠️  Yes' : '✅ No'}`);
    
    if (result.mxRecords && result.mxRecords.length > 0) {
      console.log('\n' + '─'.repeat(60));
      console.log('MX RECORDS');
      console.log('─'.repeat(60));
      result.mxRecords.forEach((mx, i) => {
        console.log(`  ${i + 1}. ${mx}`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    
    // Save to file
    const filename = `${email.replace(/[^a-z0-9]/gi, '_')}_verification.json`;
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${filename}\n`);
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

async function handleBatch(args: string[]) {
  if (args.length === 0) {
    console.error('Error: No emails provided');
    printUsage();
    process.exit(1);
  }
  
  console.log(`\n🔍 Batch verifying ${args.length} emails...\n`);
  
  try {
    const result = await verifyEmailsBatch(args);
    
    console.log('═'.repeat(60));
    console.log(`📊 BATCH VERIFICATION SUMMARY`);
    console.log('═'.repeat(60));
    console.log(`Total:   ${result.summary.total}`);
    console.log(`Valid:   ${result.summary.valid} ✅`);
    console.log(`Invalid: ${result.summary.invalid} ❌`);
    console.log(`Risky:   ${result.summary.risky} ⚠️`);
    console.log(`Unknown: ${result.summary.unknown} ❓`);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📧 RESULTS');
    console.log('═'.repeat(60));
    
    result.results.forEach((r, i) => {
      const icon = getStatusIcon(r.status);
      const stars = getScoreStars(r.score);
      console.log(`\n${i + 1}. ${r.email}`);
      console.log(`   Status: ${icon} ${r.status}`);
      console.log(`   Score:  ${r.score}/100 ${stars}`);
      console.log(`   Domain: ${r.domain}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    
    // Save to file
    const filename = `batch_verification_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${filename}\n`);
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

async function handleClassify(args: string[]) {
  if (args.length === 0) {
    console.error('Error: No email provided');
    printUsage();
    process.exit(1);
  }
  
  const email = args[0];
  const firstName = args[1];
  const lastName = args[2];
  const jobTitle = args[3];
  
  console.log(`\n🎯 Classifying: ${email}...\n`);
  
  const result = classifyEmail(email, firstName, lastName, jobTitle);
  
  console.log('═'.repeat(60));
  console.log(`📊 CLASSIFICATION RESULT`);
  console.log('═'.repeat(60));
  console.log(`Email:      ${email}`);
  console.log(`Type:       ${result.type === 'personal' ? '👤 Personal' : '🏢 Generic'}`);
  console.log(`Department: ${result.department || 'Unknown'}`);
  console.log(`Confidence: ${result.confidence}% ${getScoreStars(result.confidence)}`);
  console.log(`Valid:      ${result.isValid ? '✅' : '❌'}`);
  console.log('═'.repeat(60));
  
  console.log('\n');
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'VALID': return '✅';
    case 'INVALID': return '❌';
    case 'RISKY': return '⚠️';
    case 'UNKNOWN': return '❓';
    default: return '❓';
  }
}

function getScoreStars(score: number): string {
  if (score >= 90) return '⭐⭐⭐⭐⭐';
  if (score >= 80) return '⭐⭐⭐⭐';
  if (score >= 70) return '⭐⭐⭐';
  if (score >= 50) return '⭐⭐';
  if (score >= 30) return '⭐';
  return '';
}

// Run CLI
main();

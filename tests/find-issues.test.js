import { describe, test, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

describe('Find and Report Migration Issues', () => {
  let htmlContent = '';

  beforeAll(async () => {
    const filePath = path.resolve('./admin-dashboard.html');
    htmlContent = await fs.readFile(filePath, 'utf-8');
  });

  test('Report all .user_id references in master_users context', () => {
    const lines = htmlContent.split('\n');
    const issues = [];

    lines.forEach((line, idx) => {
      // Look for master_users followed by user_id within the next few lines
      if (line.includes("from('master_users')")) {
        // Check next 10 lines for .user_id usage
        for (let i = idx; i < Math.min(idx + 10, lines.length); i++) {
          if (lines[i].includes('.user_id')) {
            issues.push({
              line: idx + 1,
              context: lines[idx].trim().substring(0, 60) + '...'
            });
            break;
          }
        }
      }
    });

    console.log('\n=== Issues Found ===');
    console.log(`Found ${issues.length} instances where master_users uses .user_id`);

    if (issues.length > 0) {
      console.log('\nLocations to fix:');
      issues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.context}`);
      });
    }

    // Return issues for fixing
    return issues;
  });
});
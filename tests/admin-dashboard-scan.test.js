import { describe, test, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

describe('Admin Dashboard Code Scan', () => {
  let htmlContent = '';

  beforeAll(async () => {
    // Read the actual admin-dashboard.html file
    const filePath = path.resolve('./admin-dashboard.html');
    try {
      htmlContent = await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      console.error('Could not read admin-dashboard.html:', err);
    }
  });

  describe('Check for profiles table references', () => {
    test('should NOT contain .from("profiles")', () => {
      const hasProfilesTable = htmlContent.includes('.from("profiles")') ||
                               htmlContent.includes(".from('profiles')");
      expect(hasProfilesTable).toBe(false);
    });

    test('should NOT contain .from(`profiles`)', () => {
      const hasProfilesTable = htmlContent.includes('.from(`profiles`)');
      expect(hasProfilesTable).toBe(false);
    });
  });

  describe('Check for incorrect column names', () => {
    test('should NOT use kiosk_auth_user_id', () => {
      const hasIncorrectColumn = htmlContent.includes('kiosk_auth_user_id');
      if (hasIncorrectColumn) {
        // Find occurrences for debugging
        const lines = htmlContent.split('\n');
        const occurrences = lines
          .map((line, idx) => ({ line, num: idx + 1 }))
          .filter(({ line }) => line.includes('kiosk_auth_user_id'))
          .map(({ num }) => `Line ${num}`);
        console.log('Found kiosk_auth_user_id at:', occurrences);
      }
      expect(hasIncorrectColumn).toBe(false);
    });

    test('should use kiosk_user_id instead', () => {
      const hasCorrectColumn = htmlContent.includes('kiosk_user_id');
      expect(hasCorrectColumn).toBe(true);
    });
  });

  describe('Check user_id vs auth_user_id usage', () => {
    test('master_users queries should use auth_user_id for UUIDs', () => {
      // Look for patterns where master_users is used with user_id
      const masterUsersPattern = /from\(['"`]master_users['"`]\)[\s\S]*?\.user_id/g;
      const matches = htmlContent.match(masterUsersPattern);

      if (matches) {
        console.log('Found potential issues with user_id in master_users queries:', matches.length);
      }

      // This is context-dependent, so we just log findings
      expect(matches).toBeNull();
    });
  });

  describe('Check for view/table references that no longer exist', () => {
    test('should not reference non-existent views', () => {
      const nonExistentTables = [
        'two_week_email',
        'holidays',
        'schedules',
        'holiday_approvals',
        'staff_holidays',
        'mandatory_training'
      ];

      const issues = [];
      nonExistentTables.forEach(table => {
        const pattern = new RegExp(`\\.from\\(['"\`]${table}['"\`]\\)`, 'g');
        if (pattern.test(htmlContent)) {
          issues.push(table);
        }
      });

      if (issues.length > 0) {
        console.log('References to non-existent tables:', issues);
      }

      // These might be okay if they're views, but log them
      expect(issues.length).toBe(0);
    });
  });

  describe('Scan for common migration patterns', () => {
    test('identify all supabase.from() calls', () => {
      const fromPattern = /supabase\.from\(['"`]([\w_]+)['"`]\)/g;
      const tables = [];
      let match;

      while ((match = fromPattern.exec(htmlContent)) !== null) {
        if (!tables.includes(match[1])) {
          tables.push(match[1]);
        }
      }

      console.log('All tables referenced:', tables.sort());

      // Check if any of these should be master_users instead
      const suspiciousTables = tables.filter(t =>
        t.includes('profile') ||
        t.includes('user') && !t.includes('master')
      );

      if (suspiciousTables.length > 0) {
        console.log('Suspicious table references:', suspiciousTables);
      }

      expect(suspiciousTables).not.toContain('profiles');
    });
  });
});
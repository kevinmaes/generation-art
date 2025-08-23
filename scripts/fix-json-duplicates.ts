#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '.claude/settings.local.json');

interface SettingsJson {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
}

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content) as SettingsJson;

  let hasChanges = false;

  // Remove duplicates from permissions.allow
  if (json.permissions?.allow) {
    const original = json.permissions.allow.length;
    json.permissions.allow = [...new Set(json.permissions.allow)];
    if (original !== json.permissions.allow.length) {
      hasChanges = true;
      console.log(
        `✅ Removed ${String(original - json.permissions.allow.length)} duplicates from permissions.allow`,
      );
    }
  }

  // Remove duplicates from permissions.deny
  if (json.permissions?.deny) {
    const original = json.permissions.deny.length;
    json.permissions.deny = [...new Set(json.permissions.deny)];
    if (original !== json.permissions.deny.length) {
      hasChanges = true;
      console.log(
        `✅ Removed ${String(original - json.permissions.deny.length)} duplicates from permissions.deny`,
      );
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
    console.log('✅ Fixed duplicates in', filePath);
  } else {
    console.log('✅ No duplicates found');
  }
} catch (error) {
  console.error(
    '❌ Error:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}

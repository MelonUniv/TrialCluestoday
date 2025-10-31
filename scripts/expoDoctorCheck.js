#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function checkExists(relativePath) {
  try {
    fs.accessSync(path.join(root, relativePath));
    return true;
  } catch (error) {
    return false;
  }
}

console.log('Stop Scrolling expo-doctor (simulated) report');
console.log('-------------------------------------------');

const checks = [
  { label: 'Theme tokens available', path: 'theme/index.ts' },
  { label: 'Runtime theme bridge', path: 'stop-scrolling/assets/js/theme.js' },
  { label: 'Analytics bridge', path: 'stop-scrolling/assets/js/analytics.js' },
  { label: 'Analytics configuration', path: 'stop-scrolling/config/analytics.php' },
  { label: 'Hook unit tests', path: 'tests/unit/themeManager.test.js' },
  { label: 'API integration tests', path: 'tests/php/ContentModelTest.php' }
];

let success = true;

for (const item of checks) {
  if (checkExists(item.path)) {
    console.log(`✔︎ ${item.label}`);
  } else {
    console.log(`✖ ${item.label}`);
    success = false;
  }
}

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (packageJson.scripts && packageJson.scripts.test) {
    console.log('✔︎ Test script registered');
  } else {
    console.log('✖ Missing test script in package.json');
    success = false;
  }
} catch (error) {
  console.log('✖ Unable to read package.json');
  success = false;
}

if (!success) {
  process.exitCode = 1;
}

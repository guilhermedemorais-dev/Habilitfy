'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const rootEntrypoint = path.join(projectRoot, 'server.cjs');

try {
  process.chdir(projectRoot);
} catch (error) {
  console.error('[nodejs wrapper] failed to chdir to project root:', error);
  throw error;
}

if (!fs.existsSync(rootEntrypoint)) {
  throw new Error(
    `[nodejs wrapper] entrypoint not found: ${rootEntrypoint}. Check deploy root and files.`
  );
}

require(rootEntrypoint);

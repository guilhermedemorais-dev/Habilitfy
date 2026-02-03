#!/usr/bin/env node
// Entry point for Hostinger - loads the built server
// Using dynamic import for ESM compatibility
(async () => {
    await import("./dist/index.cjs");
})();

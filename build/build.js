/**
 * JS ClawHub - Build Script
 * Thin wrapper around cli/lib/builder.js for backward compatibility.
 *
 * Usage: node build/build.js
 */

import { build } from '../cli/lib/builder.js';

const result = build({ clean: true });

process.exit(result.i18nWarnings.length > 0 ? 0 : 0);

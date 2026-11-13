#!/usr/bin/env node
/*
 * Scan shipped Persian batches for known mistranslation patterns.
 *
 * These are the calques and glossary violations that make a translation read
 * as machine output: "flag" rendered as پرچم, the mentor "If" as the
 * conditional اگر, Associates as شرکا, and literal "take the trade".
 * Context (80 chars each side) is written to style-scan.json for review.
 *
 *   node _build/expert/scan-style.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const BATCHES = path.join(ROOT, '_build', 'expert', 'batches');
const OUT = path.join(__dirname, 'style-scan.json');

const RULES = [
  ['flag', /پرچم/g, 'فلگ/FL'],
  ['mentor-if', /(?:سلام|ممنون|مرسی|استاد|جناب|های|هی)\s+اگر\b|اگر\s+(?:جان|عزیز|گرامی)\b/g, 'ایف'],
  ['associates', /شرکا(?:ی)?|همکاران(?:\s+شرکتی)?/g, 'تریدرهای سطح اَسوشیت'],
  ['touch-trade', /معامله(?:\s*های)?\s+آزمایشی/g, 'ورود با تاچ سطح'],
  ['swap-night', /سواپ\s+شبانه/g, 'سطح سواپ'],
  ['take-trade', /(?:برداشتن|گرفتن)\s+(?:معامله|تجارت|پوزیشن)/g, 'ورود به معامله'],
];

const files = fs.readdirSync(BATCHES).filter(n => n.endsWith('.json'));
const hits = [];
const unreadable = [];
let scanned = 0;
for (const name of files) {
  let batch;
  try { batch = JSON.parse(fs.readFileSync(path.join(BATCHES, name), 'utf8')); }
  catch { unreadable.push(name); continue; }
  scanned++;
  for (const [hash, fa] of Object.entries(batch)) {
    if (typeof fa !== 'string') continue;
    for (const [rule, re, fix] of RULES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(fa))) {
        const at = m.index;
        hits.push({
          file: name,
          hash,
          rule,
          fix,
          match: m[0],
          context: fa.slice(Math.max(0, at - 80), at + m[0].length + 80).replace(/\s+/g, ' '),
        });
        if (hits.length > 4000) break;
      }
    }
  }
}

const byRule = {};
for (const h of hits) byRule[h.rule] = (byRule[h.rule] || 0) + 1;
fs.writeFileSync(OUT, JSON.stringify({ scanned, unreadable, byRule, hits }, null, 1), 'utf8');
console.log(JSON.stringify({ scanned, unreadable: unreadable.length, byRule, hits: hits.length }, null, 1));

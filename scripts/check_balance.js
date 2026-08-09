const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('Usage: node check_balance.js <file>'); process.exit(2); }
const s = fs.readFileSync(path, 'utf8');
const pairs = { '(': ')', '{': '}', '[': ']' };
const opens = new Set(Object.keys(pairs));
const closes = new Set(Object.values(pairs));
const stack = [];
const issues = [];
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (opens.has(ch)) stack.push({ch, i});
  else if (closes.has(ch)) {
    const last = stack[stack.length-1];
    const expected = last ? pairs[last.ch] : null;
    if (expected === ch) stack.pop();
    else {
      issues.push({pos: i, char: ch, expected});
    }
  }
}
const counts = { '(':0, ')':0, '{':0, '}':0, '[':0, ']':0 };
for (const ch of s) if (ch in counts) counts[ch]++;
console.log('counts:', counts);
console.log('openStackRemaining:', stack.length);
if (stack.length) console.log('remaining top:', stack[stack.length-1]);
if (issues.length) console.log('issues[0]:', issues[0]);
// print context around first issue if any
if (issues.length) {
  const p = issues[0].pos;
  console.log('context around issue:\n', s.slice(Math.max(0,p-60), p+60));
}
// print tail of file
console.log('--- file tail ---\n', s.slice(-400));

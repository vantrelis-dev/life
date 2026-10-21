'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('./dist/model.js'),state=M.upgrade(M.seed('2026-10-21'));
assert.equal(M.validState(state),true);
for(const key of ['tasks','goals','habits','projects','completionEvents','recurrences'])assert.equal(state[key].length,0,key+' must start empty');
const source=fs.readdirSync('dist').filter(x=>/\.(js|html|css)$/.test(x)).map(x=>fs.readFileSync('dist/'+x,'utf8')).join('\n');
// The SDK contains a harmless sb_secret_ prefix detector. Reject actual keys,
// not that detector's source string.
assert.doesNotMatch(source,/sb_secret_[A-Za-z0-9_-]{20,}/);
assert.doesNotMatch(source,/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
assert.doesNotMatch(source,/gh[pousr]_[A-Za-z0-9]{20,}/);
const html=fs.readFileSync('dist/index.html','utf8');
assert.match(html,/class="life-locked"/);assert.doesNotMatch(html,/<script[^>]+src="app\.js"/);
assert.match(fs.readFileSync('dist/app.js','utf8'),/requires an authenticated session/);
const deploy=JSON.parse(fs.readFileSync('vercel.json','utf8'));
assert.equal(deploy.outputDirectory,'dist');
assert.equal(fs.existsSync('dist/test-fixture.cjs'),false);
console.log('Estado vacío, ejemplos privados excluidos y carpeta de publicación: OK');

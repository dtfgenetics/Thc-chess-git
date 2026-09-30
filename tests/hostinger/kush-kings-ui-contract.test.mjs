import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("public-hostinger/kush-kings-chess/assets/app.js", "utf8");
const css = fs.readFileSync("public-hostinger/kush-kings-chess/assets/app.css", "utf8");
const html = fs.readFileSync("public-hostinger/kush-kings-chess/index.html", "utf8");

assert.match(html, /id="copy-invite"/);
assert.match(html, /id="invite-url"/);
assert.match(app, /els\.copyInvite\.addEventListener\("click", async \(\) =>/);
assert.match(app, /const copied = await copyText\(invite\)/);
assert.match(app, /copied \? "Invite copied\." : "Copy failed\./);
assert.match(app, /async function copyText\(text\)/);
assert.match(app, /navigator\.clipboard\?\.writeText/);
assert.match(app, /document\.execCommand\?\.\("copy"\) === true/);
assert.match(app, /input\.setSelectionRange\(0, text\.length\)/);
assert.doesNotMatch(app, /showToast\("Invite copied\."\);\s*\}\);/);

assert.match(css, /button \{[\s\S]*min-height: 44px/);
assert.match(css, /input,[\s\S]*select \{[\s\S]*min-height: 44px/);
assert.match(css, /@media \(forced-colors: active\)/);
assert.match(css, /outline: 3px solid Highlight/);
assert.match(css, /\.square\.selected \{[\s\S]*outline-color: Highlight/);

console.log("Kush Kings Chess UI contract passed.");

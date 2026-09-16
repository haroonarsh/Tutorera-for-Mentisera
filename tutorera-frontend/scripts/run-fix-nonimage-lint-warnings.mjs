import fs from "node:fs";

const scriptUrl = new URL("./fix-nonimage-lint-warnings.mjs", import.meta.url);
const scriptPath = scriptUrl.pathname;
let source = fs.readFileSync(scriptPath, "utf8");

const oldHelper = `function removeVariableStatement(file, name) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const node = sf.statements.find((s) => ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name));
  if (!node) throw new Error(\`Variable \${name} not found in \${file}\`);
  write(file, text.slice(0, node.getFullStart()) + text.slice(node.getEnd()));
}`;

const newHelper = `function removeVariableStatement(file, name) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let node;
  const visit = (current) => {
    if (node) return;
    if (ts.isVariableStatement(current) && current.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name)) {
      node = current;
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(sf);
  if (!node) throw new Error(\`Variable \${name} not found in \${file}\`);
  write(file, text.slice(0, node.getFullStart()) + text.slice(node.getEnd()));
}`;

if (!source.includes(oldHelper)) throw new Error("Expected non-recursive helper not found");
source = source.replace(oldHelper, newHelper);
fs.writeFileSync(scriptPath, source);
await import(scriptUrl.href + `?run=${Date.now()}`);

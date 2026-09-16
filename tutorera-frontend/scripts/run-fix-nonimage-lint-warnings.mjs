import fs from "node:fs";

const scriptUrl = new URL("./fix-nonimage-lint-warnings.mjs", import.meta.url);
const scriptPath = scriptUrl.pathname;
let source = fs.readFileSync(scriptPath, "utf8");

const oldFunctionHelper = `function removeFunction(file, name) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const node = sf.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === name);
  if (!node) throw new Error(\`Function \${name} not found in \${file}\`);
  write(file, text.slice(0, node.getFullStart()) + text.slice(node.getEnd()));
}`;

const newFunctionHelper = `function removeFunction(file, name) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let node;
  const visit = (current) => {
    if (node) return;
    if (ts.isFunctionDeclaration(current) && current.name?.text === name) {
      node = current;
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(sf);
  if (!node) throw new Error(\`Function \${name} not found in \${file}\`);
  write(file, text.slice(0, node.getFullStart()) + text.slice(node.getEnd()));
}`;

const oldVariableHelper = `function removeVariableStatement(file, name) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const node = sf.statements.find((s) => ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name));
  if (!node) throw new Error(\`Variable \${name} not found in \${file}\`);
  write(file, text.slice(0, node.getFullStart()) + text.slice(node.getEnd()));
}`;

const newVariableHelper = `function removeVariableStatement(file, name) {
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

if (!source.includes(oldFunctionHelper)) throw new Error("Expected non-recursive function helper not found");
if (!source.includes(oldVariableHelper)) throw new Error("Expected non-recursive variable helper not found");
source = source.replace(oldFunctionHelper, newFunctionHelper).replace(oldVariableHelper, newVariableHelper);
fs.writeFileSync(scriptPath, source);
await import(scriptUrl.href + `?run=${Date.now()}`);

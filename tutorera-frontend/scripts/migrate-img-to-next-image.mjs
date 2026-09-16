import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.join(process.cwd(), "src");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && full.endsWith(".tsx") ? [full] : [];
  });
}

function hasAttr(attributes, name) {
  return attributes.properties.some((prop) => ts.isJsxAttribute(prop) && prop.name.text === name);
}

let changedFiles = 0;
let migratedImages = 0;

for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  let count = 0;

  const visit = (node) => {
    if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName) && node.tagName.text === "img") {
      edits.push({ start: node.tagName.getStart(sf), end: node.tagName.getEnd(), text: "Image" });
      const additions = [];
      if (!hasAttr(node.attributes, "width")) additions.push("width={100}");
      if (!hasAttr(node.attributes, "height")) additions.push("height={100}");
      if (!hasAttr(node.attributes, "unoptimized")) additions.push("unoptimized");
      if (additions.length) {
        edits.push({ start: node.getEnd() - 2, end: node.getEnd() - 2, text: ` ${additions.join(" ")}` });
      }
      count += 1;
    } else if (ts.isJsxElement(node) && ts.isIdentifier(node.openingElement.tagName) && node.openingElement.tagName.text === "img") {
      edits.push({ start: node.openingElement.tagName.getStart(sf), end: node.openingElement.tagName.getEnd(), text: "Image" });
      edits.push({ start: node.closingElement.tagName.getStart(sf), end: node.closingElement.tagName.getEnd(), text: "Image" });
      const additions = [];
      if (!hasAttr(node.openingElement.attributes, "width")) additions.push("width={100}");
      if (!hasAttr(node.openingElement.attributes, "height")) additions.push("height={100}");
      if (!hasAttr(node.openingElement.attributes, "unoptimized")) additions.push("unoptimized");
      if (additions.length) {
        edits.push({ start: node.openingElement.getEnd() - 1, end: node.openingElement.getEnd() - 1, text: ` ${additions.join(" ")}` });
      }
      count += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (!count) continue;

  let text = original;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  }

  if (!/from ["']next\/image["']/.test(text)) {
    const directive = text.match(/^(["']use client["'];\s*\n)/);
    const importLine = 'import Image from "next/image";\n';
    text = directive
      ? text.slice(0, directive[0].length) + importLine + text.slice(directive[0].length)
      : importLine + text;
  }

  // Logical-or avatar sources are rendered only when the surrounding JSX condition
  // guarantees a value, but Next Image's src prop is stricter than a native <img>.
  text = text.replaceAll(
    "src={avatarPreview || user.avatar}",
    "src={(avatarPreview || user.avatar) as string}",
  );

  fs.writeFileSync(file, text);
  changedFiles += 1;
  migratedImages += count;
}

const navbarPath = path.join(root, "components", "Navbar.tsx");
if (fs.existsSync(navbarPath)) {
  const navbar = fs.readFileSync(navbarPath, "utf8").replace(
    "/* eslint-disable @next/next/no-img-element */\n",
    "",
  );
  fs.writeFileSync(navbarPath, navbar);
}

console.log(`Migrated ${migratedImages} <img> elements across ${changedFiles} files to next/image.`);

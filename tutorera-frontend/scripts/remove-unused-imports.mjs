import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const cwd = process.cwd();
const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, "tsconfig.json");
if (!configPath) throw new Error("tsconfig.json not found");

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) {
  throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
}

const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));
const sourceFiles = parsed.fileNames.filter(
  (fileName) => fileName.includes(`${path.sep}src${path.sep}`) && /\.(ts|tsx)$/.test(fileName),
);

const formatOptions = {
  indentSize: 2,
  tabSize: 2,
  convertTabsToSpaces: true,
  newLineCharacter: "\n",
};
const preferences = {
  quotePreference: "double",
  importModuleSpecifierPreference: "non-relative",
};

const versions = new Map(sourceFiles.map((fileName) => [fileName, 0]));
const host = {
  getScriptFileNames: () => sourceFiles,
  getScriptVersion: (fileName) => String(versions.get(fileName) ?? 0),
  getScriptSnapshot: (fileName) => {
    if (!fs.existsSync(fileName)) return undefined;
    return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, "utf8"));
  },
  getCurrentDirectory: () => cwd,
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};

const service = ts.createLanguageService(host, ts.createDocumentRegistry());
let changedFiles = 0;

for (const fileName of sourceFiles) {
  const mode = ts.OrganizeImportsMode?.RemoveUnused;
  const changes = service.organizeImports(
    { type: "file", fileName, skipDestructiveCodeActions: false },
    formatOptions,
    preferences,
    mode,
  );
  if (!changes.length) continue;

  let text = fs.readFileSync(fileName, "utf8");
  const edits = changes
    .flatMap((change) => change.textChanges)
    .sort((a, b) => b.span.start - a.span.start);

  for (const edit of edits) {
    text = `${text.slice(0, edit.span.start)}${edit.newText}${text.slice(edit.span.start + edit.span.length)}`;
  }

  fs.writeFileSync(fileName, text);
  versions.set(fileName, (versions.get(fileName) ?? 0) + 1);
  changedFiles += 1;
}

console.log(`Removed unused imports from ${changedFiles} source files.`);

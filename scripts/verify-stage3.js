#!/usr/bin/env node
/**
 * Build & Unit Test Verification Runner for Cascade Workspace.
 * Works both on Windows/macOS/Linux after `npm install` (via TypeScript compiler API)
 * and in offline Linux build environments (via Babel fallback).
 * Verifies TypeScript/TSX compilation and import resolution across all modules and runs:
 * - tests/sqlite-service.test.ts
 * - tests/deck-schema.test.ts
 * - tests/fs-service.test.ts
 * - tests/deck-keyboard-shapes.test.ts
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

process.env.NODE_PATH = [
  process.env.NODE_PATH,
  '/usr/share/nodejs',
  '/usr/lib/nodejs'
]
  .filter(Boolean)
  .join(path.delimiter);
Module._initPaths();

let ts = null;
try {
  ts = require('typescript');
} catch {
  ts = null;
}

let babel = null;
if (!ts) {
  babel = require('@babel/core');
}

function transpileSource(content, filename) {
  const isTsx = filename.endsWith('.tsx');
  if (ts) {
    const result = ts.transpileModule(content, {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: isTsx ? ts.JsxEmit.React : ts.JsxEmit.Preserve,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true
      },
      reportDiagnostics: true
    });
    if (result.diagnostics && result.diagnostics.length > 0) {
      const errors = result.diagnostics.filter(
        (d) => d.category === ts.DiagnosticCategory.Error
      );
      if (errors.length > 0) {
        const msg = errors
          .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
          .join('\n');
        throw new Error(`TypeScript syntax error in ${filename}:\n${msg}`);
      }
    }
    return result.outputText;
  }

  const compiled = babel.transformSync(content, {
    filename,
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
      ...(isTsx ? ['@babel/preset-react'] : []),
      ['@babel/preset-typescript', { isTSX: isTsx, allExtensions: true }]
    ]
  });
  return compiled.code;
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'react') {
    const reactMock = {
      useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
      useEffect: () => {},
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useRef: (v) => ({ current: v }),
      memo: (c) => c,
      createContext: (v) => ({ Provider: () => null, _currentValue: v }),
      useContext: () => ({}),
      createElement: () => null,
      StrictMode: 'StrictMode'
    };
    reactMock.default = reactMock;
    return reactMock;
  }
  return origLoad(request, parent, isMain);
};

require.extensions['.ts'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiledCode = transpileSource(content, filename);
  module._compile(compiledCode, filename);
};

require.extensions['.tsx'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiledCode = transpileSource(content, filename);
  module._compile(compiledCode, filename);
};

async function verifyStage3() {
  const rootDir = path.resolve(__dirname, '..');

  const explicitPaths = [
    'src/renderer/src/features/deck/shape-catalog.ts',
    'src/renderer/src/features/deck/deck-commands.ts',
    'src/renderer/src/features/deck/ShapeLibraryPopover.tsx',
    'src/renderer/src/features/deck/ElementInspectorBar.tsx',
    'tests/deck-keyboard-shapes.test.ts'
  ].map((rel) => path.join(rootDir, rel));

  for (const p of explicitPaths) {
    if (fs.existsSync(p)) {
      fs.statSync(p);
    }
  }

  const walk = (dir) => {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results = results.concat(walk(full));
      else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
    }
    return results;
  };

  const allFilesSet = new Set([
    ...walk(path.join(rootDir, 'src')),
    ...walk(path.join(rootDir, 'tests')),
    ...explicitPaths.filter((p) => fs.existsSync(p))
  ]);
  const allFiles = Array.from(allFilesSet);

  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  for (const file of allFiles) {
    const code = fs.readFileSync(file, 'utf8');
    transpileSource(code, file);

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const relImport = match[1];
      if (relImport.endsWith('.css')) continue;
      const baseCandidate = path.resolve(path.dirname(file), relImport);
      const exists = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'].some((ext) =>
        fs.existsSync(baseCandidate + ext) && fs.statSync(baseCandidate + ext).isFile()
      );
      if (!exists) {
        throw new Error(
          `Unresolved relative import '${relImport}' in ${path.relative(rootDir, file)}`
        );
      }
    }
  }
  console.log(
    `✓ TypeScript & JSX compilation and module resolution verified across ${allFiles.length} modules (${ts ? 'typescript' : 'babel'} engine).`
  );

  const { runSqliteServiceTests } = require(path.join(
    rootDir,
    'tests/sqlite-service.test.ts'
  ));
  await runSqliteServiceTests();

  const { runDeckSchemaTests } = require(path.join(rootDir, 'tests/deck-schema.test.ts'));
  await runDeckSchemaTests();

  const { runFsServiceTests } = require(path.join(rootDir, 'tests/fs-service.test.ts'));
  await runFsServiceTests();

  const { runDeckKeyboardAndShapeTests } = require(path.join(
    rootDir,
    'tests/deck-keyboard-shapes.test.ts'
  ));
  await runDeckKeyboardAndShapeTests();

  console.log('✓ All Cascade Workspace verification checks passed.');
}

verifyStage3().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

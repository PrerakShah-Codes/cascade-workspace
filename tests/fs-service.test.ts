import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FsService } from '../src/main/services/fs-service';

export async function runFsServiceTests(): Promise<void> {
  const tmpWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'cascade-fs-test-'));
  const externalTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cascade-ext-asset-'));
  const fsService = new FsService(tmpWorkspace);

  try {
    // 1. Ensure workspace structure creates `<workspace>/assets/`
    await fsService.ensureWorkspaceStructure();
    assert.strictEqual(fs.existsSync(path.join(tmpWorkspace, 'assets')), true);

    // 2. Create .md, .deck, and .db files and verify tree
    await fsService.createFile('notes/system-design.md', '# System Design\n\nLocal-first architecture with KaTeX $f(x)$');
    await fsService.createFile('decks/kickoff.deck');
    await fsService.createFile('data/metrics.db');

    const tree = await fsService.getWorkspaceTree('');
    assert.strictEqual(tree.some((n) => n.name === 'notes' && n.isDirectory), true);
    assert.strictEqual(tree.some((n) => n.name === 'assets' && n.isDirectory), true);

    // 3. Copy external media into `<workspace>/assets/` and verify relative path
    const sampleSvgPath = path.join(externalTempDir, 'oscillator-diagram.svg');
    fs.writeFileSync(
      sampleSvgPath,
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>',
      'utf-8'
    );
    const copiedAsset = await fsService.copyMediaToAssets(sampleSvgPath);
    assert.strictEqual(copiedAsset.relativePath, 'assets/oscillator-diagram.svg');
    assert.strictEqual(fs.existsSync(copiedAsset.absolutePath), true);

    // 4. Search workspace files for content
    const searchHits = await fsService.searchWorkspaceFiles('KaTeX');
    assert.strictEqual(searchHits.length, 1);
    assert.strictEqual(searchHits[0].relativePath, 'notes/system-design.md');

    // 5. Security boundary check: reject path traversal outside workspace
    assert.throws(
      () => fsService.resolveSafePath('../../etc/passwd'),
      /Security Violation/
    );

    console.log('✓ PASS: tests/fs-service.test.ts (all 5 assertions verified)');
  } finally {
    fs.rmSync(tmpWorkspace, { recursive: true, force: true });
    fs.rmSync(externalTempDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  runFsServiceTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

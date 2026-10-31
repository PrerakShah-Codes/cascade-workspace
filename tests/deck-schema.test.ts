import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FsService } from '../src/main/services/fs-service';
import { PdfService } from '../src/main/services/pdf-service';
import { DeckDocument } from '../src/shared/types';
import { evaluateMathExpression } from '../src/renderer/src/components/common/MathGraphWidget';

export async function runDeckSchemaTests(): Promise<void> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cascade-deck-test-'));
  const fsService = new FsService(tmpDir);
  const pdfService = new PdfService(tmpDir);

  try {
    // 1. Create a native .deck presentation file and verify schema
    await fsService.createFile('presentations/architecture.deck');
    const rawJson = await fsService.readFile('presentations/architecture.deck');
    const deck: DeckDocument = JSON.parse(rawJson);

    assert.strictEqual(deck.schemaVersion, '1.0');
    assert.strictEqual(deck.theme.aspectRatio, '16:9');
    assert.strictEqual(deck.theme.defaultBackground, '#1E1E1E');
    assert.strictEqual(deck.theme.accentColor, '#7E42C1');
    assert.strictEqual(Array.isArray(deck.slides), true);
    assert.strictEqual(deck.slides.length, 1);

    // 2. Append slide elements (image in assets/, latex, mermaid, mathgraph)
    deck.slides[0].elements.push(
      {
        id: 'el-asset-img',
        type: 'image',
        x: 100,
        y: 200,
        width: 320,
        height: 180,
        zIndex: 3,
        content: 'assets/architecture-diagram.svg'
      },
      {
        id: 'el-math-graph',
        type: 'mathgraph',
        x: 450,
        y: 200,
        width: 400,
        height: 240,
        zIndex: 4,
        content: JSON.stringify({
          title: 'Harmonic Plot',
          xMin: -5,
          xMax: 5,
          yMin: -2,
          yMax: 2,
          showGrid: true,
          functions: [{ id: 'f1', expression: 'sin(x)', color: '#7E42C1' }]
        })
      }
    );

    await fsService.writeFile(
      'presentations/architecture.deck',
      JSON.stringify(deck, null, 2)
    );
    const reloaded: DeckDocument = JSON.parse(
      await fsService.readFile('presentations/architecture.deck')
    );
    assert.strictEqual(reloaded.slides[0].elements.length, 4);
    assert.strictEqual(
      reloaded.slides[0].elements.some(
        (el) => el.type === 'image' && el.content.startsWith('assets/')
      ),
      true
    );

    // 3. Verify mathematical function evaluator f(x)
    const yZero = evaluateMathExpression('x^2 - 4', 2);
    assert.strictEqual(Math.abs(yZero) < 1e-9, true);
    const yTrig = evaluateMathExpression('sin(0) + cos(0)', 0);
    assert.strictEqual(Math.abs(yTrig - 1) < 1e-9, true);

    // 4. Verify PDF print HTML builder for deck (dark & print-light modes)
    const darkDeckHtml = pdfService.buildPrintHtml({
      kind: 'deck',
      title: deck.title,
      deckTitle: deck.title,
      aspectRatio: '16:9',
      scope: 'all',
      themeMode: 'dark',
      pageSize: 'A4',
      slidesHtml: ['<div>Slide 1 Content</div>'],
      includeSpeakerNotes: true
    });
    assert.strictEqual(darkDeckHtml.includes('#1E1E1E'), true);
    assert.strictEqual(darkDeckHtml.includes('Slide 1 of 1'), true);

    console.log('✓ PASS: tests/deck-schema.test.ts (all 5 assertions verified)');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  runDeckSchemaTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

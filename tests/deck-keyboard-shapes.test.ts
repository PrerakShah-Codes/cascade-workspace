import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DeckDocument, DeckSlide, ShapeKind, SlideElement } from '../src/shared/types';
import { FsService } from '../src/main/services/fs-service';
import {
  SHAPE_CATALOG,
  createShapeSlideElement,
  getShapeCatalogItem
} from '../src/renderer/src/features/deck/shape-catalog';
import {
  alignSelectedElements,
  copySelectedElements,
  createDeckHistory,
  deleteSelectedElements,
  distributeSelectedElements,
  duplicateSelectedElements,
  groupSelectedElements,
  isEditableInputFocused,
  nudgeSelectedElements,
  pasteClipboardElements,
  pushDeckHistory,
  redoDeckHistory,
  reorderElementLayers,
  resolveDeckKeyboardCommand,
  undoDeckHistory,
  ungroupSelectedElements
} from '../src/renderer/src/features/deck/deck-commands';

export async function runDeckKeyboardAndShapeTests(): Promise<void> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cascade-deck-kb-test-'));
  const fsService = new FsService(tmpDir);

  try {
    assert.strictEqual(isEditableInputFocused({ tagName: 'INPUT' }, null), true);
    assert.strictEqual(isEditableInputFocused({ tagName: 'TEXTAREA' }, null), true);
    assert.strictEqual(
      isEditableInputFocused({ tagName: 'DIV', isContentEditable: true }, null),
      true
    );
    assert.strictEqual(isEditableInputFocused({ tagName: 'DIV' }, 'el-shape-1'), true);
    assert.strictEqual(isEditableInputFocused({ tagName: 'DIV' }, null), false);

    assert.strictEqual(
      resolveDeckKeyboardCommand({ key: 'Delete', target: { tagName: 'INPUT' } }).type,
      'none'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({
        key: 'Backspace',
        target: { tagName: 'DIV' },
        inlineEditingElementId: 'el-1'
      }).type,
      'none'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({
        key: 'Delete',
        target: { tagName: 'DIV' },
        inlineEditingElementId: null
      }).type,
      'delete'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({
        key: 'Backspace',
        target: { tagName: 'DIV' },
        inlineEditingElementId: null
      }).type,
      'delete'
    );

    assert.strictEqual(
      resolveDeckKeyboardCommand({ key: 'z', ctrlKey: true, target: { tagName: 'DIV' } }).type,
      'undo'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        target: { tagName: 'DIV' }
      }).type,
      'redo'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({ key: 'y', ctrlKey: true, target: { tagName: 'DIV' } }).type,
      'redo'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({ key: 'c', ctrlKey: true, target: { tagName: 'DIV' } }).type,
      'copy'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({ key: 'v', ctrlKey: true, target: { tagName: 'DIV' } }).type,
      'paste'
    );
    assert.strictEqual(
      resolveDeckKeyboardCommand({ key: 'd', ctrlKey: true, target: { tagName: 'DIV' } }).type,
      'duplicate'
    );
    const nudgeShift = resolveDeckKeyboardCommand({
      key: 'ArrowRight',
      shiftKey: true,
      target: { tagName: 'DIV' }
    });
    assert.deepStrictEqual(nudgeShift, { type: 'nudge', dx: 10, dy: 0 });

    const requiredKinds: ShapeKind[] = [
      'rectangle',
      'rounded',
      'circle',
      'ellipse',
      'triangle',
      'diamond',
      'pentagon',
      'hexagon',
      'parallelogram',
      'star',
      'line',
      'arrow-right',
      'arrow-left',
      'arrow-both',
      'connector-elbow',
      'callout',
      'banner',
      'badge',
      'quote-box',
      'flow-process',
      'flow-decision',
      'flow-data',
      'flow-database',
      'flow-document',
      'flow-terminator'
    ];

    assert.strictEqual(SHAPE_CATALOG.length >= 25, true);
    for (const k of requiredKinds) {
      const item = getShapeCatalogItem(k);
      assert.strictEqual(item.kind, k);
    }

    const slide: DeckSlide = {
      id: 'slide-test-1',
      title: 'Shape & Keyboard Test Slide',
      layout: 'blank',
      background: '#1E1E1E',
      borderAccentColor: '#4A2574',
      transition: { type: 'fade', durationMs: 400 },
      speakerNotes: 'Test notes',
      elements: [
        createShapeSlideElement('flow-process', 1, 0),
        createShapeSlideElement('arrow-right', 2, 1),
        createShapeSlideElement('flow-database', 3, 2)
      ]
    };

    const [el1, el2, el3] = slide.elements;

    const afterDelete = deleteSelectedElements(slide, [el2.id]);
    assert.strictEqual(afterDelete.deletedCount, 1);
    assert.strictEqual(afterDelete.slide.elements.length, 2);

    const clipboard = copySelectedElements(slide, [el1.id]);
    const pasted = pasteClipboardElements(slide, clipboard, 30);
    assert.strictEqual(pasted.slide.elements.length, 4);

    const duped = duplicateSelectedElements(slide, [el3.id], 20);
    assert.strictEqual(duped.slide.elements.length, 4);

    const nudged = nudgeSelectedElements(slide, [el1.id], 15, -10);
    assert.strictEqual(nudged.elements.find((e: SlideElement) => e.id === el1.id)!.x, el1.x + 15);

    const alignedLeft = alignSelectedElements(slide, [el1.id, el2.id, el3.id], 'left');
    const xs = alignedLeft.elements.map((e: SlideElement) => e.x);
    assert.strictEqual(xs[0], xs[1]);

    const distributed = distributeSelectedElements(
      slide,
      [el1.id, el2.id, el3.id],
      'horizontal'
    );
    assert.strictEqual(distributed.elements.length, 3);

    const grouped = groupSelectedElements(slide, [el1.id, el3.id]);
    assert.strictEqual(Boolean(grouped.groupId), true);
    const groupDeleted = deleteSelectedElements(grouped.slide, [el1.id]);
    assert.strictEqual(groupDeleted.deletedCount, 2);

    const ungrouped = ungroupSelectedElements(grouped.slide, [el1.id]);
    assert.strictEqual(
      ungrouped.elements.every((e: SlideElement) => e.groupId === undefined),
      true
    );

    const broughtToFront = reorderElementLayers(slide, [el1.id], 'front');
    assert.strictEqual(broughtToFront.elements.find((e: SlideElement) => e.id === el1.id)!.zIndex, 3);

    const initialDeck: DeckDocument = {
      schemaVersion: '1.0',
      title: 'Undo Redo Persistence Deck',
      author: 'Test Runner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        aspectRatio: '16:9',
        defaultBackground: '#1E1E1E',
        accentColor: '#7E42C1',
        headingFont: 'Inter',
        bodyFont: 'Inter'
      },
      slides: [slide]
    };

    let history = createDeckHistory(initialDeck);
    history = pushDeckHistory(history, { ...initialDeck, slides: [afterDelete.slide] });
    assert.strictEqual(history.present.slides[0].elements.length, 2);
    history = undoDeckHistory(history);
    assert.strictEqual(history.present.slides[0].elements.length, 3);
    history = redoDeckHistory(history);
    assert.strictEqual(history.present.slides[0].elements.length, 2);

    await fsService.createFile('presentations/shapes-test.deck');
    await fsService.writeFile(
      'presentations/shapes-test.deck',
      JSON.stringify(initialDeck, null, 2)
    );
    const reloadedDeck: DeckDocument = JSON.parse(
      await fsService.readFile('presentations/shapes-test.deck')
    );
    assert.strictEqual(reloadedDeck.slides[0].elements.length, 3);
    assert.strictEqual(
      reloadedDeck.slides[0].elements[0].style?.shapeKind,
      'flow-process'
    );

    console.log(
      '✓ PASS: tests/deck-keyboard-shapes.test.ts (all 24 keyboard, focus-guard, shape catalog & undo/redo assertions verified)'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  runDeckKeyboardAndShapeTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

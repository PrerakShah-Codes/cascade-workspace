import { DeckDocument, DeckSlide, SlideElement } from '../../../../shared/types';

export interface EditableTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  contentEditable?: string;
  getAttribute?: (attr: string) => string | null;
}

export function isEditableInputFocused(
  target: EditableTargetLike | null | undefined,
  inlineEditingElementId?: string | null
): boolean {
  if (inlineEditingElementId) {
    return true;
  }
  if (!target) {
    return false;
  }
  const tag = (target.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  if (target.isContentEditable || target.contentEditable === 'true') {
    return true;
  }
  if (typeof target.getAttribute === 'function') {
    const role = target.getAttribute('role');
    if (role === 'textbox' || role === 'searchbox') {
      return true;
    }
    if (target.getAttribute('contenteditable') === 'true') {
      return true;
    }
  }
  return false;
}

export interface DeckHistoryState {
  past: DeckDocument[];
  present: DeckDocument;
  future: DeckDocument[];
}

const MAX_HISTORY_DEPTH = 50;

export function cloneDeck(deck: DeckDocument): DeckDocument {
  return JSON.parse(JSON.stringify(deck));
}

export function createDeckHistory(initial: DeckDocument): DeckHistoryState {
  return {
    past: [],
    present: cloneDeck(initial),
    future: []
  };
}

export function pushDeckHistory(
  history: DeckHistoryState,
  nextDeck: DeckDocument
): DeckHistoryState {
  const nextPast = [...history.past, cloneDeck(history.present)];
  if (nextPast.length > MAX_HISTORY_DEPTH) {
    nextPast.shift();
  }
  return {
    past: nextPast,
    present: cloneDeck(nextDeck),
    future: []
  };
}

export function undoDeckHistory(history: DeckHistoryState): DeckHistoryState {
  if (history.past.length === 0) {
    return history;
  }
  const previous = history.past[history.past.length - 1];
  const nextPast = history.past.slice(0, -1);
  return {
    past: nextPast,
    present: cloneDeck(previous),
    future: [cloneDeck(history.present), ...history.future]
  };
}

export function redoDeckHistory(history: DeckHistoryState): DeckHistoryState {
  if (history.future.length === 0) {
    return history;
  }
  const next = history.future[0];
  const nextFuture = history.future.slice(1);
  return {
    past: [...history.past, cloneDeck(history.present)],
    present: cloneDeck(next),
    future: nextFuture
  };
}

export function expandSelectionWithGroups(
  slide: DeckSlide,
  selectedIds: string[]
): string[] {
  const idSet = new Set(selectedIds);
  const groupIds = new Set<string>();

  for (const el of slide.elements) {
    if (idSet.has(el.id) && el.groupId) {
      groupIds.add(el.groupId);
    }
  }

  if (groupIds.size === 0) {
    return Array.from(idSet);
  }

  for (const el of slide.elements) {
    if (el.groupId && groupIds.has(el.groupId)) {
      idSet.add(el.id);
    }
  }
  return Array.from(idSet);
}

export function deleteSelectedElements(
  slide: DeckSlide,
  selectedIds: string[]
): { slide: DeckSlide; deletedCount: number } {
  if (selectedIds.length === 0) {
    return { slide, deletedCount: 0 };
  }
  const expanded = new Set(expandSelectionWithGroups(slide, selectedIds));
  const remaining = slide.elements.filter(
    (el) => !expanded.has(el.id) || el.locked
  );
  const deletedCount = slide.elements.length - remaining.length;
  return {
    slide: {
      ...slide,
      elements: normalizeZIndices(remaining)
    },
    deletedCount
  };
}

export function copySelectedElements(
  slide: DeckSlide,
  selectedIds: string[]
): SlideElement[] {
  const expanded = new Set(expandSelectionWithGroups(slide, selectedIds));
  return slide.elements
    .filter((el) => expanded.has(el.id))
    .map((el) => JSON.parse(JSON.stringify(el)));
}

export function pasteClipboardElements(
  slide: DeckSlide,
  clipboard: SlideElement[],
  offsetPx = 24
): { slide: DeckSlide; newElementIds: string[] } {
  if (clipboard.length === 0) {
    return { slide, newElementIds: [] };
  }
  const maxZ = slide.elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
  const groupRemap = new Map<string, string>();
  const now = Date.now();

  const newElements: SlideElement[] = clipboard.map((src, idx) => {
    let nextGroupId = src.groupId;
    if (src.groupId) {
      if (!groupRemap.has(src.groupId)) {
        groupRemap.set(
          src.groupId,
          `grp-${now}-${Math.random().toString(36).slice(2, 6)}`
        );
      }
      nextGroupId = groupRemap.get(src.groupId);
    }

    return {
      ...JSON.parse(JSON.stringify(src)),
      id: `el-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      x: Math.min(900 - src.width, Math.max(10, src.x + offsetPx)),
      y: Math.min(500 - src.height, Math.max(10, src.y + offsetPx)),
      zIndex: maxZ + idx + 1,
      groupId: nextGroupId,
      locked: false
    };
  });

  return {
    slide: {
      ...slide,
      elements: normalizeZIndices([...slide.elements, ...newElements])
    },
    newElementIds: newElements.map((e) => e.id)
  };
}

export function duplicateSelectedElements(
  slide: DeckSlide,
  selectedIds: string[],
  offsetPx = 24
): { slide: DeckSlide; newElementIds: string[] } {
  const copied = copySelectedElements(slide, selectedIds);
  return pasteClipboardElements(slide, copied, offsetPx);
}

export function nudgeSelectedElements(
  slide: DeckSlide,
  selectedIds: string[],
  dx: number,
  dy: number,
  stageWidth = 960,
  stageHeight = 540
): DeckSlide {
  if (selectedIds.length === 0) return slide;
  const expanded = new Set(expandSelectionWithGroups(slide, selectedIds));
  return {
    ...slide,
    elements: slide.elements.map((el) => {
      if (!expanded.has(el.id) || el.locked) return el;
      const maxX = Math.max(20, stageWidth - el.width);
      const maxY = Math.max(20, stageHeight - el.height);
      return {
        ...el,
        x: Math.max(0, Math.min(maxX, Math.round(el.x + dx))),
        y: Math.max(0, Math.min(maxY, Math.round(el.y + dy)))
      };
    })
  };
}

export function normalizeZIndices(elements: SlideElement[]): SlideElement[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const rankMap = new Map<string, number>();
  sorted.forEach((el, idx) => rankMap.set(el.id, idx + 1));
  return elements.map((el) => ({
    ...el,
    zIndex: rankMap.get(el.id) ?? el.zIndex
  }));
}

export function reorderElementLayers(
  slide: DeckSlide,
  selectedIds: string[],
  action: 'front' | 'back' | 'forward' | 'backward'
): DeckSlide {
  if (selectedIds.length === 0) return slide;
  const targetSet = new Set(expandSelectionWithGroups(slide, selectedIds));
  const sorted = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);

  if (action === 'front') {
    const unselected = sorted.filter((e) => !targetSet.has(e.id));
    const selected = sorted.filter((e) => targetSet.has(e.id));
    const combined = [...unselected, ...selected];
    const zMap = new Map(combined.map((e, i) => [e.id, i + 1]));
    return {
      ...slide,
      elements: slide.elements.map((e) => ({ ...e, zIndex: zMap.get(e.id) || e.zIndex }))
    };
  }

  if (action === 'back') {
    const selected = sorted.filter((e) => targetSet.has(e.id));
    const unselected = sorted.filter((e) => !targetSet.has(e.id));
    const combined = [...selected, ...unselected];
    const zMap = new Map(combined.map((e, i) => [e.id, i + 1]));
    return {
      ...slide,
      elements: slide.elements.map((e) => ({ ...e, zIndex: zMap.get(e.id) || e.zIndex }))
    };
  }

  if (action === 'forward') {
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (targetSet.has(sorted[i].id) && !targetSet.has(sorted[i + 1].id)) {
        const tmp = sorted[i];
        sorted[i] = sorted[i + 1];
        sorted[i + 1] = tmp;
      }
    }
  } else if (action === 'backward') {
    for (let i = 1; i < sorted.length; i++) {
      if (targetSet.has(sorted[i].id) && !targetSet.has(sorted[i - 1].id)) {
        const tmp = sorted[i];
        sorted[i] = sorted[i - 1];
        sorted[i - 1] = tmp;
      }
    }
  }

  const zMap = new Map(sorted.map((e, i) => [e.id, i + 1]));
  return {
    ...slide,
    elements: slide.elements.map((e) => ({ ...e, zIndex: zMap.get(e.id) || e.zIndex }))
  };
}

export type ElementAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export function alignSelectedElements(
  slide: DeckSlide,
  selectedIds: string[],
  alignment: ElementAlignment,
  stageWidth = 960,
  stageHeight = 540
): DeckSlide {
  if (selectedIds.length === 0) return slide;
  const targetSet = new Set(selectedIds);
  const selected = slide.elements.filter((e) => targetSet.has(e.id));
  if (selected.length === 0) return slide;

  const minX =
    selected.length === 1 ? 40 : Math.min(...selected.map((e) => e.x));
  const maxX =
    selected.length === 1
      ? stageWidth - 40
      : Math.max(...selected.map((e) => e.x + e.width));
  const minY =
    selected.length === 1 ? 35 : Math.min(...selected.map((e) => e.y));
  const maxY =
    selected.length === 1
      ? stageHeight - 35
      : Math.max(...selected.map((e) => e.y + e.height));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    ...slide,
    elements: slide.elements.map((el) => {
      if (!targetSet.has(el.id) || el.locked) return el;
      switch (alignment) {
        case 'left':
          return { ...el, x: Math.round(minX) };
        case 'center':
          return { ...el, x: Math.round(centerX - el.width / 2) };
        case 'right':
          return { ...el, x: Math.round(maxX - el.width) };
        case 'top':
          return { ...el, y: Math.round(minY) };
        case 'middle':
          return { ...el, y: Math.round(centerY - el.height / 2) };
        case 'bottom':
          return { ...el, y: Math.round(maxY - el.height) };
        default:
          return el;
      }
    })
  };
}

export function distributeSelectedElements(
  slide: DeckSlide,
  selectedIds: string[],
  axis: 'horizontal' | 'vertical'
): DeckSlide {
  if (selectedIds.length < 3) return slide;
  const targetSet = new Set(selectedIds);
  const selected = slide.elements.filter((e) => targetSet.has(e.id) && !e.locked);
  if (selected.length < 3) return slide;

  if (axis === 'horizontal') {
    const sorted = [...selected].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = last.x - first.x;
    const step = span / (sorted.length - 1);
    const posMap = new Map<string, number>();
    sorted.forEach((el, idx) => posMap.set(el.id, Math.round(first.x + idx * step)));
    return {
      ...slide,
      elements: slide.elements.map((el) =>
        posMap.has(el.id) ? { ...el, x: posMap.get(el.id)! } : el
      )
    };
  } else {
    const sorted = [...selected].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = last.y - first.y;
    const step = span / (sorted.length - 1);
    const posMap = new Map<string, number>();
    sorted.forEach((el, idx) => posMap.set(el.id, Math.round(first.y + idx * step)));
    return {
      ...slide,
      elements: slide.elements.map((el) =>
        posMap.has(el.id) ? { ...el, y: posMap.get(el.id)! } : el
      )
    };
  }
}

export function groupSelectedElements(
  slide: DeckSlide,
  selectedIds: string[]
): { slide: DeckSlide; groupId: string | null } {
  if (selectedIds.length < 2) {
    return { slide, groupId: null };
  }
  const targetSet = new Set(selectedIds);
  const newGroupId = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    slide: {
      ...slide,
      elements: slide.elements.map((el) =>
        targetSet.has(el.id) ? { ...el, groupId: newGroupId } : el
      )
    },
    groupId: newGroupId
  };
}

export function ungroupSelectedElements(
  slide: DeckSlide,
  selectedIds: string[]
): DeckSlide {
  if (selectedIds.length === 0) return slide;
  const expanded = new Set(expandSelectionWithGroups(slide, selectedIds));
  return {
    ...slide,
    elements: slide.elements.map((el) =>
      expanded.has(el.id) ? { ...el, groupId: undefined } : el
    )
  };
}

export interface DeckKeyboardShortcutInput {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  target?: EditableTargetLike | null;
  inlineEditingElementId?: string | null;
}

export type DeckShortcutCommand =
  | { type: 'none' }
  | { type: 'delete' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'copy' }
  | { type: 'paste' }
  | { type: 'duplicate' }
  | { type: 'select-all' }
  | { type: 'deselect' }
  | { type: 'group' }
  | { type: 'ungroup' }
  | { type: 'nudge'; dx: number; dy: number };

export function resolveDeckKeyboardCommand(
  event: DeckKeyboardShortcutInput
): DeckShortcutCommand {
  if (isEditableInputFocused(event.target, event.inlineEditingElementId)) {
    return { type: 'none' };
  }

  const mod = Boolean(event.ctrlKey || event.metaKey);
  const key = event.key;
  const lower = key.toLowerCase();

  if (!mod && (key === 'Delete' || key === 'Backspace')) {
    return { type: 'delete' };
  }

  if (!mod && key === 'Escape') {
    return { type: 'deselect' };
  }

  if (mod && lower === 'z') {
    return event.shiftKey ? { type: 'redo' } : { type: 'undo' };
  }

  if (mod && lower === 'y') {
    return { type: 'redo' };
  }

  if (mod && lower === 'c') {
    return { type: 'copy' };
  }

  if (mod && lower === 'v') {
    return { type: 'paste' };
  }

  if (mod && lower === 'd') {
    return { type: 'duplicate' };
  }

  if (mod && lower === 'a') {
    return { type: 'select-all' };
  }

  if (mod && lower === 'g') {
    return event.shiftKey ? { type: 'ungroup' } : { type: 'group' };
  }

  const step = event.shiftKey ? 10 : 2;
  if (!mod && key === 'ArrowLeft') {
    return { type: 'nudge', dx: -step, dy: 0 };
  }
  if (!mod && key === 'ArrowRight') {
    return { type: 'nudge', dx: step, dy: 0 };
  }
  if (!mod && key === 'ArrowUp') {
    return { type: 'nudge', dx: 0, dy: -step };
  }
  if (!mod && key === 'ArrowDown') {
    return { type: 'nudge', dx: 0, dy: step };
  }

  return { type: 'none' };
}

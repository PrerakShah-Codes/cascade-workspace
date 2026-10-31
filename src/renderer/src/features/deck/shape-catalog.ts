import { ShapeCategory, ShapeKind, SlideElement, SlideElementStyle } from '../../../../shared/types';

export interface ShapeCatalogItem {
  kind: ShapeKind;
  label: string;
  category: ShapeCategory;
  defaultWidth: number;
  defaultHeight: number;
  defaultLabel: string;
  defaultStyle: SlideElementStyle;
  description: string;
}

export const SHAPE_CATEGORY_LABELS: Record<ShapeCategory, string> = {
  geometric: 'Geometric Shapes',
  arrows: 'Lines, Arrows & Connectors',
  callouts: 'Callouts, Badges & Banners',
  flowchart: 'Flowchart Symbols'
};

export const SHAPE_CATALOG: ShapeCatalogItem[] = [
  {
    kind: 'rectangle',
    label: 'Rectangle',
    category: 'geometric',
    defaultWidth: 260,
    defaultHeight: 110,
    defaultLabel: 'Rectangle Block',
    description: 'Sharp-cornered rectangular container',
    defaultStyle: {
      shapeKind: 'rectangle',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      borderRadius: 0,
      color: '#E6E6E6',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'rounded',
    label: 'Rounded Box',
    category: 'geometric',
    defaultWidth: 280,
    defaultHeight: 110,
    defaultLabel: 'Rounded Card',
    description: 'Rounded rectangle for milestones and cards',
    defaultStyle: {
      shapeKind: 'rounded',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      borderRadius: 16,
      color: '#E6E6E6',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'circle',
    label: 'Circle',
    category: 'geometric',
    defaultWidth: 150,
    defaultHeight: 150,
    defaultLabel: 'Node',
    description: '1:1 circular node or state badge',
    defaultStyle: {
      shapeKind: 'circle',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center'
    }
  },
  {
    kind: 'ellipse',
    label: 'Ellipse / Oval',
    category: 'geometric',
    defaultWidth: 260,
    defaultHeight: 120,
    defaultLabel: 'Ellipse',
    description: 'Wide elliptical shape for sets or domains',
    defaultStyle: {
      shapeKind: 'ellipse',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'triangle',
    label: 'Triangle',
    category: 'geometric',
    defaultWidth: 200,
    defaultHeight: 160,
    defaultLabel: 'Hierarchy',
    description: 'Isosceles upward triangle',
    defaultStyle: {
      shapeKind: 'triangle',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'right-triangle',
    label: 'Right Triangle',
    category: 'geometric',
    defaultWidth: 200,
    defaultHeight: 150,
    defaultLabel: 'Slope',
    description: 'Right-angled geometric triangle',
    defaultStyle: {
      shapeKind: 'right-triangle',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'diamond',
    label: 'Diamond',
    category: 'geometric',
    defaultWidth: 220,
    defaultHeight: 150,
    defaultLabel: 'Gateway',
    description: 'Rhombus / diamond shape',
    defaultStyle: {
      shapeKind: 'diamond',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'pentagon',
    label: 'Pentagon',
    category: 'geometric',
    defaultWidth: 180,
    defaultHeight: 165,
    defaultLabel: '5-Stage',
    description: 'Five-sided regular polygon',
    defaultStyle: {
      shapeKind: 'pentagon',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'hexagon',
    label: 'Hexagon',
    category: 'geometric',
    defaultWidth: 230,
    defaultHeight: 140,
    defaultLabel: 'Microservice',
    description: 'Six-sided architectural module',
    defaultStyle: {
      shapeKind: 'hexagon',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'octagon',
    label: 'Octagon',
    category: 'geometric',
    defaultWidth: 180,
    defaultHeight: 165,
    defaultLabel: 'Guard',
    description: 'Eight-sided polygon',
    defaultStyle: {
      shapeKind: 'octagon',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'parallelogram',
    label: 'Parallelogram',
    category: 'geometric',
    defaultWidth: 260,
    defaultHeight: 110,
    defaultLabel: 'Pipeline Stage',
    description: 'Slanted parallelogram block',
    defaultStyle: {
      shapeKind: 'parallelogram',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'star',
    label: '5-Point Star',
    category: 'geometric',
    defaultWidth: 170,
    defaultHeight: 165,
    defaultLabel: 'North Star',
    description: 'Five-pointed highlight star',
    defaultStyle: {
      shapeKind: 'star',
      backgroundColor: '#4A2574',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'center'
    }
  },
  {
    kind: 'line',
    label: 'Horizontal Line',
    category: 'arrows',
    defaultWidth: 360,
    defaultHeight: 40,
    defaultLabel: '',
    description: 'Clean divider or connector rule',
    defaultStyle: {
      shapeKind: 'line',
      backgroundColor: 'transparent',
      borderColor: '#7E42C1',
      borderWidth: 3,
      color: '#E6E6E6',
      fontSize: 14,
      textAlign: 'center'
    }
  },
  {
    kind: 'arrow-right',
    label: 'Right Arrow →',
    category: 'arrows',
    defaultWidth: 280,
    defaultHeight: 85,
    defaultLabel: 'Next Phase',
    description: 'Block directional arrow pointing right',
    defaultStyle: {
      shapeKind: 'arrow-right',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'arrow-left',
    label: 'Left Arrow ←',
    category: 'arrows',
    defaultWidth: 280,
    defaultHeight: 85,
    defaultLabel: 'Rollback',
    description: 'Block directional arrow pointing left',
    defaultStyle: {
      shapeKind: 'arrow-left',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'arrow-up',
    label: 'Up Arrow ↑',
    category: 'arrows',
    defaultWidth: 140,
    defaultHeight: 180,
    defaultLabel: 'Scale Up',
    description: 'Vertical arrow pointing up',
    defaultStyle: {
      shapeKind: 'arrow-up',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'arrow-down',
    label: 'Down Arrow ↓',
    category: 'arrows',
    defaultWidth: 140,
    defaultHeight: 180,
    defaultLabel: 'Sink',
    description: 'Vertical arrow pointing down',
    defaultStyle: {
      shapeKind: 'arrow-down',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'arrow-both',
    label: 'Bi-Directional ↔',
    category: 'arrows',
    defaultWidth: 320,
    defaultHeight: 85,
    defaultLabel: 'IPC Bridge',
    description: 'Two-way synchronization arrow',
    defaultStyle: {
      shapeKind: 'arrow-both',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'connector-elbow',
    label: 'Elbow Connector ↳',
    category: 'arrows',
    defaultWidth: 240,
    defaultHeight: 140,
    defaultLabel: 'Route',
    description: '90-degree stepped connector with arrowhead',
    defaultStyle: {
      shapeKind: 'connector-elbow',
      backgroundColor: 'transparent',
      borderColor: '#7E42C1',
      borderWidth: 3,
      color: '#E6E6E6',
      fontSize: 14,
      textAlign: 'center'
    }
  },
  {
    kind: 'callout',
    label: 'Speech Callout',
    category: 'callouts',
    defaultWidth: 300,
    defaultHeight: 130,
    defaultLabel: 'Key Architectural Insight',
    description: 'Speech bubble callout with pointer tail',
    defaultStyle: {
      shapeKind: 'callout',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'callout-cloud',
    label: 'Thought Cloud',
    category: 'callouts',
    defaultWidth: 280,
    defaultHeight: 140,
    defaultLabel: 'Hypothesis',
    description: 'Cloud annotation shape',
    defaultStyle: {
      shapeKind: 'callout-cloud',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'banner',
    label: 'Ribbon Banner',
    category: 'callouts',
    defaultWidth: 380,
    defaultHeight: 90,
    defaultLabel: 'RELEASE MILESTONE',
    description: 'Notched ribbon banner for headers',
    defaultStyle: {
      shapeKind: 'banner',
      backgroundColor: '#4A2574',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center'
    }
  },
  {
    kind: 'badge',
    label: 'Shield Badge',
    category: 'callouts',
    defaultWidth: 170,
    defaultHeight: 175,
    defaultLabel: 'ZERO CLOUD',
    description: 'Security or verification shield badge',
    defaultStyle: {
      shapeKind: 'badge',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'center'
    }
  },
  {
    kind: 'quote-box',
    label: 'Accent Callout Box',
    category: 'callouts',
    defaultWidth: 360,
    defaultHeight: 115,
    defaultLabel: '“Local-first ensures deterministic sub-ms latency.”',
    description: 'Left-accented executive quote/callout card',
    defaultStyle: {
      shapeKind: 'quote-box',
      backgroundColor: '#161616',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontStyle: 'italic',
      textAlign: 'left'
    }
  },
  {
    kind: 'flow-process',
    label: 'Process Step',
    category: 'flowchart',
    defaultWidth: 240,
    defaultHeight: 100,
    defaultLabel: 'Transform Payload',
    description: 'Standard ISO flowchart process box',
    defaultStyle: {
      shapeKind: 'flow-process',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'flow-decision',
    label: 'Decision (Yes/No)',
    category: 'flowchart',
    defaultWidth: 230,
    defaultHeight: 145,
    defaultLabel: 'Cache Hit?',
    description: 'Flowchart conditional branch diamond',
    defaultStyle: {
      shapeKind: 'flow-decision',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'flow-data',
    label: 'Data I/O',
    category: 'flowchart',
    defaultWidth: 250,
    defaultHeight: 100,
    defaultLabel: 'Read Stream',
    description: 'Flowchart input/output rhomboid',
    defaultStyle: {
      shapeKind: 'flow-data',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'flow-database',
    label: 'Database Cylinder',
    category: 'flowchart',
    defaultWidth: 200,
    defaultHeight: 150,
    defaultLabel: 'SQLite WAL',
    description: 'Cylindrical disk/database storage symbol',
    defaultStyle: {
      shapeKind: 'flow-database',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center'
    }
  },
  {
    kind: 'flow-document',
    label: 'Document Wave',
    category: 'flowchart',
    defaultWidth: 240,
    defaultHeight: 125,
    defaultLabel: 'Markdown Artifact',
    description: 'Flowchart document with wavy bottom edge',
    defaultStyle: {
      shapeKind: 'flow-document',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  },
  {
    kind: 'flow-terminator',
    label: 'Start / Terminator',
    category: 'flowchart',
    defaultWidth: 230,
    defaultHeight: 90,
    defaultLabel: 'Start / End',
    description: 'Stadium pill terminator for workflow start/end',
    defaultStyle: {
      shapeKind: 'flow-terminator',
      backgroundColor: '#4A2574',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 17,
      fontWeight: 'bold',
      textAlign: 'center'
    }
  },
  {
    kind: 'flow-predefined',
    label: 'Subroutine / Module',
    category: 'flowchart',
    defaultWidth: 250,
    defaultHeight: 105,
    defaultLabel: 'IPC Handler',
    description: 'Double-bordered predefined subroutine block',
    defaultStyle: {
      shapeKind: 'flow-predefined',
      backgroundColor: '#2A1B3D',
      borderColor: '#7E42C1',
      borderWidth: 2,
      color: '#E6E6E6',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center'
    }
  }
];

export function getShapeCatalogItem(kind?: ShapeKind): ShapeCatalogItem {
  if (!kind) return SHAPE_CATALOG[1];
  return SHAPE_CATALOG.find((item) => item.kind === kind) || SHAPE_CATALOG[1];
}

export function createShapeSlideElement(
  kind: ShapeKind,
  zIndex: number,
  offsetIndex = 0
): SlideElement {
  const spec = getShapeCatalogItem(kind);
  const offset = (offsetIndex % 6) * 22;
  return {
    id: `el-shape-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'shape',
    x: Math.min(640, 120 + offset),
    y: Math.min(380, 140 + offset),
    width: spec.defaultWidth,
    height: spec.defaultHeight,
    zIndex,
    content: spec.defaultLabel,
    style: {
      ...spec.defaultStyle,
      shapeKind: kind
    }
  };
}

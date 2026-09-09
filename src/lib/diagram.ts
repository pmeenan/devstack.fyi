export type IconKind =
  | 'compute'
  | 'browser'
  | 'database'
  | 'bucket'
  | 'keys'
  | 'queue'
  | 'workflow'
  | 'object'
  | 'code'
  | 'clock'
  | 'message';
export interface DiagramNode {
  id: string;
  label: string;
  subtitle: string;
  icon: IconKind;
  x: number;
  y: number;
  href: string;
  detail: string;
}
export interface DiagramEdge {
  from: string;
  to: string;
  d: string;
  label?: string;
  x?: number;
  y?: number;
  kind?: 'data' | 'message' | 'return';
}
export interface Diagram {
  title: string;
  summary: string;
  width: number;
  height: number;
  regions?: {
    label: string;
    detail: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

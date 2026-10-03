/** Minimal structural view of the mdast nodes the depth plugin touches. */
export interface DepthNode {
  type: string;
  value?: string;
  children?: DepthNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

export declare const DEPTH_FALLBACK_LABEL: string;
export declare function foldDepthPassages(children: DepthNode[]): DepthNode[];
export declare function remarkDepthPassages(): (tree: { children: DepthNode[] }) => void;
export default remarkDepthPassages;

export interface DirectSupportConfig {
  preferredMethod: string;
  zelle: { recipient: string; recipientName: string };
  cashApp: { url: string };
}
export type DirectSupportMethod =
  | { id: "zelle"; label: string; recipient: string; recipientName: string }
  | { id: "cashapp"; label: string; url: string };
export function resolveSupportMethods(config: DirectSupportConfig): DirectSupportMethod[];

import type AMM from '../amm.json';
export interface CopyField { group: string; path: string; label: string; key: string; text: string }
export function ammCopyFields(content: typeof AMM): CopyField[];
export function resolveAmmCopy(content: typeof AMM, resolve: (key: string, text: string) => string): typeof AMM;

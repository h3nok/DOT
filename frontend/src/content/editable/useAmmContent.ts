import { useMemo } from 'react';
import AMM from '../amm.json';
import { resolveAmmCopy } from './ammCopy.js';
import { useSiteContent } from './SiteContentProvider';

export function useAmmContent() {
  const { resolve } = useSiteContent();
  return useMemo(() => resolveAmmCopy(AMM, resolve), [resolve]);
}

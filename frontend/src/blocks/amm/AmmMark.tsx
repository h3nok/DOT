import { useId } from 'react';
import './amm-mark.css';

/** Fire rising from open pages. The masthead ignites once; other placements stay still (L1, L10). */
export function AmmMark({ className = '', kindle = false }: { className?: string; kindle?: boolean }) {
  const id = useId();
  return <svg className={`amm-mark${kindle ? ' amm-mark--kindle' : ''} ${className}`} viewBox="0 0 64 64" width={64} height={64} fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-flame`} x1="35" y1="3" x2="28" y2="55" gradientUnits="userSpaceOnUse"><stop stopColor="#FFB52E" /><stop offset=".35" stopColor="#FA6717" /><stop offset=".72" stopColor="#DD3410" /><stop offset="1" stopColor="#881B14" /></linearGradient>
      <linearGradient id={`${id}-heart`} x1="35" y1="20" x2="30" y2="52" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF0A4" /><stop offset=".42" stopColor="#FFD34A" /><stop offset="1" stopColor="#FF8D1C" /></linearGradient>
      <linearGradient id={`${id}-core`} x1="31" y1="29" x2="32" y2="51" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFDF0" /><stop offset=".62" stopColor="#FFF8D7" /><stop offset="1" stopColor="#FFE67B" /></linearGradient>
      <radialGradient id={`${id}-heat`}><stop stopColor="#FFAE32" stopOpacity=".42" /><stop offset=".5" stopColor="#F35A15" stopOpacity=".13" /><stop offset="1" stopColor="#F35A15" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse className="amm-mark-heat" cx="32" cy="35" rx="31" ry="28" fill={`url(#${id}-heat)`} />
    <g className="amm-mark-fire">
      <path className="amm-mark-flame" d="M37 2C25 12 29 24 22 31C18 27 18 22 20 17C9 25 7 35 11 43C15 52 23 55 32 54C45 54 53 45 54 36C55 30 52 23 48 20C49 28 44 32 40 34C44 24 34 19 37 2Z" fill={`url(#${id}-flame)`} />
      <path className="amm-mark-tongue amm-mark-tongue--left" d="M13 17C8 25 17 29 16 37C10 34 5 28 13 17Z" fill={`url(#${id}-flame)`} />
      <path className="amm-mark-tongue amm-mark-tongue--right" d="M46 9C43 17 51 19 48 27C55 20 47 15 46 9Z" fill={`url(#${id}-flame)`} />
      <path className="amm-mark-heart" d="M35 18C27 27 32 30 27 37C22 35 20 32 21 28C14 38 20 49 30 51C41 53 49 45 48 36C45 41 41 42 38 40C41 31 33 28 35 18Z" fill={`url(#${id}-heart)`} />
      <path className="amm-mark-core" d="M31 29C30 36 32 39 27 43C27 39 25 38 25 36C20 44 26 50 32 50C39 50 43 45 41 40C39 45 36 45 35 43C38 38 31 36 31 29Z" fill={`url(#${id}-core)`} />
      <path className="amm-mark-seam" d="M35 8C29 18 34 24 29 31" stroke="#FFEAA0" strokeWidth=".9" strokeLinecap="round" />
    </g>
    <g className="amm-mark-pages">
      <path d="M16 52C23 51 28 54 32 56C36 54 41 51 48 52L45 58C40 58 36 60 32 63C28 60 24 58 19 58Z" fill="currentColor" />
      <path className="amm-mark-page-edge" d="M19 53C24 53 28 55 32 57C36 55 40 53 45 53M32 57V61" stroke="#FBA54C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g className="amm-mark-embers" fill="#F88C24"><path className="amm-mark-ember amm-mark-ember--one" d="m23 12 1-3 1 3-1 1Z" /><path className="amm-mark-ember amm-mark-ember--two" d="m42 7 1-3 1 3-1 1Z" /><circle className="amm-mark-ember amm-mark-ember--three" cx="54" cy="26" r=".8" /></g>
  </svg>;
}

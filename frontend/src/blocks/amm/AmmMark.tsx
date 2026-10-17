import { useId } from 'react';
import './amm-mark.css';

/** An open torch: a short kindling gesture in the masthead, still elsewhere. */
export function AmmMark({ className = '', kindle = false }: { className?: string; kindle?: boolean }) {
  const id = useId();
  return <svg className={`amm-mark${kindle ? ' amm-mark--kindle' : ''} ${className}`} viewBox="0 0 64 64" width={64} height={64} fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-flame`} x1="32" y1="5" x2="32" y2="50" gradientUnits="userSpaceOnUse"><stop stopColor="#E99742" /><stop offset=".48" stopColor="#D3582B" /><stop offset="1" stopColor="#A73524" /></linearGradient>
      <linearGradient id={`${id}-heart`} x1="32" y1="22" x2="32" y2="49" gradientUnits="userSpaceOnUse"><stop stopColor="#F8DB91" /><stop offset="1" stopColor="#ED9A42" /></linearGradient>
    </defs>
    <g className="amm-mark-fire">
      <path className="amm-mark-flame" d="M34 5C38 17 51 22 50 35C49 45 42 50 32 50C21 50 14 44 14 34C14 27 18 21 24 17C22 23 23 27 27 30C34 24 29 14 34 5Z" fill={`url(#${id}-flame)`} />
      <path className="amm-mark-heart" d="M34 22C35 31 43 34 41 41C40 46 37 49 32 49C26 49 22 45 23 40C23 36 26 33 28 30C27 35 29 38 31 39C35 35 32 29 34 22Z" fill={`url(#${id}-heart)`} />
      <path className="amm-mark-core" d="M33 36C33 40 37 41 36 45C36 47 34 49 32 49C29 49 28 47 28 45C28 42 30 41 31 39C31 42 32 42 33 43C34 41 32 39 33 36Z" fill="#FFF1CA" />
    </g>
    <path className="amm-mark-bowl" d="M21 53C27 56 37 56 43 53M27 60H37" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <g className="amm-mark-embers" fill="#D87532"><circle className="amm-mark-ember amm-mark-ember--one" cx="28" cy="19" r="1" /><circle className="amm-mark-ember amm-mark-ember--two" cx="42" cy="25" r=".8" /></g>
  </svg>;
}

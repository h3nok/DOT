import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAmmContent } from '../../content/editable/useAmmContent';
import './amm-money.css';
import { POWER_ROUTE } from './ammPowerMoves';

/** Publication context sits outside the author’s manuscript and immutable releases. */
export function AmmReadingCompanion({ slug }: { slug?: string }) {
  const { money, capital, reading } = useAmmContent();
  const note = money.companions.find(item => item.id === slug);
  return <aside className="amm-reading-companion" aria-label="AMM reading companion">
    <p className="amm-eyebrow">Reading companion · How power works</p>
    <h2>{note?.title ?? capital.title}</h2><p>{note?.text ?? capital.intro}</p>
    <Link className="amm-text-link" to={`${POWER_ROUTE}${note ? `#${note.anchor}` : ''}`}>{reading.companionLink} <ArrowRight aria-hidden="true" /></Link>
  </aside>;
}

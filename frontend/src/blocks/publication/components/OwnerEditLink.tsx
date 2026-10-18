import { Link } from 'react-router-dom';
import { FilePenLine } from 'lucide-react';
import { AmmButton } from '../../amm/AmmControls';
import { useAuth } from '../../../dot/useAuth';

/** Contextual entry only; the editor and API enforce publishing authority. */
export function OwnerEditLink({ to, label = 'Edit this piece' }: { to: string; label?: string }) {
  const { isOwner } = useAuth();
  if (!isOwner) return null;
  return <nav aria-label="Owner editing" className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/60 pb-3 text-sm">
    <AmmButton to={to} label={label} icon={<FilePenLine />} />
    <Link to="/studio/newsletter" className="inline-flex min-h-11 items-center underline underline-offset-4">Publication desk</Link>
  </nav>;
}

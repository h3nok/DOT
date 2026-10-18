import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { OwnerEditLink } from './OwnerEditLink';
const auth = vi.hoisted(() => ({ isOwner: false }));
vi.mock('../../../dot/useAuth', () => ({ useAuth: () => auth }));
it('shows the exact edit destination only to the owner', () => {
  const { rerender } = render(<MemoryRouter><OwnerEditLink to="/studio/writing?source=amm-chapter-one-the-leech" label="Edit this chapter" /></MemoryRouter>);
  expect(screen.queryByRole('navigation', { name: 'Owner editing' })).toBeNull();
  auth.isOwner = true;
  rerender(<MemoryRouter><OwnerEditLink to="/studio/writing?source=amm-chapter-one-the-leech" label="Edit this chapter" /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Edit this chapter' })).toHaveAttribute('href', '/studio/writing?source=amm-chapter-one-the-leech');
  auth.isOwner = false;
});

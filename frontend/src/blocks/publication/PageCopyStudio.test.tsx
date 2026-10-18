import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, expect, it, vi } from 'vitest';
import { SiteContentProvider } from '../../content/editable/SiteContentProvider';
import * as service from '../../services/SiteContentService';
import PageCopyStudio from './PageCopyStudio';
import AMM from '../../content/amm.json';

vi.mock('../../dot/useAuth', () => ({ useAuth: () => ({ isOwner: true }) }));
vi.mock('../amm/AmmIdentity', () => ({ AmmShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('../../services/SiteContentService', () => ({ siteContentAvailable: () => true, fetchDrafts: vi.fn(), fetchPublishedContent: async () => ({}), saveBlock: vi.fn(), revertBlock: vi.fn() }));
const row: service.SiteContentDraft = { key: 'amm.headline.0', draft_value: 'My private opening', published_value: 'Published opening', updated_at: '2026-10-15T10:00:00Z', published_at: null };
beforeEach(() => { vi.resetAllMocks(); vi.mocked(service.fetchDrafts).mockResolvedValue([row]); });
const open = () => render(<HelmetProvider><MemoryRouter><SiteContentProvider><PageCopyStudio /></SiteContentProvider></MemoryRouter></HelmetProvider>);

it('offers the hero paragraph in Opening and preserves its existing saved-content key', async () => {
  const paragraph = { ...row, key: 'amm.home.premise', draft_value: 'A saved private introduction', published_value: AMM.home.premise };
  vi.mocked(service.fetchDrafts).mockResolvedValue([paragraph]);
  vi.mocked(service.saveBlock).mockResolvedValue({ ...paragraph, draft_value: 'The revised introduction', published_value: 'The revised introduction' });
  open();
  const input = await screen.findByRole('textbox', { name: 'Opening paragraph' });
  expect(input).toHaveValue(paragraph.draft_value);
  expect(input.closest('details')).toHaveAttribute('open');
  expect(input.closest('details')?.querySelector('summary')).toHaveTextContent('Opening');
  fireEvent.change(input, { target: { value: 'The revised introduction' } });
  fireEvent.click(within(screen.getByRole('region', { name: 'Opening paragraph' })).getByRole('button', { name: 'Publish change' }));
  await screen.findByText('Published on the page.');
  expect(service.saveBlock).toHaveBeenCalledWith('amm.home.premise', 'The revised introduction', { publish: true, expectedUpdatedAt: paragraph.updated_at });
});

it('reopens saved drafts and separates saving from publishing with a revision check', async () => {
  vi.mocked(service.saveBlock).mockResolvedValue({ ...row, draft_value: 'Revised opening', updated_at: '2026-10-15T11:00:00Z' });
  open();
  const input = await screen.findByRole('textbox', { name: 'Headline — first line' });
  expect(input).toHaveValue('My private opening');
  const field = within(screen.getByRole('region', { name: 'Headline — first line' }));
  expect(field.getByText('Published opening')).toBeInTheDocument();
  fireEvent.change(input, { target: { value: 'Revised opening' } });
  fireEvent.click(field.getByRole('button', { name: 'Save draft' }));
  await field.findByText('Draft saved privately.');
  expect(service.saveBlock).toHaveBeenLastCalledWith(row.key, 'Revised opening', { publish: false, expectedUpdatedAt: row.updated_at });
  fireEvent.click(field.getByRole('button', { name: 'Publish change' }));
  await field.findByText('Published on the page.');
  expect(service.saveBlock).toHaveBeenLastCalledWith(row.key, 'Revised opening', { publish: true, expectedUpdatedAt: '2026-10-15T11:00:00Z' });
});

it('keeps a failed or conflicting edit in the field', async () => {
  vi.mocked(service.saveBlock).mockRejectedValue(new Error('A newer saved edit exists.'));
  open();
  const input = await screen.findByRole('textbox', { name: 'Headline — first line' });
  fireEvent.change(input, { target: { value: 'Keep this text' } });
  fireEvent.click(within(screen.getByRole('region', { name: 'Headline — first line' })).getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('A newer saved edit exists.');
  expect(input).toHaveValue('Keep this text');
});

it('does not offer default text for editing when saved drafts could not be read', async () => {
  vi.mocked(service.fetchDrafts).mockImplementation(async (_signal, strict) => { if (strict) throw new Error('Draft service offline'); return []; });
  open();
  expect(await screen.findByRole('alert')).toHaveTextContent('Draft service offline');
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(service.saveBlock).not.toHaveBeenCalled();
});

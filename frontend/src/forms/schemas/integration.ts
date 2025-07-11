import { z } from 'zod';

export const integrationSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  type: z.string().min(1, 'Integration type is required'),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  apiKey: z.string().optional(),
  description: z.string().optional(),
});

export type IntegrationFormData = z.infer<typeof integrationSchema>;

export const integrationTypes = [
  { id: 'openai', name: 'OpenAI API', icon: '🤖', description: 'Connect to GPT models for consciousness analysis' },
  { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠', description: 'Advanced AI reasoning and consciousness research' },
  { id: 'notion', name: 'Notion Database', icon: '📝', description: 'Sync knowledge and research notes' },
  { id: 'obsidian', name: 'Obsidian Vault', icon: '💎', description: 'Connect to your knowledge graph' },
  { id: 'zotero', name: 'Zotero Library', icon: '📚', description: 'Academic research and citations' },
  { id: 'custom', name: 'Custom API', icon: '🔧', description: 'Connect to your own consciousness research tools' }
] as const;

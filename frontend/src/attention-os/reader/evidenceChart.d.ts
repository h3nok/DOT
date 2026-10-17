export interface EvidenceChartData {
  title: string; period: string; unit: string; status: string; limits: string; maximum: number;
  rows: Array<{ label: string; value: number; source: string; url: string; kind?: 'estimate' | 'projection' | 'observed' }>;
}
export function parseEvidenceChart(source: string): EvidenceChartData | null;

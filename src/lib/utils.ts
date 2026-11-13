import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function getHiringScoreLabel(score: number): { label: string; color: string } {
  if (score >= 100) return { label: 'Actively Hiring', color: 'text-emerald-600 bg-emerald-50' };
  if (score >= 85) return { label: 'Recently Hiring', color: 'text-blue-600 bg-blue-50' };
  if (score >= 75) return { label: 'Hiring Signal', color: 'text-violet-600 bg-violet-50' };
  if (score >= 60) return { label: 'Past Activity', color: 'text-amber-600 bg-amber-50' };
  return { label: 'No Signal', color: 'text-gray-500 bg-gray-100' };
}

export function escapeCsvValue(value: string | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function resultsToCSV(results: import('@/types').RecruiterResult[]): string {
  const headers = [
    'Name', 'Title', 'Company', 'Location',
    'Email', 'Email Confidence', 'Hiring Score',
    'Last Post Date', 'LinkedIn URL',
  ];
  const rows = results.map(r => [
    r.name, r.title, r.company, r.location,
    r.email ?? '', r.email_confidence ?? '', r.hiring_score,
    r.last_post_date ?? '', r.linkedin_url,
  ].map(v => escapeCsvValue(String(v))).join(','));
  return [headers.join(','), ...rows].join('\n');
}

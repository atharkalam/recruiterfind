import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RecruiterFind — LinkedIn Recruiter Discovery',
  description: 'Find and email recruiters actively hiring at any company.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

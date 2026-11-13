import { AppNav } from '@/components/layout/AppNav';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />
      <main className="pt-14">{children}</main>
    </div>
  );
}

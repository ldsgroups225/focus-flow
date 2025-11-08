import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Dashboard - FocusFlow',
  description: 'Manage your tasks efficiently with FocusFlow',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

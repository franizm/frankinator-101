import { ReactNode } from 'react';
import Sidebar from './sidebar';
import MobileNav from './mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/components/ui/theme-provider';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { theme } = useTheme();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile navigation */}
      <MobileNav />
      
      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

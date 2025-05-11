import React from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AdminBannerProps {
  className?: string;
}

export function AdminBanner({ className }: AdminBannerProps) {
  const { user } = useAuth();
  
  // Only show the banner for admin role
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return (
    <Link href="/admin">
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-black text-white py-1 px-3 flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors duration-200",
        className
      )}>
        <Shield className="h-4 w-4 mr-2" />
        <span className="font-medium">Master Admin Area</span>
        <span className="text-xs ml-2 text-gray-400">Click to access</span>
      </div>
    </Link>
  );
}
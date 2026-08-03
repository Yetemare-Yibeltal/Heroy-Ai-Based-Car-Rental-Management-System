'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  CreditCard,
  Star,
  Tag,
  Wrench,
  ShieldCheck,
  UserCog,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const STAFF_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
const ADMIN_ONLY_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const NAV_SECTIONS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/fleet', label: 'Fleet', icon: Car },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard, adminOnly: true },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag, adminOnly: true },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/team', label: 'Team', icon: UserCog, adminOnly: true },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, adminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isStaff = user && STAFF_ROLES.includes(user.role);
  const isAdmin = user && ADMIN_ONLY_ROLES.includes(user.role);

  useEffect(() => {
    if (isInitialized && !isStaff) {
      router.push('/login?redirect=/admin');
    }
  }, [isInitialized, isStaff, router]);

  if (!isInitialized || !isStaff) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  const visibleSections = NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin);

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="glass-panel sticky top-24 hidden h-fit w-56 shrink-0 rounded-lg p-4 lg:block">
        <div className="mb-6 px-2">
          <GradientText as="span" className="text-lg">
            HEROY
          </GradientText>
          <p className="text-xs text-muted-foreground">Staff Console</p>
        </div>

        <nav className="space-y-1">
          {visibleSections.map((section) => {
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <section.icon size={16} />
                {section.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package2,
  Menu,
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-provider';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const db = useFirestore();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    if ((user?.role === 'admin' || user?.role === 'SysAdmin') && db) {
      const q = query(collection(db, 'users'), where('role', '==', 'pending'));
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          setPendingApprovals(querySnapshot.size);
        },
        (error) => {
           const contextualError = new FirestorePermissionError({
              path: 'users',
              operation: 'list',
           });
           errorEmitter.emit('permission-error', contextualError);
        }
      );
      return () => unsubscribe();
    }
  }, [user?.role, db]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SysAdmin', 'admin', 'verified'] },
    { href: '/inventory', label: 'Inventory', icon: Package, roles: ['SysAdmin', 'admin', 'verified'] },
    { href: '/export', label: 'Export', icon: Download, roles: ['SysAdmin', 'admin', 'verified'] },
    { href: '/reports', label: 'Reports', icon: FileText, roles: ['SysAdmin', 'admin', 'verified'] },
    { href: '/admin/users', label: 'Users', icon: Users, roles: ['SysAdmin', 'admin'], badge: pendingApprovals },
    { href: '/admin/types', label: 'Types', icon: Settings, roles: ['SysAdmin', 'admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Package2 className="h-6 w-6 text-primary" />
          <span className="font-bold">ApparelFlow</span>
        </Link>
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'transition-colors hover:text-foreground',
              pathname.startsWith(item.href)
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground'
            )}
          >
            <div className="flex items-center gap-2">
              <span>{item.label}</span>
               {item.badge && item.badge > 0 ? (
                 <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {item.badge}
                </span>
               ) : null}
            </div>
          </Link>
        ))}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Package2 className="h-6 w-6 text-primary" />
              <span className="font-bold">ApparelFlow</span>
            </Link>
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                   pathname.startsWith(item.href) && 'bg-muted text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                 {item.badge && item.badge > 0 ? (
                 <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {item.badge}
                </span>
               ) : null}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  // src={user?.photoURL || ''}
                  alt={user?.displayName || 'User'}
                />
                <AvatarFallback>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.displayName}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

/**
 * UserMenu Component
 *
 * Dropdown menu for authenticated users showing profile info and actions.
 * Shows sign-in button when not authenticated.
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { User, LogOut, Star, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { AuthDialog } from './AuthDialog';
import { cn } from '@/lib/utils';

// =============================================================================
// Component
// =============================================================================

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openLogin = () => {
    setAuthMode('login');
    setAuthDialogOpen(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setAuthDialogOpen(true);
  };

  // Don't render while auth is loading to prevent flash
  if (isLoading) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
    );
  }

  // Not authenticated - show sign in button
  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openLogin}
            className="hidden sm:flex"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            onClick={openRegister}
            className="bg-primary/90 hover:bg-primary"
          >
            Get Started
          </Button>
        </div>

        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          defaultMode={authMode}
        />
      </>
    );
  }

  // Authenticated - show user dropdown
  const initials = getInitials(user.name || user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 hover:bg-primary/10"
        >
          <Avatar className="h-9 w-9">
            {user.image && <AvatarImage src={user.image} alt={user.name || 'User'} />}
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user.name && (
              <p className="text-sm font-medium leading-none">{user.name}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <Link href="/watchlist">
          <DropdownMenuItem className="cursor-pointer">
            <Star className="mr-2 h-4 w-4" />
            <span>Watchlist</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getInitials(nameOrEmail: string): string {
  // If it looks like an email, use first letter
  if (nameOrEmail.includes('@')) {
    return nameOrEmail.charAt(0).toUpperCase();
  }

  // Otherwise use first letters of first two words
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  return nameOrEmail.charAt(0).toUpperCase();
}

export default UserMenu;

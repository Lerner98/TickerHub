/**
 * Settings Page
 *
 * Professional user settings with:
 * - Profile management (name update)
 * - Password change
 * - Connected accounts (Google link/unlink)
 * - Account deletion
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Lock,
  Link2,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Header } from '@/components/layout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
  updateUser,
  changePassword,
  deleteUser,
  signIn,
  linkSocial,
  unlinkAccount,
  authClient,
} from '@/lib/auth-client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// =============================================================================
// Schemas
// =============================================================================

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// =============================================================================
// Main Component
// =============================================================================

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, refetch } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    setLocation('/');
    return null;
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-6">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded-lg" />
              <div className="h-64 bg-muted rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Section */}
          <ProfileSection user={user} onUpdate={refetch} />

          {/* Password Section */}
          <PasswordSection />

          {/* Connected Accounts Section */}
          <ConnectedAccountsSection user={user} onUpdate={refetch} />

          {/* Danger Zone */}
          <DangerZone />
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// Profile Section
// =============================================================================

interface ProfileSectionProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  onUpdate: () => void;
}

function ProfileSection({ user, onUpdate }: ProfileSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const result = await updateUser({ name: data.name });
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update profile');
      }
      setSuccess(true);
      onUpdate();
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      <div className="flex items-start gap-6 mb-6">
        <Avatar className="h-20 w-20">
          {user.image && <AvatarImage src={user.image} alt={user.name || 'User'} />}
          <AvatarFallback className="bg-primary/20 text-primary text-xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <p className="font-medium">{user.name || 'No name set'}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {user.email}
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success && <Check className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </GlassCard>
  );
}

// =============================================================================
// Password Section
// =============================================================================

function PasswordSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);

    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to change password');
      }

      form.reset();
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Password</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </Form>
    </GlassCard>
  );
}

// =============================================================================
// Connected Accounts Section
// =============================================================================

interface ConnectedAccountsSectionProps {
  user: {
    id: string;
    email: string;
  };
  onUpdate: () => void;
}

interface LinkedAccount {
  id: string;
  providerId: string;
  accountId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  scopes: string[];
}

function ConnectedAccountsSection({ user, onUpdate }: ConnectedAccountsSectionProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { toast } = useToast();

  // Fetch linked accounts from Better Auth
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['linked-accounts', user.id],
    queryFn: async () => {
      const result = await authClient.listAccounts();
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch accounts');
      }
      return result.data as LinkedAccount[];
    },
  });

  const isGoogleConnected = accountsData?.some(
    (account) => account.providerId === 'google'
  );

  // Check if user can safely unlink Google
  // User can unlink if they have:
  // 1. A credential (email/password) account, OR
  // 2. More than one OAuth provider linked
  const hasCredentialAccount = accountsData?.some(
    (account) => account.providerId === 'credential'
  );
  const linkedOAuthCount = accountsData?.filter(
    (account) => account.providerId !== 'credential'
  ).length ?? 0;
  const canUnlinkGoogle = hasCredentialAccount || linkedOAuthCount > 1;

  const handleLinkGoogle = () => {
    setIsLinking(true);
    signIn.social({
      provider: 'google',
      callbackURL: '/settings',
    }).catch((error) => {
      toast({
        title: 'Error',
        description: 'Failed to link Google account',
        variant: 'destructive',
      });
      setIsLinking(false);
    });
  };

  const handleUnlinkGoogle = async () => {
    setIsUnlinking(true);
    try {
      const result = await unlinkAccount({
        providerId: 'google',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to unlink account');
      }

      toast({
        title: 'Account unlinked',
        description: 'Google account has been disconnected.',
      });
      refetchAccounts();
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unlink account',
        variant: 'destructive',
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Connect your social accounts for easier sign-in
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
          <div className="flex items-center gap-3">
            <FcGoogle className="h-6 w-6" />
            <div>
              <p className="font-medium">Google</p>
              <p className="text-sm text-muted-foreground">
                {isGoogleConnected
                  ? canUnlinkGoogle
                    ? 'Your Google account is connected'
                    : 'Primary sign-in method (cannot disconnect)'
                  : 'Sign in with your Google account'}
              </p>
            </div>
          </div>
          {accountsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isGoogleConnected ? (
            canUnlinkGoogle ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkGoogle}
                disabled={isUnlinking}
                className="text-destructive hover:text-destructive"
              >
                {isUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disconnect
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                Primary
              </span>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkGoogle}
              disabled={isLinking}
            >
              {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// =============================================================================
// Danger Zone
// =============================================================================

function DangerZone() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteUser();
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete account');
      }
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <GlassCard className="p-6 border-destructive/30">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Once you delete your account, there is no going back. This action is permanent.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data including your watchlist and preferences.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}

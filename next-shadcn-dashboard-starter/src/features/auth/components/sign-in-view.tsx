import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignIn as ClerkSignInForm } from '@clerk/nextjs';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { IconStar, IconKey } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In - Escape Room Dashboard',
  description: 'Sign in to your escape room business dashboard.'
};

export default function SignInViewPage({ stars }: { stars: number }) {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/dashboard'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Dashboard
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <IconKey className='mr-2 h-6 w-6' />
          Escape Room Analytics
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;This dashboard has transformed how we manage our escape room business. 
              Real-time insights and analytics have helped us optimize bookings and 
              improve customer satisfaction dramatically.&rdquo;
            </p>
            <footer className='text-sm'>Sarah Mitchell, Green Light Escape Owner</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
            <p className='text-sm text-muted-foreground mt-2'>
              Sign in to access your escape room dashboard
            </p>
          </div>

          <ClerkSignInForm
            initialValues={{
              emailAddress: 'demo@escaperooms.com'
            }}
          />

          <p className='text-muted-foreground px-8 text-center text-sm'>
            By signing in, you agree to our{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

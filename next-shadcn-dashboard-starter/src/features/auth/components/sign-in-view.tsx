import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignIn as ClerkSignInForm } from '@clerk/nextjs';
import { IconKey } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In - Escape Room Dashboard',
  description: 'Sign in to your escape room business dashboard.'
};

export default function SignInViewPage({ stars }: { stars: number }) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Link
        href='/dashboard'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 md:top-8 md:right-8'
        )}
      >
        Dashboard
      </Link>
      
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center space-y-2'>
          <div className='flex items-center justify-center mb-4'>
            <IconKey className='h-8 w-8 mr-2 text-primary' />
            <h1 className='text-2xl font-bold'>Escape Room Analytics</h1>
          </div>
          <h2 className='text-xl font-semibold tracking-tight'>Welcome back</h2>
          <p className='text-sm text-muted-foreground'>
            Sign in to your escape room dashboard
          </p>
        </div>

        <ClerkSignInForm
          initialValues={{
            emailAddress: 'demo@escaperooms.com'
          }}
        />

        <p className='text-muted-foreground text-center text-xs'>
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
  );
}

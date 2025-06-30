'use client';

import { IconBrightness } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { Button } from '@/components/ui/button';

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = React.useCallback(
    (e?: React.MouseEvent) => {
      const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      // Set coordinates from the click event
      if (e) {
        root.style.setProperty('--x', `${e.clientX}px`);
        root.style.setProperty('--y', `${e.clientY}px`);
      }

      document.startViewTransition(() => {
        setTheme(newMode);
      });
    },
    [resolvedTheme, setTheme]
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button
        variant='secondary'
        size='icon'
        className='group/toggle size-8'
        disabled
      >
        <IconBrightness />
        <span className='sr-only'>Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant='secondary'
      size='icon'
      className='group/toggle size-8'
      onClick={handleThemeToggle}
    >
      <IconBrightness />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}

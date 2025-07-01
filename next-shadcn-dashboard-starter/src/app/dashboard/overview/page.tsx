'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function OverviewRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main dashboard
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to the dashboard</p>
      </div>
    </div>
  )
} 
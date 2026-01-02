import * as Sentry from '@sentry/react'
import type { PropsWithChildren } from 'react'

export function ErrorBoundary({ children }: PropsWithChildren) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className='space-y-4 p-6'>
          <h1 className='text-xl font-bold text-destructive'>
            Something went wrong
          </h1>
          <p className='text-muted-foreground'>
            {error instanceof Error ? error.message : 'Unexpected error'}
          </p>
          <button className='btn' onClick={resetError}>
            Try again
          </button>
        </div>
      )}
      onError={(error, componentStack) => {
        Sentry.captureException(error, {
          contexts: { react: { componentStack } },
        })
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}

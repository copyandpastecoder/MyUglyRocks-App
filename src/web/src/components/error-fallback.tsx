'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

/**
 * Fallback UI displayed when an error is caught by the ErrorBoundary
 */
export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const handleReload = () => {
    if (onReset) {
      onReset();
    }
    // Force a full page reload to reset all state
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something Went Wrong</CardTitle>
          </div>
          <CardDescription>
            We apologize for the inconvenience. An unexpected error has occurred.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The error has been automatically reported to our team. Please try refreshing the page
            or returning to the home page.
          </p>

          {/* Only show error details in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-mono text-muted-foreground">
                <strong>Error:</strong> {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto text-xs text-muted-foreground">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex space-x-2">
          <Button onClick={handleReload} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

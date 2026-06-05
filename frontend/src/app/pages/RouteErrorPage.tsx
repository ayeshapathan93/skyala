import { isRouteErrorResponse, useRouteError, Link } from "react-router";

export default function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText || "Page not found"
    : error instanceof Error
      ? error.message
      : "Something went wrong";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        <Link to="/" className="btn-brand inline-flex">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

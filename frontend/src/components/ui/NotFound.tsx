import { Link } from "react-router-dom";
import { MoveLeft, HelpCircle } from "lucide-react";
import { Button } from "./Button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center dark:bg-zinc-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 mb-6">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
        The page you are looking for doesn't exist, was removed, or has been temporarily moved.
      </p>
      <Link to="/">
        <Button variant="outline" className="flex items-center">
          <MoveLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

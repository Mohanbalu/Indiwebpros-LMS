import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400 select-none">
      <Link
        to="/"
        className="flex items-center hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-zinc-400" />
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

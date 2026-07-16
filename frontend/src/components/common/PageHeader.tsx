import { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem } from "../ui/Breadcrumb";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800 select-none">
      <div className="space-y-1.5">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

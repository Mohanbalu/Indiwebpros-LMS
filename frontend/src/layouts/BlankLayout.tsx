import { Outlet } from "react-router-dom";

export function BlankLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Outlet />
    </div>
  );
}

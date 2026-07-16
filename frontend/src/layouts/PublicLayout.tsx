import { Outlet, Link } from "react-router-dom";
import { Navbar } from "@/components/common/Navbar";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10 py-12 text-zinc-500 text-xs mt-auto">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 mb-3 text-sm">Courses</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/courses" className="hover:text-blue-600 dark:hover:text-blue-400">Full Stack Dev</Link></li>
              <li><Link to="/courses" className="hover:text-blue-600 dark:hover:text-blue-400">AI & Machine Learning</Link></li>
              <li><Link to="/courses" className="hover:text-blue-600 dark:hover:text-blue-400">Cloud Computing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400">Pricing</Link></li>
              <li><Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400">About</Link></li>
              <li><Link to="/faq" className="hover:text-blue-600 dark:hover:text-blue-400">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 mb-3 text-sm">Legal Policies</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/privacy-policy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</Link></li>
              <li><Link to="/refund-policy" className="hover:text-blue-600 dark:hover:text-blue-400">Refund Policy</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-blue-600 dark:hover:text-blue-400">Cookie Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 mb-3 text-sm">Corporate</h4>
            <p className="leading-relaxed font-medium text-zinc-400">
              IndiWebPros Tech Hub,<br />
              HSR Layout, Bengaluru,<br />
              Karnataka, India - 560102
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 border-t border-zinc-200/50 dark:border-zinc-800/80 pt-6 text-center select-none font-medium">
          <p>&copy; {new Date().getFullYear()} IndiWebPros. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

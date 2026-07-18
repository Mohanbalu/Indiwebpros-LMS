import { Link } from "react-router-dom";
import { APP_CONFIG } from "@/config/app.config";
import logoImg from "@/assets/fav.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", showText = true, size = 32 }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2 select-none group ${className}`}>
      <img 
        src={logoImg} 
        alt="Logo" 
        style={{ height: `${size}px`, width: `${size}px` }}
        className="object-contain transition-transform group-hover:scale-110 rounded-lg border border-zinc-200/50 dark:border-zinc-850/50" 
      />
      {showText && (
        <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
          {APP_CONFIG.shortName}
        </span>
      )}
    </Link>
  );
}

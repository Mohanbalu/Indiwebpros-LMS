import { ReactNode, StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { THEME_CONFIG } from "@/config/theme.config";
import { QUERY_CONFIG } from "@/config/query.config";
import { AuthProvider } from "@/context/AuthContext";

interface ProvidersProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: QUERY_CONFIG,
});

export function Providers({ children }: ProvidersProps) {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <NextThemeProvider
          attribute="class"
          defaultTheme={THEME_CONFIG.defaultTheme}
          storageKey={THEME_CONFIG.storageKey}
          enableSystem
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

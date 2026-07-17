import { BrowserRouter } from "react-router-dom";
import { Providers } from "@/providers";
import { AppRoutes } from "@/routes";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Providers>
    </ErrorBoundary>
  );
}

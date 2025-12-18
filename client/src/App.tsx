import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedBackground } from "@/components/layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/ui/page-loader";

// Eagerly load landing page for fast initial render
import LandingPage from "@/pages/LandingPage";

// Lazy load all other pages for code splitting
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ExplorerPage = lazy(() => import("@/pages/ExplorerPage"));
const TransactionPage = lazy(() => import("@/pages/TransactionPage"));
const AddressPage = lazy(() => import("@/pages/AddressPage"));
const BlockPage = lazy(() => import("@/pages/BlockPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const StockPage = lazy(() => import("@/pages/StockPage"));
const WatchlistPage = lazy(() => import("@/pages/WatchlistPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/watchlist" component={WatchlistPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/explorer/:chain" component={ExplorerPage} />
        <Route path="/explorer" component={ExplorerPage} />
        <Route path="/tx/:hash" component={TransactionPage} />
        <Route path="/address/:address" component={AddressPage} />
        <Route path="/block/:number" component={BlockPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/stocks/:symbol" component={StockPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={100}>
          <AnimatedBackground />
          <div className="relative min-h-screen">
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

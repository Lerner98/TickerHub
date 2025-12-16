import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedBackground } from "@/components/layout";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import ExplorerPage from "@/pages/ExplorerPage";
import TransactionPage from "@/pages/TransactionPage";
import AddressPage from "@/pages/AddressPage";
import BlockPage from "@/pages/BlockPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import StockPage from "@/pages/StockPage";
import WatchlistPage from "@/pages/WatchlistPage";
import SettingsPage from "@/pages/SettingsPage";

function Router() {
  return (
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={100}>
        <AnimatedBackground />
        <div className="relative min-h-screen">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

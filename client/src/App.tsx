import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import ExplorerPage from "@/pages/ExplorerPage";
import TransactionPage from "@/pages/TransactionPage";
import AddressPage from "@/pages/AddressPage";
import BlockPage from "@/pages/BlockPage";
import AnalyticsPage from "@/pages/AnalyticsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/explorer/:chain" component={ExplorerPage} />
      <Route path="/explorer" component={ExplorerPage} />
      <Route path="/tx/:hash" component={TransactionPage} />
      <Route path="/address/:address" component={AddressPage} />
      <Route path="/block/:number" component={BlockPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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

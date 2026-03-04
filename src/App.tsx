import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TeamSetup from "./pages/TeamSetup";
import Board from "./pages/Board";
import BacklogView from "./pages/BacklogView";
import SprintsView from "./pages/SprintsView";
import SprintDetail from "./pages/SprintDetail";
import EpicsView from "./pages/EpicsView";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/team-setup" element={<TeamSetup />} />
            <Route path="/boards" element={<Board />} />
            <Route path="/backlog" element={<BacklogView />} />
            <Route path="/sprints" element={<SprintsView />} />
            <Route path="/sprints/:id" element={<SprintDetail />} />
            <Route path="/epics" element={<EpicsView />} />
            <Route path="/team" element={<TeamSettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

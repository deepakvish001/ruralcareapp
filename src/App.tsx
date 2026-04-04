import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import SymptomChecker from "./pages/dashboard/SymptomChecker";
import FirstAid from "./pages/dashboard/FirstAid";
import Emergency from "./pages/dashboard/Emergency";
import FindDoctor from "./pages/dashboard/FindDoctor";
import Patients from "./pages/dashboard/Patients";
import Scheduler from "./pages/dashboard/Scheduler";
import Reports from "./pages/dashboard/Reports";
import Queue from "./pages/dashboard/Queue";
import Consultations from "./pages/dashboard/Consultations";
import Referrals from "./pages/dashboard/Referrals";
import Telemedicine from "./pages/dashboard/Telemedicine";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="symptoms" element={<SymptomChecker />} />
              <Route path="first-aid" element={<FirstAid />} />
              <Route path="emergency" element={<Emergency />} />
              <Route path="find-doctor" element={<FindDoctor />} />
              <Route path="patients" element={<Patients />} />
              <Route path="scheduler" element={<Scheduler />} />
              <Route path="reports" element={<Reports />} />
              <Route path="queue" element={<Queue />} />
              <Route path="consultations" element={<Consultations />} />
              <Route path="referrals" element={<Referrals />} />
              <Route path="telemedicine" element={<Telemedicine />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;

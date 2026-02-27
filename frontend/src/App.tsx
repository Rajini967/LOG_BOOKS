import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ELogBookLandingPage from "./pages/ELogBookLandingPage";
import ELogBookPage from "./pages/ELogBookPage";
import BoilerLogBookPage from "./pages/BoilerLogBookPage";
import ChemicalLogBookPage from "./pages/ChemicalLogBookPage";
import HVACValidationPage from "./pages/HVACValidationPage";
import AirVelocityTestPage from "./pages/AirVelocityTestPage";
import FilterIntegrityTestPage from "./pages/FilterIntegrityTestPage";
import RecoveryTestPage from "./pages/RecoveryTestPage";
import DifferentialPressureTestPage from "./pages/DifferentialPressureTestPage";
import NVPCTestPage from "./pages/NVPCTestPage";
import InstrumentsPage from "./pages/InstrumentsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import LogbookBuilderPage from "./pages/LogbookBuilderPage";
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/e-log-book" element={<ELogBookLandingPage />} />
              <Route path="/e-log-book/chiller" element={<ELogBookPage equipmentType="chiller" />} />
              <Route path="/e-log-book/boiler" element={<BoilerLogBookPage />} />
              <Route path="/e-log-book/chemical" element={<ChemicalLogBookPage />} />
              <Route path="/hvac-validation" element={<HVACValidationPage />} />
              <Route path="/hvac-validation/air-velocity-test" element={<AirVelocityTestPage />} />
              <Route path="/hvac-validation/filter-integrity-test" element={<FilterIntegrityTestPage />} />
              <Route path="/hvac-validation/recovery-test" element={<RecoveryTestPage />} />
              <Route path="/hvac-validation/differential-pressure-test" element={<DifferentialPressureTestPage />} />
              <Route path="/hvac-validation/nvpc-test" element={<NVPCTestPage />} />
              <Route path="/instruments" element={<InstrumentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/logbook-builder" element={<LogbookBuilderPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

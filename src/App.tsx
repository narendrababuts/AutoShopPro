
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import JobCards from "./pages/JobCards";
import JobCardsList from "./pages/JobCardsList";
import Staff from "./pages/Staff";
import Inventory from "./pages/Inventory";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import InvoiceSettings from "./pages/InvoiceSettings";
import Accounts from "./pages/Accounts";
import Auth from "./pages/Auth";
import GarageServices from "./pages/GarageServices";
import Promotions from "./pages/Promotions";
import Biometric from "./pages/Biometric";
import WhatsApp from "./pages/WhatsApp";
import NotFound from "./pages/NotFound";
import { GarageProvider } from "./contexts/GarageContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <GarageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="job-cards" element={<JobCards />} />
                <Route path="job-cards/list" element={<JobCardsList />} />
                <Route path="job-cards/create" element={<JobCards />} />
                <Route path="job-cards/edit" element={<JobCards />} />
                <Route path="job-cards/view" element={<JobCards />} />
                <Route path="staff" element={<Staff />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/invoice" element={<InvoiceSettings />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="garage-services" element={<GarageServices />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="biometric" element={<Biometric />} />
                <Route path="whatsapp" element={<WhatsApp />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </GarageProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

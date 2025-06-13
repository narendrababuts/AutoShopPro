
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Staff from '@/pages/Staff';
import JobCardsList from '@/pages/JobCardsList';
import JobCards from '@/pages/JobCards';
import Inventory from '@/pages/Inventory';
import GarageServices from '@/pages/GarageServices';
import Invoices from '@/pages/Invoices';
import Settings from '@/pages/Settings';
import InvoiceSettings from '@/pages/InvoiceSettings';
import Promotions from '@/pages/Promotions';
import WhatsApp from '@/pages/WhatsApp';
import Biometric from '@/pages/Biometric';
import Accounts from '@/pages/Accounts';
import NotFound from '@/pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/job-cards" element={<JobCardsList />} />
      <Route path="/job-cards/create" element={<JobCards />} />
      <Route path="/job-cards/edit" element={<JobCards />} />
      <Route path="/job-cards/view" element={<JobCards />} />
      <Route path="/job-cards/invoice" element={<JobCards />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/garage-services" element={<GarageServices />} />
      <Route path="/invoices" element={<Invoices />} />
      <Route path="/whatsapp" element={<WhatsApp />} />
      <Route path="/promotions" element={<Promotions />} />
      <Route path="/biometric" element={<Biometric />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/invoice" element={<InvoiceSettings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

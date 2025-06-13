
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Car, Wrench, Users, ClipboardList, Package, 
  FileText, MessageSquare, Gift, LayoutDashboard,
  ChevronLeft, ChevronRight, DollarSign, Settings
} from 'lucide-react';

type SidebarItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
};

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { title: 'Accounts', path: '/accounts', icon: <DollarSign size={20} /> },
  { title: 'Staff', path: '/staff', icon: <Users size={20} /> },
  { title: 'Job Cards', path: '/job-cards', icon: <ClipboardList size={20} /> },
  { title: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
  { title: 'Garage Services', path: '/garage-services', icon: <Wrench size={20} /> },
  { title: 'Invoices', path: '/invoices', icon: <FileText size={20} /> },
  { title: 'WhatsApp', path: '/whatsapp', icon: <MessageSquare size={20} /> },
  { title: 'Promotions', path: '/promotions', icon: <Gift size={20} /> },
  { title: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  { title: 'Biometric', path: '/biometric', icon: <Wrench size={20} /> },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "bg-gray-50 h-screen transition-all duration-300 relative border-r border-gray-200",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <Car className="text-blue-600" size={24} />
          {!collapsed && (
            <h1 className="ml-2 text-lg font-bold text-gray-900">AutoShop Pro</h1>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-600 hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed && "justify-center px-2"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import {
  HiOutlineChartBar,
  HiOutlineBookOpen,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineChartBar },
  { to: '/admin/courses', label: 'Courses', icon: HiOutlineBookOpen },
  { to: '/admin/reporting', label: 'Reporting', icon: HiOutlineDocumentReport },
];

const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="flex-1 px-3 py-6 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to === '/admin/courses' && location.pathname.startsWith('/admin/courses/'));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Learnova Backoffice
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
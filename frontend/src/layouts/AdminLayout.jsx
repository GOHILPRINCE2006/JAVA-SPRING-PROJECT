import { NavLink, Outlet } from 'react-router-dom';
import { FolderTree, LayoutDashboard, PackageSearch, ScrollText, Users } from 'lucide-react';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/claims', label: 'Claims', icon: ScrollText },
  { to: '/admin/items', label: 'Items', icon: PackageSearch },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="container-page py-8">
      <nav aria-label="Admin" className="mb-8 flex gap-2 overflow-x-auto border-b border-line pb-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                isActive ? 'bg-harbor-600 text-white' : 'text-ink hover:bg-harbor-50'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

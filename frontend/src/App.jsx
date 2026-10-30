import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { GuestOnly, RequireAdmin, RequireAuth } from './auth/guards';
import Home from './pages/Home';
import Items from './pages/Items';
import ItemDetails from './pages/ItemDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportItem from './pages/ReportItem';
import MyItems from './pages/MyItems';
import MyClaims from './pages/MyClaims';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminOverview from './pages/admin/AdminOverview';
import AdminClaims from './pages/admin/AdminClaims';
import AdminItems from './pages/admin/AdminItems';
import AdminCategories from './pages/admin/AdminCategories';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="items" element={<Items />} />
        <Route path="items/:id" element={<ItemDetails />} />

        <Route element={<GuestOnly />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Signed-in users */}
        <Route element={<RequireAuth />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="report-item" element={<ReportItem />} />
          <Route path="my-items" element={<MyItems />} />
          <Route path="my-claims" element={<MyClaims />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admins only (the backend enforces this too) */}
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="claims" element={<AdminClaims />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

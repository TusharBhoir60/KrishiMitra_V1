import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts & Common
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AppLayout } from './components/layout/AppLayout';
import { BuyerLayout } from './components/layout/BuyerLayout';
import { FarmerLayout } from './components/layout/FarmerLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleRoute } from './components/common/RoleRoute';

// Farmer Pages
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { MyListings } from './pages/farmer/MyListings';
import { AddListing } from './pages/farmer/AddListing';
import { EditListing } from './pages/farmer/EditListing';
import { FarmerOrders } from './pages/farmer/FarmerOrders';
import { FarmerOrderDetail } from './pages/farmer/FarmerOrderDetail';
import { FarmerProfile } from './pages/farmer/FarmerProfile';

// Buyer Pages
import { Marketplace } from './pages/buyer/Marketplace';
import { BuyerCart } from './pages/buyer/BuyerCart';
import { Checkout } from './pages/buyer/Checkout';
import { CropDetail } from './pages/buyer/CropDetail';
import { OrderConfirm } from './pages/buyer/OrderConfirm';
import { BuyerOrders } from './pages/buyer/BuyerOrders';
import { BuyerOrderDetail } from './pages/buyer/BuyerOrderDetail';

// Transporter Pages
import { TransporterDashboard } from './pages/transporter/TransporterDashboard';
import { AvailableJobs } from './pages/transporter/AvailableJobs';
import { ActiveJob } from './pages/transporter/ActiveJob';
import { TripHistory } from './pages/transporter/TripHistory';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDisputes } from './pages/admin/AdminDisputes';

function App() {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-green-50 to-white overflow-x-hidden text-farm-dark">
      <Router>
        <Toaster position="top-center" toastOptions={{ className: 'font-body text-sm' }} />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* ── Farmer Routes (dedicated sidebar layout) ── */}
          <Route element={<ProtectedRoute><FarmerLayout /></ProtectedRoute>}>
            <Route path="/farmer/*" element={
              <RoleRoute role="farmer">
                <Routes>
                  <Route path="dashboard" element={<FarmerDashboard />} />
                  <Route path="listings" element={<MyListings />} />
                  <Route path="listings/new" element={<AddListing />} />
                  <Route path="listings/:id/edit" element={<EditListing />} />
                  <Route path="orders" element={<FarmerOrders />} />
                  <Route path="orders/:id" element={<FarmerOrderDetail />} />
                  <Route path="profile" element={<FarmerProfile />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </RoleRoute>
            } />
          </Route>

          {/* Buyer Routes */}
          <Route element={<ProtectedRoute><BuyerLayout /></ProtectedRoute>}>
            <Route path="/buyer/*" element={
              <RoleRoute role="buyer">
                <Routes>
                  <Route path="dashboard" element={<Navigate to="/buyer/marketplace" replace />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  <Route path="cart" element={<BuyerCart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="crops/:id" element={<CropDetail />} />
                  <Route path="crops/:id/order" element={<OrderConfirm />} />
                  <Route path="orders" element={<BuyerOrders />} />
                  <Route path="orders/:id" element={<BuyerOrderDetail />} />
                  <Route path="profile" element={<FarmerProfile />} />
                  <Route path="*" element={<Navigate to="marketplace" replace />} />
                </Routes>
              </RoleRoute>
            } />
          </Route>

          {/* ── Other Protected App Routes (top-nav + bottom-nav layout) ── */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

            {/* Transporter Routes */}
            <Route path="/transporter/*" element={
              <RoleRoute role="transporter">
                <Routes>
                  <Route path="dashboard" element={<TransporterDashboard />} />
                  <Route path="jobs" element={<AvailableJobs />} />
                  <Route path="jobs/:id" element={<ActiveJob />} />
                  <Route path="history" element={<TripHistory />} />
                  <Route path="profile" element={<FarmerProfile />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </RoleRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <RoleRoute role="admin">
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="disputes" element={<AdminDisputes />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </RoleRoute>
            } />

          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

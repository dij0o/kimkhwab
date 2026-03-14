import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerCreate } from './pages/CustomerCreate';
import { CustomerProfile } from './pages/CustomerProfile';
import { CustomerAppointments } from './pages/CustomerAppointments';
import { CustomerServiceHistory } from './pages/CustomerServiceHistory';
import { Employees } from './pages/Employees';
import { EmployeeCreate } from './pages/EmployeeCreate';
import { Roles } from './pages/Roles';
import { Appointments } from './pages/Appointments';
import { Gallery } from './pages/Gallery';
import { ServiceCategories } from './pages/ServiceCategories';
import { Services } from './pages/Services';
import { Invoices } from './pages/Invoices';
import { InvoiceCreate } from './pages/InvoiceCreate';
import { Bookkeeping } from './pages/Bookkeeping';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { ServerError } from './pages/ServerError';

function App() {
  return (
    <Router>
      <Routes>

        {/* Redirect root URL to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />

        {/* Explicit Error Pages (Accessible without login) */}
        <Route path="/503" element={<ServerError />} />

        {/* --- Protected Routes (Requires Authentication) --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* Dashboard Hub */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* Customer Management */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/create" element={<CustomerCreate />} />
            <Route path="/customers/:id/edit" element={<CustomerCreate />} />
            <Route path="/customers/:id/appointments" element={<CustomerAppointments />} />
            <Route path="/customers/:id/history" element={<CustomerServiceHistory />} />
            {/* The catch-all dynamic :id route must be at the bottom of the customer list */}
            <Route path="/customers/:id" element={<CustomerProfile />} />

            {/* Appointment Management */}
            <Route path="/appointments" element={<Appointments />} />

            {/* Employee Management */}
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/create" element={<EmployeeCreate />} />
            <Route path="/employees/:id/edit" element={<EmployeeCreate />} />
            <Route path="/roles" element={<Roles />} />

            {/* Gallery */}
            <Route path="/gallery" element={<Gallery />} />

            {/* Services */}
            <Route path="/service-categories" element={<ServiceCategories />} />
            <Route path="/services" element={<Services />} />

            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<InvoiceCreate />} />

            {/* Bookkeeping */}
            <Route path="/bookkeeping" element={<Bookkeeping />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />} />

          </Route>
        </Route>

        {/* --- Fallback Route (404 Not Found) --- */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;
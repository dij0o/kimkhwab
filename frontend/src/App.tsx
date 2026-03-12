import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerCreate } from './pages/CustomerCreate';
import { CustomerProfile } from './pages/CustomerProfile';
import { CustomerAppointments } from './pages/CustomerAppointments';
import { CustomerServiceHistory } from './pages/CustomerServiceHistory';
import { Employees } from './pages/Employees';
import { EmployeeCreate } from './pages/EmployeeCreate';
import { Appointments } from './pages/Appointments';
import { Gallery } from './pages/Gallery';
import { ServiceCategories } from './pages/ServiceCategories';
import { Services } from './pages/Services';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />

        {/* --- Protected Routes (Requires Authentication) --- */}
        <Route element={<Layout />}>

          {/* Dashboard Hub */}
          <Route path="/dashboard" element={<Dashboard />} />

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

          {/* Gallery */}
          <Route path="/gallery" element={<Gallery />} />

          {/* Services */}
          <Route path="/service-categories" element={<ServiceCategories />} />
          <Route path="/services" element={<Services />} />
        </Route>

        {/* --- Fallback Route --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';

function App() {
  return (
    <Router>
      <Routes>
        {/* Standalone Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Layout */}
        <Route element={<Layout />}>
          {/* This renders INSIDE the Layout's <Outlet /> */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Future Routes will go here, like: */}
          {/* <Route path="/customers" element={<Customers />} /> */}
          <Route path="/customers" element={<Customers />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
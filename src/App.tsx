import { Navigate, Route, Routes } from 'react-router-dom';
import { useCrm } from './state/store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { LeadDetails } from './pages/LeadDetails';

export function App() {
  const { currentPartner } = useCrm();

  // No real auth in the MVP: the partner choice is the session.
  if (!currentPartner) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:leadId" element={<LeadDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

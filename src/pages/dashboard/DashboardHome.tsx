import { useApp } from '@/contexts/AppContext';
import PatientHome from './PatientHome';
import HealthWorkerHome from './HealthWorkerHome';
import DoctorHome from './DoctorHome';

export default function DashboardHome() {
  const { role } = useApp();
  if (role === 'healthWorker') return <HealthWorkerHome />;
  if (role === 'doctor') return <DoctorHome />;
  return <PatientHome />;
}

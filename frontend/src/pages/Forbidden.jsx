import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '../components/Feedback';

export default function Forbidden() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={ShieldAlert}
        title="You do not have access to this page"
        action={<Link to="/dashboard" className="btn-primary">Back to my dashboard</Link>}
      >
        This area is for administrators only.
      </EmptyState>
    </div>
  );
}

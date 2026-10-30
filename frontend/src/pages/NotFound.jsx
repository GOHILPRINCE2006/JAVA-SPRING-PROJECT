import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback';

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState title="Page not found" action={<Link to="/" className="btn-primary">Go to the home page</Link>}>
        The page you are looking for does not exist or has moved.
      </EmptyState>
    </div>
  );
}

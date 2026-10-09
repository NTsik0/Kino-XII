import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export default function NotFoundPage() {
  return (
    <div className="container" style={{ paddingTop: 60 }}>
      <EmptyState
        icon="film"
        title="Page not found"
        message="The page you are looking for does not exist or has moved."
        action={
          <Link to="/" className="btn btn-primary btn-sm">
            Back to home
          </Link>
        }
      />
    </div>
  );
}

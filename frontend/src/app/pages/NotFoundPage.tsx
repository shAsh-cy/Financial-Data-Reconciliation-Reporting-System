import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div>
      <h2>Not found</h2>
      <p>The page you requested does not exist.</p>
      <Link to="/">Back to dashboard</Link>
    </div>
  );
}


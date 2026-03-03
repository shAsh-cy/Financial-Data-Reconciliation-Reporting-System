import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <div>
      <h2>Unauthorized</h2>
      <p>You don’t have permission to access this page.</p>
      <Link to="/">Back to dashboard</Link>
    </div>
  );
}


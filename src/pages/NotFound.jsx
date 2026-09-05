import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="page-center">
      <section className="placeholder-card">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link className="btn btn-primary" to="/">
          Back to BalanceBoard
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
import { useParams, Link } from "react-router-dom";

function ClientDetailPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Client Details
          </h1>
          <Link to="/clients" className="text-sm text-indigo-600 hover:underline">
            Back to clients
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="text-sm text-slate-600">
          This will show client {id}’s info and entries. We’ll wire this up in the next phase.
        </p>
      </main>
    </div>
  );
}

export default ClientDetailPage;

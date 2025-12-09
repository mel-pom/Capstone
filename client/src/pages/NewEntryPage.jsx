import { useParams, Link } from "react-router-dom";

function NewEntryPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">
            New Entry for Client {id}
          </h1>
          <Link to={`/clients/${id}`} className="text-sm text-indigo-600 hover:underline">
            Back to client
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="text-sm text-slate-600">
          This will be the daily documentation form. We’ll build the real form when your entries API is ready.
        </p>
      </main>
    </div>
  );
}

export default NewEntryPage;

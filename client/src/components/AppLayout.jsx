import { useNavigate } from "react-router-dom";

/**
 * AppLayout component
 * Provides consistent layout wrapper for protected pages with header and logout
 * @param {string} title - Page title displayed in header
 * @param {string} [subtitle] - Optional subtitle displayed below title
 * @param {ReactNode} [actions] - Optional action buttons/elements to display in header
 * @param {ReactNode} children - Page content to render in main section
 */
function AppLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();

  /**
   * Handle user logout
   * Removes token from localStorage and redirects to login page
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Custom action buttons passed as prop */}
            {actions}
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

export default AppLayout;

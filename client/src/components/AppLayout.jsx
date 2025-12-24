import { useNavigate, useLocation } from "react-router-dom";
import { isAdmin, getUserEmail } from "../api";

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
  const location = useLocation();

  /**
   * Handle user logout
   * Removes token from localStorage and redirects to login page
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  /**
   * Navigate to clients list page
   */
  const handleGoToClients = () => {
    navigate("/clients");
  };

  /**
   * Navigate to users management page
   */
  const handleGoToUsers = () => {
    navigate("/users");
  };

  /**
   * Navigate to card management page
   */
  const handleGoToCards = () => {
    navigate("/cards");
  };

  // Check if we're already on the clients page
  const isClientsPage = location.pathname === "/clients";
  // Check if we're already on the users page
  const isUsersPage = location.pathname === "/users";
  // Check if we're already on the cards page
  const isCardsPage = location.pathname === "/cards";
  // Check if current user is admin
  const userIsAdmin = isAdmin();
  // Get current user's email
  const userEmail = getUserEmail();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 sm:gap-3 flex-shrink-0">
              {/* User email display - at the top */}
              {userEmail && (
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  Logged in as {userEmail}
                </span>
              )}
              {/* Buttons row - Custom actions, Clients, Users, and Logout aligned horizontally */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Custom action buttons passed as prop */}
                {actions}
                {/* Clients button - only show if not already on clients page */}
                {!isClientsPage && (
                  <button
                    onClick={handleGoToClients}
                    className="text-xs text-slate-600 hover:text-indigo-600 whitespace-nowrap px-2 py-1 rounded hover:bg-slate-50 transition"
                  >
                    Clients
                  </button>
                )}
                {/* Cards button - only show for admin users and if not already on cards page */}
                {userIsAdmin && !isCardsPage && (
                  <button
                    onClick={handleGoToCards}
                    className="text-xs text-slate-600 hover:text-indigo-600 whitespace-nowrap px-2 py-1 rounded hover:bg-slate-50 transition"
                  >
                    Cards
                  </button>
                )}
                {/* Users button - only show for admin users and if not already on users page */}
                {userIsAdmin && !isUsersPage && (
                  <button
                    onClick={handleGoToUsers}
                    className="text-xs text-slate-600 hover:text-indigo-600 whitespace-nowrap px-2 py-1 rounded hover:bg-slate-50 transition"
                  >
                    Users
                  </button>
                )}
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-red-600 whitespace-nowrap px-2 py-1 rounded hover:bg-slate-50 transition"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6">{children}</main>
    </div>
  );
}

export default AppLayout;

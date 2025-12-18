import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ClientDetailPage from "./pages/ClientDetailPage.jsx";
import NewEntryPage from "./pages/NewEntryPage.jsx";
import NewClientPage from "./pages/NewClientPage.jsx";
import MealEntryPage from "./pages/MealEntryPage.jsx";
import MealHistoryPage from "./pages/MealHistoryPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

/**
 * Main App component
 * Defines all routes for the application
 */
function App() {
  return (
    <Routes>
      {/* Login page - public route */}
      <Route path="/" element={<LoginPage />} />
      {/* Clients list page - protected route */}
      <Route path="/clients" element={<ClientsPage />} />
      {/* New client creation page - protected route (admin only) */}
      <Route path="/clients/new" element={<NewClientPage />} />
      {/* New entry creation page - protected route (more specific, must come before /clients/:id) */}
      <Route path="/clients/:id/new-entry" element={<NewEntryPage />} />
      {/* Meal entry page - protected route (must come before /clients/:id) */}
      <Route path="/clients/:id/meals" element={<MealEntryPage />} />
      {/* Meal history page - protected route (must come before /clients/:id) */}
      <Route path="/clients/:id/meals/history" element={<MealHistoryPage />} />
      {/* Client detail page with entries - protected route */}
      <Route path="/clients/:id" element={<ClientDetailPage />} />
      {/* Users management page - protected route (admin only) */}
      <Route path="/users" element={<UsersPage />} />
    </Routes>
  );
}

export default App;

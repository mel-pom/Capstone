import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ClientDetailPage from "./pages/ClientDetailPage.jsx";
import NewEntryPage from "./pages/NewEntryPage.jsx";

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
      {/* Client detail page with entries - protected route */}
      <Route path="/clients/:id" element={<ClientDetailPage />} />
      {/* New entry creation page - protected route */}
      <Route path="/clients/:id/new-entry" element={<NewEntryPage />} />
    </Routes>
  );
}

export default App;

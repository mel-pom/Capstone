import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ClientDetailPage from "./pages/ClientDetailPage.jsx";
import NewEntryPage from "./pages/NewEntryPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/clients/:id" element={<ClientDetailPage />} />
      <Route path="/clients/:id/new-entry" element={<NewEntryPage />} />
    </Routes>
  );
}

export default App;

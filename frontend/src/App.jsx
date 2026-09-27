import { Navigate, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import GitHubActivity from "./pages/GitHubActivity";
import Intelligence from "./pages/Intelligence";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import SettingsPage from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Verification from "./pages/Verification";
import { useAuth } from "./context/AuthContext";

function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (location.pathname === "/login") {
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }

  let page = <Dashboard />;

  if (location.pathname === "/projects") page = <Projects />;
  if (location.pathname === "/tasks") page = <Tasks />;
  if (location.pathname === "/verification") page = <Verification />;
  if (location.pathname === "/github") page = <GitHubActivity />;
  if (location.pathname === "/team") page = <Team />;
  if (location.pathname === "/intelligence") page = <Intelligence />;
  if (location.pathname === "/settings") page = <SettingsPage />;

  return <AppLayout>{page}</AppLayout>;
}

export default App;
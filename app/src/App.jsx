import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Resource from "./pages/Resource.jsx";
import Operators from "./pages/Operators.jsx";
import Activity from "./pages/Activity.jsx";
import Populate from "./pages/Populate.jsx";
import Approvals from "./pages/Approvals.jsx";

const CAMPUS = [
  ["universities", "Universities"],
  ["departments", "Departments"],
  ["buildings", "Buildings"],
  ["facilities", "Facilities"],
];

const COMMUNITY = [
  ["users", "Users"],
  ["events", "Events"],
  ["study_groups", "Study groups"],
  ["posts", "Posts"],
];

export default function App() {
  const { operator, permissions, status, logout } = useAuth();

  if (status === "loading") {
    return <div className="login-wrap dim">Loading…</div>;
  }
  if (status === "anonymous") {
    return <Login />;
  }

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">
          Campus Connect
          <span>Operator console</span>
        </div>

        <NavLink to="/" end className="nav-item">Overview</NavLink>

        <div className="nav-group">Campus data</div>
        {CAMPUS.map(([key, label]) => (
          <NavLink key={key} to={`/r/${key}`} className="nav-item">{label}</NavLink>
        ))}

        <div className="nav-group">Community</div>
        {COMMUNITY.map(([key, label]) => (
          <NavLink key={key} to={`/r/${key}`} className="nav-item">{label}</NavLink>
        ))}

        <div className="nav-group">Data</div>
        <NavLink to="/approvals" className="nav-item">Approvals</NavLink>
        <NavLink to="/populate" className="nav-item">Populate</NavLink>

        <div className="nav-group">System</div>
        <NavLink to="/activity" className="nav-item">Activity</NavLink>
        {/* Only owners can reach the operators API, so hide what would 403. */}
        {permissions?.manageOperators && (
          <NavLink to="/operators" className="nav-item">Operators</NavLink>
        )}
      </nav>

      <div className="main">
        <header className="topbar">
          <span className="dim" style={{ fontSize: 13 }}>
            {permissions?.write ? "" : "Read-only access"}
          </span>
          <div className="who">
            <span>
              {operator.first_name} {operator.last_name}
              <span className={`pill ${operator.role === "owner" ? "owner" : ""}`} style={{ marginLeft: 8 }}>
                {operator.role}
              </span>
            </span>
            <button className="sm" onClick={logout}>Sign out</button>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/r/:resource" element={<Resource />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/populate" element={<Populate />} />
            <Route
              path="/operators"
              element={
                permissions?.manageOperators ? <Operators /> : <Navigate to="/" replace />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

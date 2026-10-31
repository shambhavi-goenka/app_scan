import { useState } from "react";
import { apiRequest } from "./api";
import "./App.css";
import Projects from "./Projects";
import Users from "./Users";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [mode, setMode] = useState("login");
  const [activeView, setActiveView] = useState("projects");

  const [form, setForm] = useState({
    organizationName: "",
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/auth/register" : "/auth/login";

      const payload =
        mode === "register"
          ? form
          : {
              email: form.email,
              password: form.password,
            };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setActiveView("projects");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setActiveView("projects");
    setMode("login");
  }

  if (token && user) {
    return (
      <main className="container">
        <h1>SecureSaaS</h1>
        <p className="subtitle">Multi-tenant project management</p>

        <section className="panel">
          <div className="user-header">
            <div>
              <h2>Welcome, {user.name}</h2>
              <p>{user.email}</p>
              <p>
                Role: <strong>{user.role}</strong>
              </p>
            </div>

            <button onClick={logout}>Log out</button>
          </div>
        </section>

        <nav className="app-navigation">
          <button
            className={activeView === "projects" ? "active" : "secondary"}
            onClick={() => setActiveView("projects")}
          >
            Projects
          </button>

          {user.role === "admin" && (
            <button
              className={activeView === "users" ? "active" : "secondary"}
              onClick={() => setActiveView("users")}
            >
              User Management
            </button>
          )}
        </nav>

        {activeView === "projects" && <Projects token={token} />}

        {activeView === "users" && user.role === "admin" && (
          <Users token={token} />
        )}
      </main>
    );
  }

  return (
    <main className="container">
      <h1>SecureSaaS</h1>
      <p className="subtitle">Multi-tenant project management</p>

      <section className="panel">
        <h2>{mode === "login" ? "Log in" : "Create an organization"}</h2>

        {mode === "register" && (
          <div className="registration-info">
            <h3>Start your organization</h3>
            <p>
              Register your organization and create its first administrator
              account. You will be assigned the Admin role automatically.
            </p>
            <p>
              Once registered, you can use User Management to create
              additional user accounts.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <input
                name="organizationName"
                placeholder="Organization name"
                value={form.organizationName}
                onChange={updateField}
                required
              />

              <input
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={updateField}
                required
              />
            </>
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={updateField}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={updateField}
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create organization and admin account"}
          </button>
        </form>

        <button
          className="secondary"
          onClick={() => {
            setError("");
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login"
            ? "Register a new organization"
            : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}
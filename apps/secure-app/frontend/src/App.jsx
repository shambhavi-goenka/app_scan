import { useState } from "react";
import { apiRequest } from "./api";
import "./App.css";
import Projects from "./Projects";

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [mode, setMode] = useState("login");
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
  }

  if (token && user) {
  return (
    <main className="container">
      <h1>SecureSaaS</h1>

      <section className="panel">
        <div className="user-header">
          <div>
            <h2>Welcome, {user.name}</h2>
            <p>{user.email}</p>
            <p>Role: {user.role}</p>
          </div>

          <button onClick={logout}>Log out</button>
        </div>
      </section>

      <Projects token={token} />
    </main>
  );
}

  return (
    <main className="container">
      <h1>SecureSaaS</h1>
      <p className="subtitle">Multi-tenant project management</p>

      <section className="panel">
        <h2>{mode === "login" ? "Log in" : "Create an organization"}</h2>

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
                : "Register"}
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
            ? "Create a new organization"
            : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}

import { useState } from "react";
import { apiRequest } from "./api";

export default function Users({ token }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function createUser(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest(
        "/users",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
        token
      );

      setMessage(
        `Account created for ${data.user.name}. Assigned role: ${data.user.role}.`
      );

      setForm({
        name: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="workspace">
      <h2>User Management</h2>

      <p>
        Create additional accounts for your organization.
        New accounts are assigned the standard User role.
      </p>

      <form onSubmit={createUser} className="create-form">
        <h3>Create a user account</h3>

        <input
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={updateField}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={updateField}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Temporary password (minimum 12 characters)"
          value={form.password}
          onChange={updateField}
          minLength={12}
          maxLength={128}
          required
        />

        <p>
          <strong>Assigned role:</strong> User
        </p>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create user"}
        </button>
      </form>
    </section>
  );
}

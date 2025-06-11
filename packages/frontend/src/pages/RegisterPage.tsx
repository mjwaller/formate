import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Registration failed");
        return;
      }
      const { token } = await res.json();
      setToken(token);
      navigate("/");
    } catch {
      setError("Server error");
    }
  }

  return (
    <main>
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <label>Username <input value={username} onChange={e => setUsername(e.target.value)} required /></label><br />
        <label>Password <input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label><br />
        <button type="submit">Register</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </main>
  );
}

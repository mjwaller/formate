import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Login failed");
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
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <label>Username <input value={username} onChange={e => setUsername(e.target.value)} required /></label><br />
        <label>Password <input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label><br />
        <button type="submit">Log In</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </main>
  );
}

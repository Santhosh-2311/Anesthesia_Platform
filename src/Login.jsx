import { useState } from "react"

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault() // ✅ prevents refresh
    if (!email || !password) return

    // ✅ your existing dummy login logic (keep role logic same if you had it)
    const role = email.toLowerCase().includes("admin") ? "ADMIN" : "CLINICIAN"

    onLogin({
      email,
      role,
      name: role === "ADMIN" ? "Admin User" : "Clinician User"
    })
  }

  return (
    <div className="container" style={{ maxWidth: 900, margin: "40px auto" }}>
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Login</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <button type="submit" style={{ padding: "10px 18px" }}>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

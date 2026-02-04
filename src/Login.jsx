import { useState } from "react"

function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = () => {
  if (!email || !password) return

  // MOCK ROLE LOGIC (TEMPORARY)
  if (email.toLowerCase().includes("admin")) {
    onLogin({
      name: "Admin User",
      role: "ADMIN"
    })
  } else {
    onLogin({
      name: "Clinician",
      role: "CLINICIAN"
    })
  }
}
  return (
  <div className="container">
    <h2>Login</h2>

    <label>Email</label>
    <input
      placeholder="Enter email"
      value={email}
      onChange={e => setEmail(e.target.value)}
    />

    <label>Password</label>
    <input
      type="password"
      placeholder="Enter password"
      value={password}
      onChange={e => setPassword(e.target.value)}
    />

    <button onClick={handleLogin}>Login</button>
  </div>
)
}

export default Login

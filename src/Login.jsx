import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = () => {
    if (!email || !password) return

    // TEMP mock auth: decide role from email
    const isAdmin = email.toLowerCase().includes("admin")

    const user = {
      name: isAdmin ? "Admin User" : "Clinician",
      role: isAdmin ? "ADMIN" : "CLINICIAN",
      email
    }

    // ✅ mark session + store user details
    localStorage.setItem("loggedIn", "1")
    localStorage.setItem("user", JSON.stringify(user))

    // ✅ go to platform home
    navigate("/groups")
  }

  return (
    <div className="container">
      <h2>Login</h2>

      <label>Email</label>
      <input
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label>Password</label>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  )
}

export default Login

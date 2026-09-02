import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, Lock, Mail } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e) {
    e.preventDefault()

    // Simple demo login logic
    if (!email || !password) {
      alert("Please enter email and password")
      return
    }

    // Store login state
    localStorage.setItem("loggedIn", "1")
    localStorage.setItem("user", "Clinician")

    navigate("/dashboard")
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginHeader">
          <div className="loginIconWrapper">
            <Activity className="loginIcon" size={28} />
          </div>
          <h2>Anesthesia Workstation</h2>
          <p className="loginSubtitle">Clinical Telemetry & Monitoring System</p>
        </div>

        <form onSubmit={handleSubmit} className="loginForm">
          <div className="formGroup">
            <label htmlFor="login-email">Email</label>
            <div className="inputWrapper">
              <Mail className="fieldIcon" size={18} />
              <input
                id="login-email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="formGroup">
            <label htmlFor="login-password">Password</label>
            <div className="inputWrapper">
              <Lock className="fieldIcon" size={18} />
              <input
                id="login-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="loginBtn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}


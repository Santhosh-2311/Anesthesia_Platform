import { useState } from "react"
import { useNavigate } from "react-router-dom"

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

    navigate("/groups")
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="formGroup">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="loginBtn">
            Login
          </button>
        </form>
      </div>
    </div>
  )
}


import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../config/firebase.js'

const ADMIN_UID = 'PuosNYo4JCOhP8vJCSHcSAxQ9Rt2'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  async function handleLogin(event) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth)
        setMessage('Access denied. Ei account admin noy.')
        return
      }

      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      console.error('Admin login error:', error.code || error.message)

      setMessage(
        'Login failed. Email/password check koro, tarpor abar try koro.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login">
      <h1>Admin Login</h1>
      <p>Portfolio Dashboard-e login koro</p>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email address"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>

      {message && <p role="alert">{message}</p>}
    </main>
  )
}

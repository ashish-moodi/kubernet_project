import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function App({ keycloak, initialAuthenticated }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  const login = () => keycloak.login()

  const logout = () =>
    keycloak.logout({
      redirectUri: window.location.origin,
    })

  const getProfile = async () => {
    setError('')

    try {
      await keycloak.updateToken(30)

      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`)
      }

      setProfile(await response.json())
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Arial' }}>
      <h1>Kubernetes DevOps Platform</h1>
      <p>React + Express + Keycloak + Kubernetes</p>

      <h2>Authentication</h2>

      {authenticated ? (
        <>
          <p>
            Logged in as:{' '}
            <strong>
              {keycloak.tokenParsed?.preferred_username || 'User'}
            </strong>
          </p>

          <button onClick={getProfile}>
            Call Protected API
          </button>

          <button onClick={logout} style={{ marginLeft: 12 }}>
            Logout
          </button>

          {profile && (
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          )}
        </>
      ) : (
        <button onClick={login}>Login with Keycloak</button>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  )
}

export default App
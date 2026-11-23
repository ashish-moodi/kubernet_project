import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import keycloak from './keycloak.js'
import './index.css'

const root = createRoot(document.getElementById('root'))

keycloak
  .init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    root.render(
      <StrictMode>
        <App
          keycloak={keycloak}
          initialAuthenticated={authenticated}
        />
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Keycloak initialization failed:', error)
    root.render(<p>Authentication service unavailable.</p>)
  })
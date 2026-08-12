import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { backendWarmupService } from './infrastructure/health/BackendWarmupService'

// Start before React mounts. This runs once per page load and is not duplicated
// by StrictMode; authenticated requests reuse the same in-flight check.
void backendWarmupService.start()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FitnessApp } from './app/FitnessApp.tsx'
import './fitness.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FitnessApp />
  </StrictMode>,
)

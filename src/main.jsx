import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { seedPresets } from './utils/storage'
import { PRESET_COURSES } from './data/presets'

seedPresets(PRESET_COURSES);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

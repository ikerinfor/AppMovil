import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5001/api';  // Ajusta la URL según tu backend

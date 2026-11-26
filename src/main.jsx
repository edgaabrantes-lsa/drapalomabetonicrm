import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Tema nativo noturno; preferência salva é aplicada antes da primeira pintura
try {
  const tema = localStorage.getItem('pb-theme') === 'light' ? 'light' : 'dark'
  document.documentElement.classList.add(tema)
  document.documentElement.style.colorScheme = tema
} catch {
  document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = 'dark'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
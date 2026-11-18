// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext({ theme: 'dark' })

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('kmrl-theme', 'dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

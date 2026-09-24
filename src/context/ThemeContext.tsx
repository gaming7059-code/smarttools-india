import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'smarttools_theme'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Default to 'light' for first-time visitors as required
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme
      }
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')

    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#0b0f19')
      }
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#2563eb')
      }
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage may be disabled or restricted in private browsing
    }
  }, [theme])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

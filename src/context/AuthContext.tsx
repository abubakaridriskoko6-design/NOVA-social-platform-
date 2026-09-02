import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCurrentUser, loginUser, logoutUser, registerUser, type AuthUser } from '../lib/auth'

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string, communityRulesAccepted?: boolean) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshCurrentUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCurrentUser = useCallback(async () => {
    setIsLoading(true)

    try {
      const nextUser = await getCurrentUser()
      setUser(nextUser)
      return nextUser
    } catch (error) {
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCurrentUser()
  }, [refreshCurrentUser])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser({ email, password })
    setUser(response.user)
    setIsLoading(false)
    return response.user
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, communityRulesAccepted = true) => {
    const response = await registerUser({ name, email, password, communityRulesAccepted })
    setUser(response.user)
    setIsLoading(false)
    return response.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [user, isLoading, login, register, logout, refreshCurrentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

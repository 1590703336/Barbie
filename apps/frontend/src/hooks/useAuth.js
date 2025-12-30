import useStore from '../store/store'

export function useAuth() {
  return useStore((state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    login: state.login,
    logout: state.logout,
  }))
}


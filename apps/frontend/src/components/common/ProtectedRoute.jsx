import { Navigate, useLocation } from 'react-router-dom'
import useStore from '../../store/store'

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute


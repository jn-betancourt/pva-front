import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NetworkProvider } from './context/NetworkContext'
import { TurnoProvider } from './context/TurnoContext'
import { AppRouter } from './router/AppRouter'

export function App() {
  return (
    <BrowserRouter>
      <NetworkProvider>
        <AuthProvider>
          <TurnoProvider>
            <CartProvider>
              <AppRouter />
            </CartProvider>
          </TurnoProvider>
        </AuthProvider>
      </NetworkProvider>
    </BrowserRouter>
  )
}

export default App

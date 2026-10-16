import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import SetTimePage from './pages/SetTimePage.tsx'
import SignInPage from './pages/SignInPage.tsx'
import SignUpPage from './pages/SignUpPage.tsx'
import ProtectedRoute from './auth/ProtectedRoute.tsx'


function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          { /* public routes */}
          <Route
            path="/signin"
            element={<SignInPage />}
          />
          <Route
            path="/signup"
            element={<SignUpPage />}
          />

          { /* protected routes */}
          <Route
            element={<ProtectedRoute />}>
            <Route
              path="/"
              element={<SetTimePage />}
            />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

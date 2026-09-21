import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import RouteFallback from "./components/RouteFallback/RouteFallback";

// Routes are code-split so the landing page no longer ships the PDF manager,
// the chart library and every other screen to a first-time visitor. Home is
// eager because it is the first paint for most visitors.
import Home from "./pages/Home/Home";

const Login = lazy(() => import("./pages/Login/Login"));
const Register = lazy(() => import("./pages/Register/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/Forgotpassword/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks/Tasks"));
const Companion = lazy(() => import("./pages/Companion/Companion"));
const Internship = lazy(() => import("./pages/Internship/Internship"));
const PDFManager = lazy(() => import("./pages/PDFManager/PDFManager"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const AIScheduler = lazy(() => import("./pages/Tasks/AIScheduler"));
const Teams = lazy(() => import("./pages/Teams/Teams"));
const TeamDetails = lazy(() => import("./pages/Teams/TeamDetails"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

// The boundary lives inside the router so its fallback can link elsewhere, and
// resets on navigation so a broken route doesn't poison the rest of the app.
function RoutedErrorBoundary({ children }) {
  const location = useLocation();

  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <BrowserRouter>
      <RoutedErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />
            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/panda"
              element={
                <ProtectedRoute>
                  <Companion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companion"
              element={
                <ProtectedRoute>
                  <Companion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/internship"
              element={
                <ProtectedRoute>
                  <Internship />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pdf-manager"
              element={
                <ProtectedRoute>
                  <PDFManager />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* AI Scheduler */}
            <Route
              path="/ai-scheduler"
              element={
                <ProtectedRoute>
                  <AIScheduler />
                </ProtectedRoute>
              }
            />

            {/* Teams Collaboration */}
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:teamId"
              element={
                <ProtectedRoute>
                  <TeamDetails />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </Suspense>
      </RoutedErrorBoundary>
    </BrowserRouter>
  );
}

export default App;

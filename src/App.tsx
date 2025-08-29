// src/App.tsx - Updated with Profile Information route
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { authAPI } from "./services/api";

// Layout
import Layout from "./components/Layout/Layout";

// Auth Components
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";

// Protected Components
import Dashboard from "./components/Dashboard/Dashboard";
import StatesList from "./components/States/StatesList";
import StateForm from "./components/States/StateForm";
import UsersList from "./components/Users/UsersList";
import UserForm from "./components/Users/UserForm";
import PermissionsManagement from "./components/Users/PermissionsManagement";

// Hospital Components
import HospitalsList from "./components/Hospitals/HospitalsList";
import HospitalForm from "./components/Hospitals/HospitalForm";
import HospitalDetails from "./components/Hospitals/HospitalDetails";

// Doctor Components
import DoctorsList from "./components/Doctors/DoctorsList";
import DoctorForm from "./components/Doctors/DoctorForm";
import DoctorDetails from "./components/Doctors/DoctorDetails";

// Portfolio Components
import PortfoliosList from "./components/Portfolios/PortfolioList";
import PortfolioForm from "./components/Portfolios/PortfolioForm";
import PortfolioDetails from "./components/Portfolios/PortfolioDetails";

// Settings Components
import Settings from "./components/Settings/Settings";
import ChangePassword from "./components/Settings/ChangePassword";
import ProfileInformation from "./components/Settings/ProfileInformation";

// Principle Components
import PrinciplesList from "./components/Principles/PrinciplesList";
import PrincipleForm from "./components/Principles/PrincipleForm";
import PrincipleDetails from "./components/Principles/PrincipleDetails";

// Product Components
import ProductsList from "./components/Products/ProductList";
import ProductForm from "./components/Products/ProductForm";
import ProductDetails from "./components/Products/ProductDetails";

// Employee Visits Components
import EmployeeVisitsList from "./components/EmployeeVisits/EmployeeVisitsList";
import EmployeeVisitForm from "./components/EmployeeVisits/EmployeeVisitForm";
import EmployeeVisitDetails from "./components/EmployeeVisits/EmployeeVisitDetails";

// HTD Candidate Components
import CandidatesList from "./components/HTD/Candidates/CandidatesList";
import CandidateForm from "./components/HTD/Candidates/CandidateForm";
import CandidateDetail from "./components/HTD/Candidates/CandidateDetail";

// HTD Training Components
import TrainingsList from "./components/HTD/Trainings/TrainingsList";
import TrainingForm from "./components/HTD/Trainings/TrainingForm";
import TrainingDetail from "./components/HTD/Trainings/TrainingDetail";

// HTD Payment Components
import PaymentsList from "./components/HTD/Payments/PaymentsList";
import PaymentForm from "./components/HTD/Payments/PaymentForm";
import PaymentDetail from "./components/HTD/Payments/PaymentDetail";

// HTD Dashboard Component
import HTDDashboard from "./components/HTD/Dashboard/HTDDashboard";

// 404 Component
import NotFound from "./components/Common/NotFound";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/htd/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated, setUser, setPermissions, setLoading } =
    useAuthStore();

  useEffect(() => {
    // Check if user is authenticated on app load
    const initializeAuth = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          const response = await authAPI.getProfile();
          const { user, permissions } = response.data;
          setUser(user);
          setPermissions(permissions);
        } catch (error) {
          console.error("Failed to get user profile:", error);
          // Clear auth state if profile fetch fails
          useAuthStore.getState().logout();
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [isAuthenticated, setUser, setPermissions, setLoading]);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="App">
        <Routes>
          {/* Public Routes */}
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
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/htd/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Hospital Routes */}
            <Route path="hospitals" element={<HospitalsList />} />
            <Route path="hospitals/new" element={<HospitalForm />} />
            <Route path="hospitals/:id" element={<HospitalDetails />} />
            <Route path="hospitals/:id/edit" element={<HospitalForm />} />

            {/* Doctor Routes */}
            <Route path="doctors" element={<DoctorsList />} />
            <Route path="doctors/new" element={<DoctorForm />} />
            <Route path="doctors/:id" element={<DoctorDetails />} />
            <Route path="doctors/:id/edit" element={<DoctorForm />} />

            {/* Portfolio Routes */}
            <Route path="portfolios" element={<PortfoliosList />} />
            <Route path="portfolios/new" element={<PortfolioForm />} />
            <Route path="portfolios/:id" element={<PortfolioDetails />} />
            <Route path="portfolios/:id/edit" element={<PortfolioForm />} />

            {/* States Routes - Moved to Settings/Masters */}
            <Route path="states" element={<StatesList />} />
            <Route path="states/new" element={<StateForm />} />
            <Route path="states/:id" element={<StatesList />} />
            <Route path="states/:id/edit" element={<StateForm />} />

            {/* Users Routes */}
            <Route path="users" element={<UsersList />} />
            <Route path="users/new" element={<UserForm />} />
            <Route path="users/:id/edit" element={<UserForm />} />
            <Route
              path="users/:id/permissions"
              element={<PermissionsManagement />}
            />

            {/* Settings Routes */}
            <Route path="settings" element={<Settings />} />
            <Route
              path="settings/change-password"
              element={<ChangePassword />}
            />
            <Route path="settings/profile" element={<ProfileInformation />} />
            <Route
              path="settings/notifications"
              element={
                <div className="p-6 text-center text-gray-500">
                  Notification settings coming soon...
                </div>
              }
            />
            <Route
              path="settings/permissions"
              element={
                <div className="p-6 text-center text-gray-500">
                  Permission management coming soon...
                </div>
              }
            />
            <Route
              path="settings/appearance"
              element={
                <div className="p-6 text-center text-gray-500">
                  Appearance settings coming soon...
                </div>
              }
            />
            <Route
              path="settings/language"
              element={
                <div className="p-6 text-center text-gray-500">
                  Language settings coming soon...
                </div>
              }
            />

            {/* Principle Routes */}
            <Route path="principles" element={<PrinciplesList />} />
            <Route path="principles/new" element={<PrincipleForm />} />
            <Route path="principles/:id" element={<PrincipleDetails />} />
            <Route path="principles/:id/edit" element={<PrincipleForm />} />

            {/* Product Routes */}
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="products/:id/edit" element={<ProductForm />} />

            {/* Employee Visits Routes */}
            <Route path="logistic-logs" element={<EmployeeVisitsList />} />
            <Route path="logistic-logs/new" element={<EmployeeVisitForm />} />
            <Route
              path="logistic-logs/:id"
              element={<EmployeeVisitDetails />}
            />
            <Route
              path="logistic-logs/:id/edit"
              element={<EmployeeVisitForm />}
            />

            {/* HTD Dashboard Route */}
            <Route path="htd/dashboard" element={<HTDDashboard />} />

            {/* HTD Candidate Routes */}
            <Route path="htd/candidates" element={<CandidatesList />} />
            <Route path="htd/candidates/new" element={<CandidateForm />} />
            <Route path="htd/candidates/:id" element={<CandidateDetail />} />
            <Route path="htd/candidates/:id/edit" element={<CandidateForm />} />

            {/* HTD Training Routes */}
            <Route path="htd/trainings" element={<TrainingsList />} />
            <Route path="htd/trainings/new" element={<TrainingForm />} />
            <Route path="htd/trainings/:id" element={<TrainingDetail />} />
            <Route path="htd/trainings/:id/edit" element={<TrainingForm />} />

            {/* HTD Payment Routes */}
            <Route path="htd/payments" element={<PaymentsList />} />
            <Route path="htd/payments/new" element={<PaymentForm />} />
            <Route path="htd/payments/:id" element={<PaymentDetail />} />
            <Route path="htd/payments/:id/edit" element={<PaymentForm />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;

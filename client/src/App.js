import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// Material-UI imports
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import setAuthToken from "./utils/setAuthToken";

// Layout Components
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/auth/Login";
import Layout from "./components/layout/Layout";

// User Components
import Users from "./components/users/Users";
import UserDetail from "./components/users/UserDetail";
import UserForm from "./components/users/UserForm";
import Profile from "./components/users/Profile";

// Member Components
import Members from "./components/members/Members";
import MemberDetail from "./components/members/MemberDetail";

// Membership Components
import Memberships from "./components/memberships/Memberships";
import MembershipDetail from "./components/memberships/MembershipDetail";

// Payment Components
import Payments from "./components/payments/Payments";
import PaymentDetail from "./components/payments/PaymentDetail";

// Attendance Components
import Attendance from "./components/attendance/Attendance";
import AttendanceDetail from "./components/attendance/AttendanceDetail";

// Classes Components
import Classes from "./components/classes/Classes";
import ClassDetail from "./components/classes/ClassDetail";
import ClassSessions from "./components/classes/ClassSessions";
import SessionDetail from "./components/classes/SessionDetail";

// Staff Components
import Staff from "./components/staff/Staff";
import StaffDetail from "./components/staff/StaffDetail";

// Gym Components (for multi-tenancy)
import Gyms from "./components/gyms/Gyms";
import GymUsers from "./components/gyms/GymUsers";

// Reports Component
import Reports from "./components/reports/Reports";

// Settings Component
import Settings from "./components/settings/Settings";

// Expenses Components
import Expenses from "./components/expenses/Expenses";
import ExpenseDetail from "./components/expenses/ExpenseDetail";
import ExpenseSummary from "./components/expenses/ExpenseSummary";

// Theme Test Component
import ThemeTest from "./components/theme/ThemeTest";

// Context
import AuthState from "./context/auth/AuthState";
import AlertState from "./context/alert/AlertState";
import ReportState from "./context/report/ReportState";
import SettingsState from "./context/settings/SettingsState";
import ThemeState from "./context/theme/ThemeState";
import PrivateRoute from "./components/routing/PrivateRoute";

// Theme configuration is now handled by ThemeState

// Initial setup - AuthState will handle token validation
const App = () => {
  return (
    <AuthState>
      <AlertState>
        <ReportState>
          <SettingsState>
            <ThemeState>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/"
                      element={
                        <PrivateRoute>
                          <Layout />
                        </PrivateRoute>
                      }
                    >
                      <Route index element={<Dashboard />} />

                      {/* User Routes */}
                      <Route path="users" element={<Users />} />
                      <Route path="users/add" element={<UserForm />} />
                      <Route path="users/edit/:id" element={<UserForm />} />
                      <Route path="users/:id" element={<UserDetail />} />
                      <Route path="profile" element={<Profile />} />

                      {/* Member Routes */}
                      <Route path="members" element={<Members />} />
                      <Route path="members/:id" element={<MemberDetail />} />

                      {/* Membership Routes */}
                      <Route path="memberships" element={<Memberships />} />
                      <Route
                        path="memberships/:id"
                        element={<MembershipDetail />}
                      />

                      {/* Payment Routes */}
                      <Route path="payments" element={<Payments />} />
                      <Route path="payments/new" element={<PaymentDetail />} />
                      <Route
                        path="payments/:id/edit"
                        element={<PaymentDetail />}
                      />
                      <Route path="payments/:id" element={<PaymentDetail />} />

                      {/* Attendance Routes */}
                      <Route path="attendance" element={<Attendance />} />
                      <Route
                        path="attendance/new"
                        element={<AttendanceDetail />}
                      />
                      <Route
                        path="attendance/:id/edit"
                        element={<AttendanceDetail />}
                      />
                      <Route
                        path="attendance/:id"
                        element={<AttendanceDetail />}
                      />

                      {/* Classes Routes */}
                      <Route path="classes" element={<Classes />} />
                      <Route
                        path="classes/new"
                        element={<ClassDetail key="new-class" />}
                      />
                      <Route
                        path="classes/:id/edit"
                        element={<ClassDetail key="edit-class" />}
                      />
                      <Route
                        path="classes/:id/sessions"
                        element={<ClassSessions />}
                      />
                      <Route
                        path="classes/sessions/:id"
                        element={<SessionDetail />}
                      />
                      <Route
                        path="classes/:id"
                        element={<ClassDetail key="view-class" />}
                      />

                      {/* Staff Routes */}
                      <Route path="staff" element={<Staff />} />
                      <Route
                        path="staff/new"
                        element={<StaffDetail key="new-staff" />}
                      />
                      <Route
                        path="staff/:id/edit"
                        element={<StaffDetail key="edit-staff" />}
                      />
                      <Route
                        path="staff/:id"
                        element={<StaffDetail key="view-staff" />}
                      />

                      {/* Gym Management Routes (Superadmin only) */}
                      <Route path="gyms" element={<Gyms />} />
                      <Route path="gyms/:id/users" element={<GymUsers />} />

                      {/* Reports Route */}
                      <Route path="reports" element={<Reports />} />

                      {/* Settings Route */}
                      <Route path="settings" element={<Settings />} />

                      {/* Expenses Routes */}
                      <Route path="expenses" element={<Expenses />} />
                      <Route path="expenses/new" element={<ExpenseDetail />} />
                      <Route path="expenses/:id/edit" element={<ExpenseDetail />} />
                      <Route path="expenses/:id" element={<ExpenseDetail />} />
                      <Route path="expenses/summary" element={<ExpenseSummary />} />

                      {/* Theme Test Route */}
                      <Route path="theme-test" element={<ThemeTest />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </LocalizationProvider>
            </ThemeState>
          </SettingsState>
        </ReportState>
      </AlertState>
    </AuthState>
  );
};

export default App;

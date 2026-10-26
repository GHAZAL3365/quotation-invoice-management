import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Clients from "./pages/Clients";
import Invoices from "./pages/Invoices";
import InvoiceDetails from "./pages/InvoiceDetails";
import InvoiceForm from "./pages/InvoiceForm";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import QuotationDetails from "./pages/QuotationDetails";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />

              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetails />} />

              <Route path="/quotations" element={<Quotations />} />
              <Route path="/quotations/:id" element={<QuotationDetails />} />

              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/clients" element={<Clients />} />
                <Route path="/invoices/new" element={<InvoiceForm />} />
                <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
                <Route path="/quotations/new" element={<CreateQuotation />} />
                <Route
                  path="/quotations/:id/edit"
                  element={<CreateQuotation />}
                />
                <Route path="/payments" element={<Payments />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Catch-all redirect to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

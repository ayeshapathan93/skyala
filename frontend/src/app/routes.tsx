import { createBrowserRouter } from "react-router";
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import InventoryPage from "./pages/InventoryPage";
import CreateBillPage from "./pages/CreateBillPage";
import BillHistoryPage from "./pages/BillHistoryPage";
import BillDetailsPage from "./pages/BillDetailsPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import RouteErrorPage from "./pages/RouteErrorPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LoginPage /> }
    ]
  },
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "customers/:id", element: <CustomerDetailsPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "products/:id", element: <ProductDetailsPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "bills/create", element: <CreateBillPage /> },
      { path: "bills", element: <BillHistoryPage /> },
      { path: "bills/:id", element: <BillDetailsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  }
]);

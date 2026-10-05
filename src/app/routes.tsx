import { createBrowserRouter } from "react-router";
import HomePage from "../pages/HomePage";
import ExplorePage from "../pages/ExplorePage";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import OrdersPage from "../pages/OrdersPage";
import MessagesPage from "../pages/MessagesPage";
import ServicePage from "../pages/ServicePage";
import ClientDashboardPage from "../pages/ClientDashboardPage";
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/explorar", Component: ExplorePage },
  { path: "/servico/:id", Component: ServicePage },
  { path: "/entrar", element: <AuthPage mode="login" /> },
  { path: "/cadastro", element: <AuthPage mode="register" /> },
  { Component: ProtectedRoute, children: [
  { path: "/app", Component: DashboardPage },
  { path: "/app/cliente", Component: ClientDashboardPage },
  { path: "/app/pedidos", Component: OrdersPage },
  { path: "/app/mensagens", Component: MessagesPage },
  ] },
  { path: "*", Component: HomePage },
]);

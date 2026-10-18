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
import ManagementPage from "../pages/ManagementPage";
import ProfilePage from "../pages/ProfilePage";
import RecoveryPage from "../pages/RecoveryPage";
import HelpPage from "../pages/HelpPage";
import RouteErrorPage from "../pages/RouteErrorPage";
import PageFrame from "../components/PageFrame";

export const router = createBrowserRouter([{ element: <PageFrame />, errorElement: <RouteErrorPage />, children: [
  { path: "/", Component: HomePage },
  { path: "/explorar", Component: ExplorePage },
  { path: "/servico/:id", Component: ServicePage },
  { path: "/perfil/:id", Component: ProfilePage },
  { path: "/entrar", element: <AuthPage mode="login" /> },
  { path: "/recuperar-senha", Component: RecoveryPage },
  { path: "/ajuda", Component: HelpPage },
  { path: "/cadastro", element: <AuthPage mode="register" /> },
  { Component: ProtectedRoute, children: [
  { path: "/app", Component: DashboardPage },
  { path: "/app/cliente", Component: ClientDashboardPage },
  { path: "/app/pedidos", Component: OrdersPage },
  { path: "/app/mensagens", Component: MessagesPage },
  { path: "/app/perfil", element: <ManagementPage key="perfil" kind="perfil" /> },
  { path: "/app/servicos", element: <ManagementPage key="servicos" kind="servicos" /> },
  { path: "/app/portfolio", element: <ManagementPage key="portfolio" kind="portfolio" /> },
  { path: "/app/notificacoes", element: <ManagementPage key="notificacoes" kind="notificacoes" /> },
  { path: "/app/creditos", element: <ManagementPage key="creditos" kind="creditos" /> },
  ] },
  { path: "*", element: <RouteErrorPage notFound /> },
] }]);

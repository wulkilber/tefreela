import { RouterProvider } from "react-router";
import { router } from "./routes";
import Toasts from "../components/Toasts";

export default function App() {
  return <><RouterProvider router={router} /><Toasts /></>;
}

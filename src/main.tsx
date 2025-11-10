// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";


import App from "./App";
import Login from "./pages/login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import EditProfile from "./pages/Editprofile";
import CreateWork from "./pages/CreateWork";
import WorkView from "./pages/WorkView";
import CreatorProfile from "./pages/CreatorProfile";
import AdminPage from "./pages/AdminPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

//  Prefix API calls ใน production ถ้าเซ็ต VITE_API_BASE
(() => {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (!API_BASE) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const onlyRewrite = (url: string) => url.startsWith("/auth") || url.startsWith("/works");

      if (typeof input === "string") {
        const url = input;
        if (url.startsWith("/") && onlyRewrite(url)) {
          return originalFetch(`${API_BASE}${url}`, init);
        }
        return originalFetch(input, init);
      } else if (input instanceof Request) {
        const url = input.url;
        const u = new URL(url, window.location.origin);
        if (u.origin === window.location.origin && onlyRewrite(u.pathname)) {
          const next = new Request(`${API_BASE}${u.pathname}${u.search}`, input);
          return originalFetch(next, init);
        }
        return originalFetch(input, init);
      } else {
        return originalFetch(input as any, init);
      }
    } catch {
      return originalFetch(input as any, init);
    }
  };
})();

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify", element: <VerifyEmail /> },


  { path: "/admin", element: <AdminPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: "/profile", element: <Profile /> },
      { path: "/edit-profile", element: <EditProfile /> },
      { path: "/works/new", element: <CreateWork /> },
    ],
  },

  { path: "/works/:id", element: <WorkView /> },
  { path: "/creators/:userId", element: <CreatorProfile /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { FleetProvider } from "./data/repositories/FleetContext";
import { router } from "./app/router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FleetProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </FleetProvider>
  </React.StrictMode>,
);

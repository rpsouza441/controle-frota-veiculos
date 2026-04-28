import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { createDataProvider } from "./app/providers/dataProviderFactory";
import { AuthProvider } from "./features/auth/AuthContext";
import { FleetProvider } from "./data/repositories/FleetContext";
import { router } from "./app/router";
import "./styles.css";

const dataProvider = createDataProvider();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FleetProvider fleetRepository={dataProvider.fleetRepository}>
      <AuthProvider authRepository={dataProvider.authRepository}>
        <RouterProvider router={router} />
      </AuthProvider>
    </FleetProvider>
  </React.StrictMode>,
);

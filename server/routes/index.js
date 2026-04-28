import { Router } from "express";
import { adminRoutes } from "./adminRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { fleetRoutes } from "./fleetRoutes.js";
import { healthRoutes } from "./healthRoutes.js";

export const apiRoutes = Router();

apiRoutes.use(healthRoutes);
apiRoutes.use(authRoutes);
apiRoutes.use(fleetRoutes);
apiRoutes.use(adminRoutes);

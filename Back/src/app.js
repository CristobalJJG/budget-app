import express from "express";
import cors from "cors";
import transactionsRouter from "./routes/transactions.js";
import categoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import servicesRouter from "./routes/services.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use("/api/auth", authRouter);

// Protected routes (con middleware de autenticación)
app.use("/api/categories", authMiddleware, categoriesRouter);
app.use("/api/transactions", authMiddleware, transactionsRouter);
app.use("/api/services", authMiddleware, servicesRouter);

export default app;

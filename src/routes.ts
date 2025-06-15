import type { Express } from "express";
import { createServer, type Server } from "http";
import { connectDB } from "./config/database.js";
import { setupSwagger } from "./config/swagger.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { Request, Response } from "express";
import { Router } from 'express';

import authRoutes from "./routes/auth.routes.js";
import accountRoutes from './routes/account.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import uploadRoutes from "./routes/upload.routes.js";
import statisticRoutes from './routes/statistic.routes.js';
import voucherRoutes from './routes/voucher.routes.js';
import productRoutes from './routes/product.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import returnRoutes from './routes/return.routes.js';
import vnpayRoutes from './routes/vnpay.routes.js';
import attributeRoutes from './routes/attribute.routes.js';

const router = Router();
export async function registerRoutes(app: Express): Promise<Server> {
  try {
    await connectDB();
    
    setupSwagger(app);
    
    app.get("/api-docs-test", (req: Request, res: Response) => {
      res.status(200).json({ 
        success: true, 
        message: "Swagger route test is working"
      });
    });
    
    app.use("/api/auth", authRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/accounts", accountRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/statistics", statisticRoutes);
    app.use("/api/vouchers", voucherRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/promotions", promotionRoutes);
    app.use("/api/returns", returnRoutes);
    app.use("/api/vnpay", vnpayRoutes);
    app.use("/api/attributes", attributeRoutes);
    
    app.get("/api/health", (req: Request, res: Response) => {
      res.status(200).json({ 
        status: "ok", 
        message: "API is running"
      });
    });
    
    app.use(notFound);
    app.use(errorHandler);
    
    const httpServer = createServer(app);
    
    return httpServer;
  } catch (error) {
    throw error;
  }
}

export default router; 
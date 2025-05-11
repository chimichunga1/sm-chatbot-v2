import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { hasDatabaseConnection } from "./db";
import path from "path";

const app = express();
// Increase JSON payload limit to 10MB for handling larger image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add headers to handle Cross-Origin Resource Sharing issues in Chrome
app.use((req, res, next) => {
  // Get the origin from the request
  const origin = req.headers.origin;
  
  console.log(`CORS: Request from origin: ${origin || 'unknown'}`);
  
  // Check if this is a development environment (localhost or Replit)
  const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.REPL_SLUG;
  
  if (origin) {
    // In development, allow all origins
    if (isDevelopment) {
      console.log(`CORS: In development mode, allowing origin: ${origin}`);
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    // In production, only allow specific origins
    else if (
      origin.includes('virtualinnovation.co.nz') || 
      origin.includes('replit.app') || 
      origin.includes('localhost')
    ) {
      console.log(`CORS: Allowed production origin: ${origin}`);
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      
      // Add Vary header for CDNs when using dynamic origin
      res.header('Vary', 'Origin');
    }
    
    // Common headers for all CORS requests
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  } else {
    // For requests without origin header (like from the same origin)
    console.log('CORS: No origin header, setting permissive headers');
    if (isDevelopment) {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS: Handling preflight request');
    return res.status(200).end();
  }
  
  next();
});

// Serve uploaded avatar files
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
log(`Serving avatar uploads from ${uploadsDir}`);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Log database connection status
    if (hasDatabaseConnection) {
      log("Database connected successfully");
      log("Using PostgreSQL for session storage - this will prevent memory leaks");
    } else {
      log("WARNING: No database connection available - using in-memory storage");
      log("WARNING: Memory-based session storage may cause memory leaks in production");
      log("For deployment, make sure to set the DATABASE_URL environment variable");
    }
  });
})();

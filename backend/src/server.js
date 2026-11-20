import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

// Parse client URLs (strip trailing slashes, support comma-separated origins)
const parseOrigins = (urlString) => {
  if (!urlString) return [];
  return urlString
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);
};

const allowedOrigins = new Set([
  ...parseOrigins(ENV.CLIENT_URL),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/+$/, "");
  if (allowedOrigins.has(normalizedOrigin)) return true;

  // Allow all Vercel deployments (production domain, branch and preview URLs)
  if (/^https:\/\/.*\.vercel\.app$/.test(normalizedOrigin)) {
    return true;
  }

  if (ENV.NODE_ENV === "development") {
    return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  }

  return false;
};

app.use(express.json({ limit: "5mb" })); // req.body
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(cookieParser());

// Health check endpoint for Render/uptime monitoring
app.get("/api/health", (_, res) => {
  res.status(200).json({ status: "ok", message: "Textro API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Static frontend serving if built alongside backend, otherwise fallback root route
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (ENV.NODE_ENV === "production" && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("*", (_, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (_, res) => {
    res.status(200).json({
      status: "ok",
      name: "Textro Chat API",
      message: "Server is running smoothly. Connect your frontend to this URL.",
    });
  });
}

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});

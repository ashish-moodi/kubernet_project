import {
    Registry,
    collectDefaultMetrics,
    Counter,
    Histogram,
    Gauge,
  } from "prom-client";
  
  import type {
    Request,
    Response,
    NextFunction,
  } from "express";
  
  export const register = new Registry();
  
  register.setDefaultLabels({
    service: "platform-backend",
  });
  
  collectDefaultMetrics({
    register,
  });
  
  // Total HTTP requests
  export const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [register],
  });
  
  // HTTP request duration
  export const httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [
      0.005, 0.01, 0.025, 0.05,
      0.1, 0.25, 0.5, 1, 2.5, 5,
    ],
    registers: [register],
  });
  
  // Currently active HTTP requests
  export const httpActiveRequests = new Gauge({
    name: "http_active_requests",
    help: "Number of active HTTP requests",
    registers: [register],
  });
  
  export function metricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Exclude Prometheus scraping requests
    if (req.path === "/metrics") {
      next();
      return;
    }
  
    const start = process.hrtime.bigint();
  
    httpActiveRequests.inc();
  
    let completed = false;
  
    function finalize() {
      if (completed) return;
  
      completed = true;
      httpActiveRequests.dec();
    }
  
    res.once("close", finalize);
  
    res.once("finish", () => {
      const duration =
        Number(process.hrtime.bigint() - start) / 1e9;
  
      const labels = {
        method: req.method,
        route: req.route?.path || "unmatched",
        status_code: String(res.statusCode),
      };
  
      httpRequestsTotal.inc(labels);
  
      httpRequestDuration.observe(labels, duration);
  
      finalize();
    });
  
    next();
  }
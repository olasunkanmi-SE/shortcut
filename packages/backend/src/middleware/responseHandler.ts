import { Request, Response, NextFunction } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Extend Response interface to include standardized response methods
 */
declare global {
  namespace Express {
    interface Response {
      success<T>(data: T, message?: string, count?: number): Response;
      created<T>(data: T, message?: string): Response;
      error(message: string, details?: any, statusCode?: number): Response;
      notFound(message?: string): Response;
      paginated<T>(data: T[], total: number, page: number, limit: number, message?: string): Response;
    }
  }
}

/**
 * Middleware to add standardized response methods to Express Response object
 */
export const standardizeResponses = (req: Request, res: Response, next: NextFunction): void => {
  // Success response with optional count
  res.success = function <T>(data: T, message?: string, count?: number): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      ...(count !== undefined && { count }),
    };

    return this.json(response);
  };

  // Created response (201)
  res.created = function <T>(data: T, message?: string): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };

    return this.status(201).json(response);
  };

  // Error response
  res.error = function (message: string, details?: any, statusCode: number = 400): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
      ...(details && { details }),
    };

    return this.status(statusCode).json(response);
  };

  // Not found response (404)
  res.notFound = function (message: string = "Resource not found"): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
    };

    return this.status(404).json(response);
  };

  // Paginated response
  res.paginated = function <T>(data: T[], total: number, page: number, limit: number, message?: string): Response {
    const totalPages = Math.ceil(total / limit);

    const response: ApiResponse<T[]> = {
      success: true,
      data,
      message,
      count: data.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return this.json(response);
  };

  next();
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  console.error("Global error handler:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Don't handle if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = statusCode === 500 ? "Internal server error" : error.message || "Something went wrong";

  const response: ApiResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      details: {
        stack: error.stack,
        originalError: error.message,
      },
    }),
  };

  res.status(statusCode).json(response);
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: {
      health: "GET /health",
      users: "GET /api/users",
      auctions: "GET /api/auctions",
    },
  });
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

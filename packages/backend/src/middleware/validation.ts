import { Request, Response, NextFunction } from "express";
import * as Joi from "joi";
import { VehicleCondition, VehicleType, AuctionStatus } from "../interfaces/Auction";

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail: any) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
      return;
    }

    next();
  };
};

/**
 * Query parameter validation middleware
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail: any) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        error: "Query validation failed",
        details: validationErrors,
      });
      return;
    }

    // Replace query with validated/converted values
    req.query = value;
    next();
  };
};

// Validation schemas for auctions
export const createAuctionSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  make: Joi.string().min(1).max(50).required(),
  model: Joi.string().min(1).max(50).required(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .required(),
  mileage: Joi.number().integer().min(0).max(1000000).required(),
  condition: Joi.string()
    .valid(...Object.values(VehicleCondition))
    .required(),
  vehicle_type: Joi.string()
    .valid(...Object.values(VehicleType))
    .required(),
  description: Joi.string().min(10).max(2000).required(),
  images: Joi.array().items(Joi.string().uri()).min(1).max(20).required(),
  starting_price: Joi.number().positive().required(),
  reserve_price: Joi.number().positive().optional(),
  end_time: Joi.date().greater("now").required(),
  seller_id: Joi.number().integer().positive().required(),
});

export const updateAuctionSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  make: Joi.string().min(1).max(50).optional(),
  model: Joi.string().min(1).max(50).optional(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  mileage: Joi.number().integer().min(0).max(1000000).optional(),
  condition: Joi.string()
    .valid(...Object.values(VehicleCondition))
    .optional(),
  vehicle_type: Joi.string()
    .valid(...Object.values(VehicleType))
    .optional(),
  description: Joi.string().min(10).max(2000).optional(),
  images: Joi.array().items(Joi.string().uri()).min(1).max(20).optional(),
  starting_price: Joi.number().positive().optional(),
  reserve_price: Joi.number().positive().optional(),
  end_time: Joi.date().greater("now").optional(),
  status: Joi.string()
    .valid(...Object.values(AuctionStatus))
    .optional(),
}).min(1); // At least one field required

export const placeBidSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
});

export const auctionQuerySchema = Joi.object({
  make: Joi.string().max(50).optional(),
  model: Joi.string().max(50).optional(),
  year_min: Joi.number().integer().min(1900).optional(),
  year_max: Joi.number()
    .integer()
    .max(new Date().getFullYear() + 1)
    .optional(),
  mileage_max: Joi.number().integer().min(0).optional(),
  condition: Joi.string()
    .valid(...Object.values(VehicleCondition))
    .optional(),
  price_min: Joi.number().positive().optional(),
  price_max: Joi.number().positive().optional(),
  status: Joi.string()
    .valid(...Object.values(AuctionStatus))
    .optional(),
  seller_id: Joi.number().integer().positive().optional(),
  page: Joi.number().integer().positive().default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  sort_by: Joi.string()
    .valid("auction_end", "current_bid", "created_at", "year", "mileage")
    .default("created_at")
    .optional(),
  sort_order: Joi.string().valid("asc", "desc").default("desc").optional(),
  q: Joi.string().min(1).max(100).optional(), // for search
});

// User validation schemas
export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .optional(),
  address: Joi.string().max(500).optional(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .optional(),
  address: Joi.string().max(500).optional(),
}).min(1);

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Common ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.alternatives()
    .try(
      Joi.string().hex().length(24), // MongoDB ObjectId
      Joi.number().integer().positive() // Numeric ID
    )
    .required(),
});

/**
 * Middleware to validate MongoDB ObjectId or numeric ID parameters
 */
export const validateIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = idParamSchema.validate(req.params);

  if (error) {
    res.status(400).json({
      success: false,
      error: "Invalid ID parameter",
      details: error.details[0].message,
    });
    return;
  }

  next();
};

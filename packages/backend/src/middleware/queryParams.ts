import { Request, Response, NextFunction } from 'express';
import { 
  AuctionFilters, 
  PaginationOptions, 
  VehicleCondition, 
  AuctionStatus 
} from '../interfaces/Auction';

// Extend Request interface to include parsed parameters
export interface ParsedRequest extends Request {
  auctionFilters?: AuctionFilters;
  paginationOptions?: PaginationOptions;
}

/**
 * Middleware to parse auction filters and pagination from query parameters
 */
export const parseAuctionParams = (req: ParsedRequest, res: Response, next: NextFunction): void => {
  try {
    req.auctionFilters = parseFilters(req.query);
    req.paginationOptions = parsePagination(req.query);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Parse filters from query parameters
 */
export function parseFilters(query: any): AuctionFilters {
  const filters: AuctionFilters = {};

  if (query.make) filters.make = String(query.make);
  if (query.model) filters.model = String(query.model);
  
  // Parse numeric ranges with validation
  if (query.year_min) {
    const yearMin = parseInt(String(query.year_min));
    if (!isNaN(yearMin) && yearMin >= 1900 && yearMin <= new Date().getFullYear() + 1) {
      filters.year_min = yearMin;
    }
  }
  
  if (query.year_max) {
    const yearMax = parseInt(String(query.year_max));
    if (!isNaN(yearMax) && yearMax >= 1900 && yearMax <= new Date().getFullYear() + 1) {
      filters.year_max = yearMax;
    }
  }
  
  if (query.mileage_max) {
    const mileageMax = parseInt(String(query.mileage_max));
    if (!isNaN(mileageMax) && mileageMax >= 0) {
      filters.mileage_max = mileageMax;
    }
  }
  
  // Validate enum values
  if (query.condition && Object.values(VehicleCondition).includes(query.condition)) {
    filters.condition = query.condition as VehicleCondition;
  }
  
  // Parse price ranges
  if (query.price_min) {
    const priceMin = parseFloat(String(query.price_min));
    if (!isNaN(priceMin) && priceMin >= 0) {
      filters.price_min = priceMin;
    }
  }
  
  if (query.price_max) {
    const priceMax = parseFloat(String(query.price_max));
    if (!isNaN(priceMax) && priceMax >= 0) {
      filters.price_max = priceMax;
    }
  }
  
  if (query.status && Object.values(AuctionStatus).includes(query.status)) {
    filters.status = query.status as AuctionStatus;
  }
  
  if (query.seller_id) {
    const sellerId = parseInt(String(query.seller_id));
    if (!isNaN(sellerId) && sellerId > 0) {
      filters.seller_id = sellerId;
    }
  }

  return filters;
}

/**
 * Parse pagination from query parameters
 */
export function parsePagination(query: any): PaginationOptions {
  const pagination: PaginationOptions = {};

  // Parse page with default and bounds checking
  if (query.page) {
    const page = parseInt(String(query.page));
    pagination.page = !isNaN(page) && page > 0 ? page : 1;
  }
  
  // Parse limit with default and bounds checking
  if (query.limit) {
    const limit = parseInt(String(query.limit));
    pagination.limit = !isNaN(limit) && limit > 0 && limit <= 100 ? limit : 10;
  }
  
  // Validate sort_by field
  const validSortFields = ['auction_end', 'current_bid', 'created_at', 'year', 'mileage'];
  if (query.sort_by && validSortFields.includes(String(query.sort_by))) {
    pagination.sort_by = String(query.sort_by) as any;
  }
  
  // Validate sort_order
  if (query.sort_order && ['asc', 'desc'].includes(String(query.sort_order))) {
    pagination.sort_order = String(query.sort_order) as 'asc' | 'desc';
  }

  return pagination;
}

/**
 * Middleware specifically for search endpoints
 */
export const parseSearchParams = (req: ParsedRequest, res: Response, next: NextFunction): void => {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Search term (q) is required and must be non-empty'
      });
      return;
    }

    // Sanitize search term
    req.query.q = searchTerm.trim();
    req.paginationOptions = parsePagination(req.query);
    
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid search parameters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
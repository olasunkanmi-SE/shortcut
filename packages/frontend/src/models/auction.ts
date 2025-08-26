import { ObjectId } from "mongodb";

/**
 * Interface for a bid placed on an auction
 */
export interface Bid {
  user_id: number;
  amount: number;
  time: string; // ISO 8601 date string
}

/**
 * Enum for auction status
 */
export enum AuctionStatus {
  ACTIVE = "Active",
  ENDED = "Ended",
  CANCELLED = "Cancelled",
  PENDING = "Pending",
}

/**
 * Enum for vehicle condition
 */
export enum VehicleCondition {
  EXCELLENT = "Excellent",
  VERY_GOOD = "Very Good",
  GOOD = "Good",
  FAIR = "Fair",
  POOR = "Poor",
}

/**
 * Enum for vehicle type
 */
export enum VehicleType {
  SEDAN = "Sedan",
  SUV = "SUV",
  COUPE = "Coupe",
  CONVERTIBLE = "Convertible",
  HATCHBACK = "Hatchback",
  TRUCK = "Truck",
  MOTORCYCLE = "Motorcycle",
  OTHER = "Other",
}

/**
 * Interface for the main auction document
 */
export interface Auction {
  _id?: ObjectId;
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: VehicleCondition;
  vehicle_type: VehicleType;
  description: string;
  images: string[];
  starting_price: number;
  reserve_price?: number;
  current_bid: number;
  auction_start: string; // ISO 8601 date string
  auction_end: string; // ISO 8601 date string
  end_time: string; // ISO 8601 date string (alias for auction_end)
  status: AuctionStatus;
  bids: Bid[];
  seller_id: number;
  winner_id: number | null;
  auction_id: number; // Unique sequential ID
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for creating a new auction
 */
export interface CreateAuctionDto {
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: VehicleCondition;
  vehicle_type: VehicleType;
  description: string;
  images: string[];
  starting_price: number;
  reserve_price?: number;
  end_time: Date;
  seller_id: number;
}

/**
 * Interface for updating an auction
 */
export interface UpdateAuctionDto {
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  condition?: VehicleCondition;
  vehicle_type?: VehicleType;
  description?: string;
  images?: string[];
  starting_price?: number;
  reserve_price?: number;
  end_time?: Date;
  status?: AuctionStatus;
}

/**
 * Interface for placing a bid
 */
export interface PlaceBidDto {
  user_id: number;
  amount: number;
}

/**
 * Interface for auction query filters
 */
export interface AuctionFilters {
  make?: string;
  model?: string;
  year_min?: number;
  year_max?: number;
  mileage_max?: number;
  condition?: VehicleCondition;
  price_min?: number;
  price_max?: number;
  status?: AuctionStatus;
  seller_id?: number;
}

/**
 * Interface for pagination
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: "auction_end" | "current_bid" | "created_at" | "year" | "mileage";
  sort_order?: "asc" | "desc";
}

/**
 * Interface for paginated auction results
 */
export interface PaginatedAuctions {
  data: Auction[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Interface for auction statistics
 */
export interface AuctionStats {
  total: number;
  active: number;
  ended: number;
  with_bids: number;
  avg_starting_price: number;
  avg_current_bid: number;
  highest_bid: number;
}

/**
 * Interface for bid validation result
 */
export interface BidValidationResult {
  isValid: boolean;
  message?: string;
  minimum_bid?: number;
}

/**
 * Type for auction search results with highlighting
 */
export interface AuctionSearchResult extends Auction {
  relevance_score?: number;
  highlighted_fields?: {
    make?: string;
    model?: string;
    description?: string;
  };
}

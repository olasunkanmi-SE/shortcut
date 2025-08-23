import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { AuctionRepository } from "../repositories/auctionRepository";
import {
  Auction,
  CreateAuctionDto,
  UpdateAuctionDto,
  PlaceBidDto,
  AuctionFilters,
  PaginationOptions,
  PaginatedAuctions,
  AuctionStats,
  AuctionStatus,
  VehicleCondition,
} from "../interfaces/Auction";

@injectable()
export class AuctionService {
  constructor(@inject(TYPES.AuctionRepository) private auctionRepository: AuctionRepository) {}

  /**
   * Get all auctions with filtering and pagination
   */
  async getAllAuctions(filters: AuctionFilters = {}, pagination: PaginationOptions = {}): Promise<PaginatedAuctions> {
    return await this.auctionRepository.findAll(filters, pagination);
  }

  /**
   * Get auction by ID
   */
  async getAuctionById(id: string): Promise<Auction | null> {
    if (!id || id.trim() === "") {
      throw new Error("Auction ID is required");
    }
    return await this.auctionRepository.findById(id);
  }

  /**
   * Get auction by numeric ID
   */
  async getAuctionByNumericId(id: number): Promise<Auction | null> {
    if (!id || id <= 0) {
      throw new Error("Valid auction ID is required");
    }
    return await this.auctionRepository.findByNumericId(id);
  }

  /**
   * Create new auction
   */
  async createAuction(auctionData: CreateAuctionDto): Promise<Auction> {
    // Validation
    this.validateAuctionData(auctionData);

    // Sanitize and validate dates
    const auctionStart = new Date(); // Start immediately
    const auctionEnd = new Date(auctionData.end_time);
    const now = new Date();

    if (auctionStart < now) {
      throw new Error("Auction start time must be in the future");
    }

    if (auctionEnd <= auctionStart) {
      throw new Error("Auction end time must be after start time");
    }

    // Sanitize input
    const sanitizedData: CreateAuctionDto = {
      ...auctionData,
      make: auctionData.make.trim(),
      model: auctionData.model.trim(),
      description: auctionData.description.trim(),
      images: auctionData.images.filter((img) => img.trim() !== ""),
    };

    return await this.auctionRepository.create(sanitizedData);
  }

  /**
   * Update auction
   */
  async updateAuction(id: string, updateData: UpdateAuctionDto): Promise<Auction | null> {
    if (!id || id.trim() === "") {
      throw new Error("Auction ID is required");
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No update data provided");
    }

    // Validate update data
    if (updateData.year && (updateData.year < 1900 || updateData.year > new Date().getFullYear() + 1)) {
      throw new Error("Invalid year");
    }

    if (updateData.mileage && updateData.mileage < 0) {
      throw new Error("Mileage cannot be negative");
    }

    if (updateData.starting_price && updateData.starting_price <= 0) {
      throw new Error("Starting price must be greater than 0");
    }

    // Sanitize string fields
    const sanitizedData: UpdateAuctionDto = { ...updateData };
    if (updateData.make) sanitizedData.make = updateData.make.trim();
    if (updateData.model) sanitizedData.model = updateData.model.trim();
    if (updateData.description) sanitizedData.description = updateData.description.trim();
    if (updateData.images) sanitizedData.images = updateData.images.filter((img) => img.trim() !== "");

    return await this.auctionRepository.update(id, sanitizedData);
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(auctionId: string, bidData: PlaceBidDto): Promise<Auction | null> {
    if (!auctionId || auctionId.trim() === "") {
      throw new Error("Auction ID is required");
    }

    if (!bidData.user_id || bidData.user_id <= 0) {
      throw new Error("Valid user ID is required");
    }

    if (!bidData.amount || bidData.amount <= 0) {
      throw new Error("Bid amount must be greater than 0");
    }

    return await this.auctionRepository.placeBid(auctionId, bidData);
  }

  /**
   * End an auction
   */
  async endAuction(auctionId: string): Promise<Auction | null> {
    if (!auctionId || auctionId.trim() === "") {
      throw new Error("Auction ID is required");
    }

    return await this.auctionRepository.endAuction(auctionId);
  }

  /**
   * Delete auction
   */
  async deleteAuction(id: string): Promise<boolean> {
    if (!id || id.trim() === "") {
      throw new Error("Auction ID is required");
    }

    return await this.auctionRepository.delete(id);
  }

  /**
   * Get auction statistics
   */
  async getAuctionStats(): Promise<AuctionStats> {
    return await this.auctionRepository.getStats();
  }

  /**
   * Search auctions by text
   */
  async searchAuctions(searchTerm: string, pagination: PaginationOptions = {}): Promise<PaginatedAuctions> {
    if (!searchTerm || searchTerm.trim() === "") {
      return await this.getAllAuctions({}, pagination);
    }

    // Create filters for text search
    const filters: AuctionFilters = {
      make: searchTerm,
      // Note: MongoDB text search would be more efficient for this
      // This is a simple implementation using regex
    };

    return await this.auctionRepository.findAll(filters, pagination);
  }

  /**
   * Get active auctions
   */
  async getActiveAuctions(pagination: PaginationOptions = {}): Promise<PaginatedAuctions> {
    const filters: AuctionFilters = {
      status: AuctionStatus.ACTIVE,
    };

    return await this.auctionRepository.findAll(filters, pagination);
  }

  /**
   * Get ended auctions
   */
  async getEndedAuctions(pagination: PaginationOptions = {}): Promise<PaginatedAuctions> {
    const filters: AuctionFilters = {
      status: AuctionStatus.ENDED,
    };

    return await this.auctionRepository.findAll(filters, pagination);
  }

  /**
   * Get auctions by seller
   */
  async getAuctionsBySeller(sellerId: number, pagination: PaginationOptions = {}): Promise<PaginatedAuctions> {
    if (!sellerId || sellerId <= 0) {
      throw new Error("Valid seller ID is required");
    }

    const filters: AuctionFilters = {
      seller_id: sellerId,
    };

    return await this.auctionRepository.findAll(filters, pagination);
  }

  /**
   * Validate auction data
   */
  private validateAuctionData(data: CreateAuctionDto): void {
    if (!data.make || data.make.trim() === "") {
      throw new Error("Make is required");
    }

    if (!data.model || data.model.trim() === "") {
      throw new Error("Model is required");
    }

    if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
      throw new Error("Valid year is required");
    }

    if (!data.mileage || data.mileage < 0) {
      throw new Error("Valid mileage is required");
    }

    if (!data.condition || !Object.values(VehicleCondition).includes(data.condition)) {
      throw new Error("Valid condition is required");
    }

    if (!data.description || data.description.trim() === "") {
      throw new Error("Description is required");
    }

    if (!data.images || data.images.length === 0) {
      throw new Error("At least one image is required");
    }

    if (!data.starting_price || data.starting_price <= 0) {
      throw new Error("Starting price is required and must be greater than 0");
    }

    if (!data.seller_id || data.seller_id <= 0) {
      throw new Error("Valid seller ID is required");
    }
  }
}

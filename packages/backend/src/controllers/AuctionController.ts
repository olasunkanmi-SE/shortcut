import { injectable, inject } from "inversify";
import { Router, Request, Response } from "express";
import { TYPES } from "../types";
import { AuctionService } from "../services/AuctionService";
import {
  AuctionFilters,
  PaginationOptions,
  CreateAuctionDto,
  UpdateAuctionDto,
  PlaceBidDto,
  VehicleCondition,
  AuctionStatus,
} from "../interfaces/Auction";

@injectable()
export class AuctionController {
  private router: Router;

  constructor(@inject(TYPES.AuctionService) private auctionService: AuctionService) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get routes
    this.router.get("/", this.getAuctions.bind(this));
    this.router.get("/search", this.searchAuctions.bind(this));
    this.router.get("/active", this.getActiveAuctions.bind(this));
    this.router.get("/ended", this.getEndedAuctions.bind(this));
    this.router.get("/stats", this.getAuctionStats.bind(this));
    this.router.get("/seller/:sellerId", this.getAuctionsBySeller.bind(this));
    this.router.get("/:id", this.getAuctionById.bind(this));

    // Post routes
    this.router.post("/", this.createAuction.bind(this));
    this.router.post("/:id/bid", this.placeBid.bind(this));
    this.router.post("/:id/end", this.endAuction.bind(this));

    // Put routes
    this.router.put("/:id", this.updateAuction.bind(this));

    // Delete routes
    this.router.delete("/:id", this.deleteAuction.bind(this));
  }

  public getRouter(): Router {
    return this.router;
  }

  /**
   * Get auctions with filtering and pagination
   */
  private async getAuctions(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.parseFilters(req.query);
      const pagination = this.parsePagination(req.query);

      const result = await this.auctionService.getAllAuctions(filters, pagination);

      res.json({
        success: true,
        data: result,
        message: `Found ${result.total} auctions`,
      });
    } catch (error) {
      console.error("Error in getAuctions:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch auctions";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Search auctions
   */
  private async searchAuctions(req: Request, res: Response): Promise<void> {
    try {
      const { q: searchTerm } = req.query;
      const pagination = this.parsePagination(req.query);

      if (!searchTerm || typeof searchTerm !== "string") {
        res.status(400).json({
          success: false,
          error: "Search term (q) is required",
        });
        return;
      }

      const result = await this.auctionService.searchAuctions(searchTerm, pagination);

      res.json({
        success: true,
        data: result,
        message: `Found ${result.total} auctions matching "${searchTerm}"`,
      });
    } catch (error) {
      console.error("Error in searchAuctions:", error);
      const message = error instanceof Error ? error.message : "Failed to search auctions";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get active auctions
   */
  private async getActiveAuctions(req: Request, res: Response): Promise<void> {
    try {
      const pagination = this.parsePagination(req.query);
      const result = await this.auctionService.getActiveAuctions(pagination);

      res.json({
        success: true,
        data: result,
        message: `Found ${result.total} active auctions`,
      });
    } catch (error) {
      console.error("Error in getActiveAuctions:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch active auctions";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get ended auctions
   */
  private async getEndedAuctions(req: Request, res: Response): Promise<void> {
    try {
      const pagination = this.parsePagination(req.query);
      const result = await this.auctionService.getEndedAuctions(pagination);

      res.json({
        success: true,
        data: result,
        message: `Found ${result.total} ended auctions`,
      });
    } catch (error) {
      console.error("Error in getEndedAuctions:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch ended auctions";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get auction by ID
   */
  private async getAuctionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Try to parse as numeric ID first, then as ObjectId
      let auction = null;
      const numericId = parseInt(id);

      if (!isNaN(numericId)) {
        auction = await this.auctionService.getAuctionByNumericId(numericId);
      } else {
        auction = await this.auctionService.getAuctionById(id);
      }

      if (!auction) {
        res.status(404).json({
          success: false,
          error: "Auction not found",
        });
        return;
      }

      res.json({
        success: true,
        data: auction,
      });
    } catch (error) {
      console.error("Error in getAuctionById:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch auction";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get auctions by seller
   */
  private async getAuctionsBySeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const sellerIdNum = parseInt(sellerId);

      if (isNaN(sellerIdNum)) {
        res.status(400).json({
          success: false,
          error: "Valid seller ID is required",
        });
        return;
      }

      const pagination = this.parsePagination(req.query);
      const result = await this.auctionService.getAuctionsBySeller(sellerIdNum, pagination);

      res.json({
        success: true,
        data: result,
        message: `Found ${result.total} auctions by seller ${sellerIdNum}`,
      });
    } catch (error) {
      console.error("Error in getAuctionsBySeller:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch auctions by seller";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get auction statistics
   */
  private async getAuctionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.auctionService.getAuctionStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error in getAuctionStats:", error);
      const message = error instanceof Error ? error.message : "Failed to get auction statistics";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Create new auction
   */
  private async createAuction(req: Request, res: Response): Promise<void> {
    try {
      const auctionData: CreateAuctionDto = req.body;

      // Basic validation
      if (!auctionData) {
        res.status(400).json({
          success: false,
          error: "Auction data is required",
        });
        return;
      }

      const auction = await this.auctionService.createAuction(auctionData);

      res.status(201).json({
        success: true,
        data: auction,
        message: "Auction created successfully",
      });
    } catch (error) {
      console.error("Error in createAuction:", error);
      const message = error instanceof Error ? error.message : "Failed to create auction";
      const statusCode = message.includes("required") || message.includes("Invalid") ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Update auction
   */
  private async updateAuction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateAuctionDto = req.body;

      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          error: "Update data is required",
        });
        return;
      }

      const auction = await this.auctionService.updateAuction(id, updateData);

      if (!auction) {
        res.status(404).json({
          success: false,
          error: "Auction not found",
        });
        return;
      }

      res.json({
        success: true,
        data: auction,
        message: "Auction updated successfully",
      });
    } catch (error) {
      console.error("Error in updateAuction:", error);
      const message = error instanceof Error ? error.message : "Failed to update auction";
      const statusCode = message.includes("required") || message.includes("Invalid") ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Place a bid
   */
  private async placeBid(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const bidData: PlaceBidDto = req.body;

      if (!bidData || !bidData.user_id || !bidData.amount) {
        res.status(400).json({
          success: false,
          error: "User ID and bid amount are required",
        });
        return;
      }

      const auction = await this.auctionService.placeBid(id, bidData);

      if (!auction) {
        res.status(404).json({
          success: false,
          error: "Auction not found",
        });
        return;
      }

      res.json({
        success: true,
        data: auction,
        message: `Bid of $${bidData.amount} placed successfully`,
      });
    } catch (error) {
      console.error("Error in placeBid:", error);
      const message = error instanceof Error ? error.message : "Failed to place bid";
      const statusCode =
        message.includes("not active") || message.includes("ended") || message.includes("must be at least") ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * End an auction
   */
  private async endAuction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const auction = await this.auctionService.endAuction(id);

      if (!auction) {
        res.status(404).json({
          success: false,
          error: "Auction not found or already ended",
        });
        return;
      }

      res.json({
        success: true,
        data: auction,
        message: "Auction ended successfully",
      });
    } catch (error) {
      console.error("Error in endAuction:", error);
      const message = error instanceof Error ? error.message : "Failed to end auction";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Delete auction
   */
  private async deleteAuction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.auctionService.deleteAuction(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Auction not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Auction deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteAuction:", error);
      const message = error instanceof Error ? error.message : "Failed to delete auction";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Parse filters from query parameters
   */
  private parseFilters(query: any): AuctionFilters {
    const filters: AuctionFilters = {};

    if (query.make) filters.make = String(query.make);
    if (query.model) filters.model = String(query.model);
    if (query.year_min) filters.year_min = parseInt(String(query.year_min));
    if (query.year_max) filters.year_max = parseInt(String(query.year_max));
    if (query.mileage_max) filters.mileage_max = parseInt(String(query.mileage_max));
    if (query.condition && Object.values(VehicleCondition).includes(query.condition)) {
      filters.condition = query.condition as VehicleCondition;
    }
    if (query.price_min) filters.price_min = parseInt(String(query.price_min));
    if (query.price_max) filters.price_max = parseInt(String(query.price_max));
    if (query.status && Object.values(AuctionStatus).includes(query.status)) {
      filters.status = query.status as AuctionStatus;
    }
    if (query.seller_id) filters.seller_id = parseInt(String(query.seller_id));

    return filters;
  }

  /**
   * Parse pagination from query parameters
   */
  private parsePagination(query: any): PaginationOptions {
    const pagination: PaginationOptions = {};

    if (query.page) pagination.page = Math.max(1, parseInt(String(query.page)));
    if (query.limit) pagination.limit = Math.min(100, Math.max(1, parseInt(String(query.limit))));
    if (query.sort_by) pagination.sort_by = String(query.sort_by) as any;
    if (query.sort_order && ["asc", "desc"].includes(query.sort_order)) {
      pagination.sort_order = query.sort_order as "asc" | "desc";
    }

    return pagination;
  }
}

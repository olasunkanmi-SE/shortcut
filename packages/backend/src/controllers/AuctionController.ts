import { injectable, inject } from 'inversify';
import { Router, Request, Response } from 'express';
import { TYPES } from '../types';
import { AuctionService } from '../services/AuctionService';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { 
  validate, 
  validateQuery,
  createAuctionSchema, 
  updateAuctionSchema, 
  placeBidSchema,
  auctionQuerySchema,
  validateIdParam 
} from '../middleware/validation';
import { parseAuctionParams, parseSearchParams, ParsedRequest } from '../middleware/queryParams';
import { asyncHandler } from '../middleware/responseHandler';
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
    // Get routes (public)
    this.router.get("/", 
      optionalAuthMiddleware,
      validateQuery(auctionQuerySchema),
      parseAuctionParams,
      asyncHandler(this.getAuctions.bind(this))
    );
    this.router.get("/search", 
      optionalAuthMiddleware,
      validateQuery(auctionQuerySchema),
      parseSearchParams,
      asyncHandler(this.searchAuctions.bind(this))
    );
    this.router.get("/active", 
      optionalAuthMiddleware,
      validateQuery(auctionQuerySchema),
      parseAuctionParams,
      asyncHandler(this.getActiveAuctions.bind(this))
    );
    this.router.get("/ended", 
      optionalAuthMiddleware,
      validateQuery(auctionQuerySchema),
      parseAuctionParams,
      asyncHandler(this.getEndedAuctions.bind(this))
    );
    this.router.get("/stats", 
      optionalAuthMiddleware,
      asyncHandler(this.getAuctionStats.bind(this))
    );
    this.router.get("/seller/:sellerId", 
      optionalAuthMiddleware,
      asyncHandler(this.getAuctionsBySeller.bind(this))
    );
    this.router.get("/:id", 
      optionalAuthMiddleware,
      validateIdParam,
      asyncHandler(this.getAuctionById.bind(this))
    );

    // Post routes (require authentication)
    this.router.post("/", 
      authMiddleware,
      validate(createAuctionSchema),
      asyncHandler(this.createAuction.bind(this))
    );
    this.router.post("/:id/bid", 
      authMiddleware,
      validateIdParam,
      validate(placeBidSchema),
      asyncHandler(this.placeBid.bind(this))
    );
    this.router.post("/:id/end", 
      authMiddleware,
      validateIdParam,
      asyncHandler(this.endAuction.bind(this))
    );

    // Put routes (require authentication)
    this.router.put("/:id", 
      authMiddleware,
      validateIdParam,
      validate(updateAuctionSchema),
      asyncHandler(this.updateAuction.bind(this))
    );

    // Delete routes (require authentication)
    this.router.delete("/:id", 
      authMiddleware,
      validateIdParam,
      asyncHandler(this.deleteAuction.bind(this))
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  /**
   * Get auctions with filtering and pagination
   */
  private async getAuctions(req: ParsedRequest, res: Response): Promise<void> {
    const filters = req.auctionFilters || {};
    const pagination = req.paginationOptions || { page: 1, limit: 10 };
    
    const result = await this.auctionService.getAllAuctions(filters, pagination);
    
    res.success(result, `Found ${result.total} auctions`);
  }

  /**
   * Search auctions
   */
  private async searchAuctions(req: ParsedRequest, res: Response): Promise<void> {
    const { q: searchTerm } = req.query;
    const pagination = req.paginationOptions || { page: 1, limit: 10 };

    if (!searchTerm || typeof searchTerm !== "string") {
      res.error("Search term (q) is required", undefined, 400);
      return;
    }

    const result = await this.auctionService.searchAuctions(searchTerm, pagination);

    res.success(result, `Found ${result.total} auctions matching "${searchTerm}"`);
  }

  /**
   * Get active auctions
   */
  private async getActiveAuctions(req: ParsedRequest, res: Response): Promise<void> {
    const pagination = req.paginationOptions || { page: 1, limit: 10 };
    const result = await this.auctionService.getActiveAuctions(pagination);

    res.success(result, `Found ${result.total} active auctions`);
  }

  /**
   * Get ended auctions
   */
  private async getEndedAuctions(req: ParsedRequest, res: Response): Promise<void> {
    const pagination = req.paginationOptions || { page: 1, limit: 10 };
    const result = await this.auctionService.getEndedAuctions(pagination);

    res.success(result, `Found ${result.total} ended auctions`);
  }

  /**
   * Get auction by ID
   */
  private async getAuctionById(req: Request, res: Response): Promise<void> {
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
      res.notFound("Auction not found");
      return;
    }

    res.success(auction);
  }

  /**
   * Get auctions by seller
   */
  private async getAuctionsBySeller(req: Request, res: Response): Promise<void> {
    const { sellerId } = req.params;
    const sellerIdNum = parseInt(sellerId);

    if (isNaN(sellerIdNum)) {
      res.error("Valid seller ID is required", 400);
      return;
    }

    // For seller-specific routes, we'll use default pagination since parseAuctionParams middleware isn't applied
    const pagination = { page: 1, limit: 10 }; // Default values
    const result = await this.auctionService.getAuctionsBySeller(sellerIdNum, pagination);

    res.success(result, `Found ${result.total} auctions by seller ${sellerIdNum}`);
  }

  /**
   * Get auction statistics
   */
  private async getAuctionStats(req: Request, res: Response): Promise<void> {
    const stats = await this.auctionService.getAuctionStats();
    res.success(stats);
  }

  /**
   * Create new auction
   */
  private async createAuction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const auctionData: CreateAuctionDto = req.body;
    
    // Add seller information from authenticated user
    if (!req.user) {
      res.error("User authentication required", undefined, 401);
      return;
    }
    
    const sellerId = req.user.id;
    const auctionWithSeller = { ...auctionData, seller_id: sellerId };
    
    const auction = await this.auctionService.createAuction(auctionWithSeller);
    
    res.created(auction, "Auction created successfully");
  }

  /**
   * Update auction
   */
  private async updateAuction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const updateData: UpdateAuctionDto = req.body;
    
    if (!req.user) {
      res.error("User authentication required", undefined, 401);
      return;
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      res.error("Update data is required");
      return;
    }

    const auction = await this.auctionService.updateAuction(id, updateData);

    if (!auction) {
      res.notFound("Auction not found");
      return;
    }

    res.success(auction, "Auction updated successfully");
  }

  /**
   * Place a bid
   */
  private async placeBid(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const bidData: PlaceBidDto = req.body;
    
    if (!req.user) {
      res.error("User authentication required", undefined, 401);
      return;
    }

    // Use authenticated user's ID instead of requiring it in the body
    const bidWithUser = { ...bidData, user_id: req.user.id };

    const auction = await this.auctionService.placeBid(id, bidWithUser);

    if (!auction) {
      res.notFound("Auction not found");
      return;
    }

    res.success(auction, `Bid of $${bidData.amount} placed successfully`);
  }

  /**
   * End an auction
   */
  private async endAuction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!req.user) {
      res.error("User authentication required", undefined, 401);
      return;
    }

    const auction = await this.auctionService.endAuction(id);

    if (!auction) {
      res.notFound("Auction not found or already ended");
      return;
    }

    res.success(auction, "Auction ended successfully");
  }

  /**
   * Delete auction
   */
  private async deleteAuction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!req.user) {
      res.error("User authentication required", undefined, 401);
      return;
    }

    const deleted = await this.auctionService.deleteAuction(id);

    if (!deleted) {
      res.notFound("Auction not found");
      return;
    }

    res.success({ id }, "Auction deleted successfully");
  }

}

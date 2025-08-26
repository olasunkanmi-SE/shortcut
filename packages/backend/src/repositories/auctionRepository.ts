import { injectable } from "inversify";
import { ObjectId, Collection } from "mongodb";
import { getDB } from "../infrastructure/db";
import {
  Auction,
  CreateAuctionDto,
  UpdateAuctionDto,
  PlaceBidDto,
  AuctionFilters,
  PaginationOptions,
  PaginatedAuctions,
  AuctionStats,
  BidValidationResult,
  AuctionStatus,
  Bid,
} from "../interfaces/Auction";

@injectable()
export class AuctionRepository {
  private get collection(): Collection<Auction> {
    return getDB().collection<Auction>("auctions");
  }

  /**
   * Find all auctions with optional filters and pagination
   */
  async findAll(
    filters: AuctionFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedAuctions> {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = "auction_end",
        sort_order = "asc",
      } = pagination;

      // Build filter query
      const query: any = {};
      console.log(query);

      if (filters.make) query.make = new RegExp(filters.make, "i");
      if (filters.description)
        query.description = new RegExp(filters.description, "i");
      if (filters.model) query.model = new RegExp(filters.model, "i");
      if (filters.year_min || filters.year_max) {
        query.year = {};
        if (filters.year_min) query.year.$gte = filters.year_min;
        if (filters.year_max) query.year.$lte = filters.year_max;
      }
      if (filters.mileage_max) query.mileage = { $lte: filters.mileage_max };
      if (filters.condition) query.condition = filters.condition;
      if (filters.price_min || filters.price_max) {
        query.current_bid = {};
        if (filters.price_min) query.current_bid.$gte = filters.price_min;
        if (filters.price_max) query.current_bid.$lte = filters.price_max;
      }
      if (filters.status) query.status = filters.status;
      if (filters.seller_id) query.seller_id = filters.seller_id;

      // Build sort object
      const sort: any = {};
      sort[sort_by] = sort_order === "desc" ? -1 : 1;

      // Execute queries
      const skip = (page - 1) * limit;
      const [auctions, total] = await Promise.all([
        this.collection
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(query),
      ]);

      const total_pages = Math.ceil(total / limit);

      return {
        data: auctions.map(this.transformAuction),
        total,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      };
    } catch (error) {
      console.error("Error fetching auctions:", error);
      throw new Error("Failed to fetch auctions from database");
    }
  }

  /**
   * Find auction by ID
   */
  async findById(id: string): Promise<Auction | null> {
    try {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const auction = await this.collection.findOne({ _id: new ObjectId(id) });
      return auction ? this.transformAuction(auction) : null;
    } catch (error) {
      console.error("Error fetching auction by ID:", error);
      throw new Error("Failed to fetch auction from database");
    }
  }

  /**
   * Find auction by numeric ID
   */
  async findByNumericId(id: number): Promise<Auction | null> {
    try {
      const auction = await this.collection.findOne({ id });
      return auction ? this.transformAuction(auction) : null;
    } catch (error) {
      console.error("Error fetching auction by numeric ID:", error);
      throw new Error("Failed to fetch auction from database");
    }
  }

  /**
   * Create new auction
   */
  async create(auctionData: CreateAuctionDto): Promise<Auction> {
    try {
      // Generate next auction ID
      const lastAuction = await this.collection.findOne(
        {},
        { sort: { auction_id: -1 } }
      );
      const nextAuctionId = lastAuction ? lastAuction.auction_id + 1 : 1;

      // Generate next general ID
      const lastGeneral = await this.collection.findOne(
        {},
        { sort: { id: -1 } }
      );
      const nextId = lastGeneral ? lastGeneral.id + 1 : 1;

      const now = new Date();
      const newAuction: Omit<Auction, "_id"> = {
        title: auctionData.title,
        make: auctionData.make,
        model: auctionData.model,
        year: auctionData.year,
        mileage: auctionData.mileage,
        condition: auctionData.condition,
        vehicle_type: auctionData.vehicle_type,
        description: auctionData.description,
        images: auctionData.images,
        starting_price: auctionData.starting_price,
        reserve_price: auctionData.reserve_price,
        seller_id: auctionData.seller_id,
        id: nextId,
        auction_id: nextAuctionId,
        current_bid: auctionData.starting_price,
        auction_start: now.toISOString(),
        auction_end: auctionData.end_time.toISOString(),
        end_time: auctionData.end_time.toISOString(),
        status: AuctionStatus.PENDING,
        bids: [],
        winner_id: null,
        created_at: now,
        updated_at: now,
      };

      const result = await this.collection.insertOne(newAuction as Auction);

      if (!result.insertedId) {
        throw new Error("Failed to create auction");
      }

      const createdAuction = await this.findById(result.insertedId.toString());
      if (!createdAuction) {
        throw new Error("Failed to retrieve created auction");
      }

      return createdAuction;
    } catch (error) {
      console.error("Error creating auction:", error);
      throw error;
    }
  }

  /**
   * Update auction
   */
  async update(
    id: string,
    updateData: UpdateAuctionDto
  ): Promise<Auction | null> {
    try {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const updateFields: any = {
        ...updateData,
        updated_at: new Date(),
      };

      // Convert end_time to string if provided
      if (updateFields.end_time) {
        updateFields.end_time =
          updateFields.end_time instanceof Date
            ? updateFields.end_time.toISOString()
            : updateFields.end_time;
        updateFields.auction_end = updateFields.end_time;
      }

      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        return null;
      }

      return await this.findById(id);
    } catch (error) {
      console.error("Error updating auction:", error);
      throw new Error("Failed to update auction in database");
    }
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(
    auctionId: string,
    bidData: PlaceBidDto
  ): Promise<Auction | null> {
    try {
      if (!ObjectId.isValid(auctionId)) {
        return null;
      }

      const auction = await this.findById(auctionId);
      if (!auction) {
        return null;
      }

      // Validate bid
      const validation = this.validateBid(auction, bidData.amount);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      const newBid: Bid = {
        user_id: bidData.user_id,
        amount: bidData.amount,
        time: new Date().toISOString(),
      };

      const result = await this.collection.updateOne(
        { _id: new ObjectId(auctionId) },
        {
          $push: { bids: newBid },
          $set: {
            current_bid: bidData.amount,
            updated_at: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return null;
      }

      return await this.findById(auctionId);
    } catch (error) {
      console.error("Error placing bid:", error);
      throw error;
    }
  }

  /**
   * End an auction and determine winner
   */
  async endAuction(auctionId: string): Promise<Auction | null> {
    try {
      if (!ObjectId.isValid(auctionId)) {
        return null;
      }

      const auction = await this.findById(auctionId);
      if (!auction || auction.status !== AuctionStatus.ACTIVE) {
        return null;
      }

      // Determine winner (highest bidder)
      let winner_id = null;
      if (auction.bids.length > 0) {
        const highestBid = auction.bids.reduce((prev, current) =>
          prev.amount > current.amount ? prev : current
        );
        winner_id = highestBid.user_id;
      }

      const result = await this.collection.updateOne(
        { _id: new ObjectId(auctionId) },
        {
          $set: {
            status: AuctionStatus.ENDED,
            winner_id,
            updated_at: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return null;
      }

      return await this.findById(auctionId);
    } catch (error) {
      console.error("Error ending auction:", error);
      throw new Error("Failed to end auction");
    }
  }

  /**
   * Delete auction
   */
  async delete(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) {
        return false;
      }

      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      console.error("Error deleting auction:", error);
      throw new Error("Failed to delete auction from database");
    }
  }

  /**
   * Get auction statistics
   */
  async getStats(): Promise<AuctionStats> {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            total_auctions: { $sum: 1 },
            active_auctions: {
              $sum: {
                $cond: [{ $eq: ["$status", AuctionStatus.ACTIVE] }, 1, 0],
              },
            },
            ended_auctions: {
              $sum: {
                $cond: [{ $eq: ["$status", AuctionStatus.ENDED] }, 1, 0],
              },
            },
            with_bids: {
              $sum: { $cond: [{ $gt: [{ $size: "$bids" }, 0] }, 1, 0] },
            },
            avg_starting_price: { $avg: "$starting_price" },
            average_bid: { $avg: "$current_bid" },
            highest_bid: { $max: "$current_bid" },
          },
        },
      ];

      const result = await this.collection.aggregate(pipeline).toArray();

      if (result.length === 0) {
        return {
          total: 0,
          active: 0,
          ended: 0,
          with_bids: 0,
          avg_starting_price: 0,
          avg_current_bid: 0,
          highest_bid: 0,
        };
      }

      const stats = result[0];
      return {
        total: stats.total_auctions || 0,
        active: stats.active_auctions || 0,
        ended: stats.ended_auctions || 0,
        with_bids: stats.with_bids || 0,
        avg_starting_price: Math.round(stats.avg_starting_price || 0),
        avg_current_bid: Math.round(stats.average_bid || 0),
        highest_bid: stats.highest_bid || 0,
      };
    } catch (error) {
      console.error("Error getting auction stats:", error);
      throw new Error("Failed to get auction statistics");
    }
  }

  /**
   * Validate a bid amount
   */
  private validateBid(
    auction: Auction,
    bidAmount: number
  ): BidValidationResult {
    // Check if auction is active
    if (auction.status !== AuctionStatus.ACTIVE) {
      return {
        isValid: false,
        message: "Auction is not active",
      };
    }

    // Check if auction has ended
    const now = new Date();
    const auctionEnd = new Date(auction.auction_end);
    if (now > auctionEnd) {
      return {
        isValid: false,
        message: "Auction has ended",
      };
    }

    // Check minimum bid amount (current bid + minimum increment)
    const minimumBid = auction.current_bid + 100; // $100 minimum increment
    if (bidAmount < minimumBid) {
      return {
        isValid: false,
        message: `Bid must be at least $${minimumBid}`,
        minimum_bid: minimumBid,
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Transform MongoDB document to Auction interface
   */
  private transformAuction(auction: Auction): Auction {
    return {
      ...auction,
      _id: auction._id,
    };
  }
}

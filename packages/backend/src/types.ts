export const TYPES = {
  // Services
  UserService: Symbol.for("UserService"),
  AuctionService: Symbol.for("AuctionService"),

  // Repositories
  UserRepository: Symbol.for("UserRepository"),
  AuctionRepository: Symbol.for("AuctionRepository"),

  // Controllers
  AppController: Symbol.for("AppController"),
  UserController: Symbol.for("UserController"),
  AuctionController: Symbol.for("AuctionController"),
} as const;

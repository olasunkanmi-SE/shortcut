import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { UserRepository, User, CreateUserDto, UpdateUserDto } from "../repositories/UserRepository";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

@injectable()
export class UserService {
  constructor(@inject(TYPES.UserRepository) private userRepository: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<User | null> {
    if (!id || id.trim() === "") {
      throw new Error("User ID is required");
    }
    return await this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!email || !this.isValidEmail(email)) {
      throw new Error("Valid email is required");
    }
    return await this.userRepository.findByEmail(email);
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password) {
      throw new Error("Name, email, and password are required");
    }

    if (!this.isValidEmail(userData.email)) {
      throw new Error("Invalid email format");
    }

    // Hash password before storing
    const hashedPassword = await this.hashPassword(userData.password);
    
    const userWithHashedPassword = {
      ...userData,
      password: hashedPassword
    };

    return await this.userRepository.create(userWithHashedPassword);
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<User | null> {
    if (!id || id.trim() === "") {
      throw new Error("User ID is required");
    }

    // Validate email if provided
    if (updateData.email && !this.isValidEmail(updateData.email)) {
      throw new Error("Valid email is required");
    }

    // Sanitize input
    const sanitizedData: UpdateUserDto = {};
    if (updateData.name) {
      sanitizedData.name = updateData.name.trim();
    }
    if (updateData.email) {
      sanitizedData.email = updateData.email.toLowerCase().trim();
    }

    return await this.userRepository.update(id, sanitizedData);
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!id || id.trim() === "") {
      throw new Error("User ID is required");
    }
    return await this.userRepository.delete(id);
  }

  async getUserCount(): Promise<number> {
    return await this.userRepository.count();
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null; // Don't reveal that user doesn't exist
    }

    // Check if user has a password (for now, we'll assume all users have passwords)
    // In a real app, you'd store hashed passwords
    const isPasswordValid = await this.comparePassword(password, user.password || '');
    if (!isPasswordValid) {
      return null;
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user as any;
    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Generate JWT token for user
   */
  private generateToken(user: User): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      jwtSecret,
      {
        expiresIn: '24h',
        issuer: 'auction-app',
        audience: 'auction-users'
      }
    );
  }

  /**
   * Compare password with hash
   */
  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!hashedPassword) {
      return false;
    }
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { UserRepository, User, CreateUserDto, UpdateUserDto } from "../repositories/UserRepository";

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
    // Validation
    if (!userData.name || userData.name.trim() === "") {
      throw new Error("Name is required");
    }
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error("Valid email is required");
    }

    // Sanitize input
    const sanitizedData: CreateUserDto = {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
    };

    return await this.userRepository.create(sanitizedData);
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

import { injectable } from "inversify";
import { ObjectId, Collection } from "mongodb";
import { getDB } from "../infrastructure/db";

export interface User {
  _id?: ObjectId;
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

@injectable()
export class UserRepository {
  private get collection(): Collection<User> {
    return getDB().collection<User>("users");
  }

  async findAll(): Promise<User[]> {
    try {
      const users = await this.collection.find({}).toArray();
      return users.map(this.transformUser);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users from database");
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const user = await this.collection.findOne({ _id: new ObjectId(id) });
      return user ? this.transformUser(user) : null;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw new Error("Failed to fetch user from database");
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.collection.findOne({ email });
      return user ? this.transformUser(user) : null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw new Error("Failed to fetch user from database");
    }
  }

  async create(userData: CreateUserDto): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const now = new Date();
      const newUser: Omit<User, "_id" | "id"> = {
        ...userData,
        createdAt: now,
        updatedAt: now,
      };

      const result = await this.collection.insertOne(newUser as User);

      if (!result.insertedId) {
        throw new Error("Failed to create user");
      }

      const createdUser = await this.findById(result.insertedId.toString());
      if (!createdUser) {
        throw new Error("Failed to retrieve created user");
      }

      return createdUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async update(id: string, updateData: UpdateUserDto): Promise<User | null> {
    try {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

      if (result.matchedCount === 0) {
        return null;
      }

      return await this.findById(id);
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user in database");
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) {
        return false;
      }

      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user from database");
    }
  }

  async count(): Promise<number> {
    try {
      return await this.collection.countDocuments();
    } catch (error) {
      console.error("Error counting users:", error);
      throw new Error("Failed to count users in database");
    }
  }

  // Transform MongoDB document to our User interface
  private transformUser(user: User): User {
    return {
      id: user._id?.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

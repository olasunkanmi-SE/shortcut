import { injectable } from "inversify";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
}

@injectable()
export class UserService {
  private users: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date("2023-01-01"),
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      createdAt: new Date("2023-01-02"),
    },
  ];

  public async getAllUsers(): Promise<User[]> {
    // Simulate async operation
    return Promise.resolve(this.users);
  }

  public async getUserById(id: string): Promise<User | null> {
    // Simulate async operation
    const user = this.users.find((u) => u.id === id);
    return Promise.resolve(user || null);
  }

  public async createUser(userData: CreateUserDto): Promise<User> {
    // Simulate async operation
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      ...userData,
      createdAt: new Date(),
    };

    this.users.push(newUser);
    return Promise.resolve(newUser);
  }
}

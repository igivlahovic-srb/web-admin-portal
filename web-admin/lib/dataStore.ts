import { User, ServiceTicket } from "../types";

// In-memory storage (would be database in production)
let users: User[] = [];
let tickets: ServiceTicket[] = [];

export const dataStore = {
  // Users
  getUsers: () => users,
  setUsers: (newUsers: User[]) => {
    users = newUsers;
  },
  addUser: (user: User) => {
    users.push(user);
  },
  updateUser: (id: string, updates: Partial<User>) => {
    users = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
  },
  deleteUser: (id: string) => {
    users = users.filter((u) => u.id !== id);
  },

  // Tickets
  getTickets: () => tickets,
  setTickets: (newTickets: ServiceTicket[]) => {
    tickets = newTickets;
  },
  addTicket: (ticket: ServiceTicket) => {
    tickets.push(ticket);
  },

  // Auth
  authenticateUser: (username: string, password: string) => {
    const user = users.find(
      (u) => u.username === username && u.password === password && u.isActive
    );
    if (user && user.role === "super_user") {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },
};

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface UsersState {
  users: User[];
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, fullName: string) => Promise<User | null>;
  logout: () => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const initialUsers: User[] = [
  {
    id: "user1",
    email: "admin@mgmmuseum.org",
    fullName: "Admin User",
    phone: "+91 98765 43210",
    role: "super_admin",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "user2",
    email: "rajesh@example.com",
    fullName: "Rajesh Kumar",
    phone: "+91 98765 43211",
    role: "customer",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      currentUser: null,

      login: async (email, password) => {
        // Simulate authentication
        const user = get().users.find((u) => u.email === email);
        if (user) {
          set({ currentUser: user });
          return user;
        }
        return null;
      },

      signup: async (email, password, fullName) => {
        const id = Date.now().toString();
        const newUser: User = {
          id,
          email,
          fullName,
          role: "customer",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
        }));
        return newUser;
      },

      logout: () => {
        set({ currentUser: null });
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id
              ? { ...user, ...updates, updatedAt: new Date() }
              : user
          ),
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },
    }),
    {
      name: "mgm-users-storage",
    }
  )
);


















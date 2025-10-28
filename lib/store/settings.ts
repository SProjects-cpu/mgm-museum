import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MuseumSettings {
  name: string;
  shortName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  openingHours: {
    weekdays: { open: string; close: string };
    closedDays: number[];
  };
  bookingSettings: {
    maxAdvanceBookingDays: number;
    minAdvanceBookingHours: number;
    maxTicketsPerBooking: number;
    cancellationCutoffHours: number;
    serviceFeePercentage: number;
  };
}

interface SettingsState {
  settings: MuseumSettings;
  updateSettings: (updates: Partial<MuseumSettings>) => void;
  updateOpeningHours: (hours: MuseumSettings["openingHours"]) => void;
  updateBookingSettings: (settings: Partial<MuseumSettings["bookingSettings"]>) => void;
}

const initialSettings: MuseumSettings = {
  name: "MGM APJ Abdul Kalam Astrospace Science Centre & Club",
  shortName: "MGM Museum",
  email: "info@mgmapjscicentre.org",
  phone: "+91 (240) 123-4567",
  address: {
    street: "MGM Campus",
    city: "Aurangabad",
    state: "Maharashtra",
    pincode: "431003",
  },
  openingHours: {
    weekdays: { open: "09:30", close: "17:30" },
    closedDays: [1], // Monday
  },
  bookingSettings: {
    maxAdvanceBookingDays: 90,
    minAdvanceBookingHours: 2,
    maxTicketsPerBooking: 50,
    cancellationCutoffHours: 24,
    serviceFeePercentage: 2,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: initialSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      updateOpeningHours: (hours) => {
        set((state) => ({
          settings: { ...state.settings, openingHours: hours },
        }));
      },

      updateBookingSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            bookingSettings: {
              ...state.settings.bookingSettings,
              ...settings,
            },
          },
        }));
      },
    }),
    {
      name: "mgm-settings-storage",
    }
  )
);


















import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface PriceBreakdown {
  days: number;
  pricePerDay: number;
  subtotal: number;
  insuranceCost: number;
  deliveryCost: number;
  discount: number;
  total: number;
}

interface BookingDraft {
  vehicleId: string | null;
  vehicleName: string | null;
  locationId: string | null;
  startDate: string | null;
  endDate: string | null;
  insuranceAddOn: boolean;
  deliveryRequested: boolean;
  deliveryAddress: string;
  couponCode: string;
}

interface BookingState {
  draft: BookingDraft;
  quote: PriceBreakdown | null;
  isQuoteLoading: boolean;
  quoteError: string | null;

  setVehicle: (vehicleId: string, vehicleName: string) => void;
  setDates: (startDate: string, endDate: string) => void;
  setLocation: (locationId: string) => void;
  setInsuranceAddOn: (value: boolean) => void;
  setDeliveryRequested: (value: boolean, address?: string) => void;
  setCouponCode: (code: string) => void;
  fetchQuote: () => Promise<void>;
  reset: () => void;
}

const initialDraft: BookingDraft = {
  vehicleId: null,
  vehicleName: null,
  locationId: null,
  startDate: null,
  endDate: null,
  insuranceAddOn: false,
  deliveryRequested: false,
  deliveryAddress: '',
  couponCode: '',
};

export const useBookingStore = create<BookingState>((set, get) => ({
  draft: initialDraft,
  quote: null,
  isQuoteLoading: false,
  quoteError: null,

  setVehicle: (vehicleId, vehicleName) =>
    set((state) => ({ draft: { ...state.draft, vehicleId, vehicleName } })),

  setDates: (startDate, endDate) =>
    set((state) => ({ draft: { ...state.draft, startDate, endDate } })),

  setLocation: (locationId) => set((state) => ({ draft: { ...state.draft, locationId } })),

  setInsuranceAddOn: (value) =>
    set((state) => ({ draft: { ...state.draft, insuranceAddOn: value } })),

  setDeliveryRequested: (value, address) =>
    set((state) => ({
      draft: {
        ...state.draft,
        deliveryRequested: value,
        deliveryAddress: address ?? state.draft.deliveryAddress,
      },
    })),

  setCouponCode: (code) => set((state) => ({ draft: { ...state.draft, couponCode: code } })),

  fetchQuote: async () => {
    const { draft } = get();

    if (!draft.vehicleId || !draft.startDate || !draft.endDate) {
      set({ quote: null, quoteError: null });
      return;
    }

    set({ isQuoteLoading: true, quoteError: null });

    try {
      const params = new URLSearchParams({
        vehicleId: draft.vehicleId,
        startDate: draft.startDate,
        endDate: draft.endDate,
        insuranceAddOn: String(draft.insuranceAddOn),
        deliveryRequested: String(draft.deliveryRequested),
        ...(draft.couponCode ? { couponCode: draft.couponCode } : {}),
        ...(draft.locationId ? { locationId: draft.locationId } : {}),
      });

      const quote = await apiClient.get<PriceBreakdown>(`/bookings/quote?${params.toString()}`);
      set({ quote, isQuoteLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not calculate a quote.';
      set({ quote: null, isQuoteLoading: false, quoteError: message });
    }
  },

  reset: () => set({ draft: initialDraft, quote: null, quoteError: null }),
}));

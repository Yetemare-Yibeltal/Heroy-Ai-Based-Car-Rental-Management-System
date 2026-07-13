export type SubscriptionPlan = 'WEEKLY' | 'MONTHLY';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface CreateSubscriptionInput {
  vehicleId: string;
  plan: SubscriptionPlan;
  startDate: string;
}

export interface SubscriptionOutput {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  pricePerPeriod: number;
  startDate: Date;
  nextBillingDate: Date;
  createdAt: Date;
}

export type Gender = 'male' | 'female';

export interface Participant {
  id: string;
  name: string;
  gender?: Gender;
}

export type VehicleType = '4-seater' | '5-seater' | '7-seater' | '8-seater' | 'hiace-10' | 'hiace-14';
export type VehicleCategory = 'private' | 'rental';
export type CostType = 'one-way' | 'round-trip';

export interface CostDetail {
  amount: number;
  type: CostType;
}

export interface SeatPosition {
  row: number;
  seat: number;
  isDriver?: boolean;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  category: VehicleCategory;
  rentalCost?: number;
  gasCost?: CostDetail;
  highwayCost?: CostDetail;
  seats: { [key: string]: string };
}

export interface BasicInfo {
  purpose: string;
  departureTime: string;
  meetingPlace: string;
}

export interface CalculationResult {
  totalCost: number;
  totalParticipants: number;
  perPersonCost: number;
  totalCollected: number;
  totalDriverLoss: number;
  vehicleCollections: Array<{
    vehicleId: string;
    driverName: string;
    passengerCount: number;
    collectionAmount: number;
  }>;
  driverAdjustments: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
  driverFinalBalances: Array<{
    driverName: string;
    vehicleCost: number;
    collectedAmount: number;
    finalBalance: number;
  }>;
}

export interface DualCalculationResult {
  roundUp: CalculationResult;
  roundDown: CalculationResult;
  recommendedMethod: 'roundUp' | 'roundDown';
}

export interface TripCalculationResult {
  outboundCost: number;
  returnCost: number;
  outboundParticipants: number;
  returnParticipants: number;
  totalCost: number;
  allParticipants: number;
  outboundPerPerson: number;
  returnPerPerson: number;
  participantCosts: Array<{
    participantId: string;
    name: string;
    isDriver: boolean;
    outboundCost: number;
    returnCost: number;
    totalCost: number;
  }>;
  outboundCollections: Array<{
    vehicleId: string;
    driverName: string;
    passengerCount: number;
    perPersonCost: number;
    collectionAmount: number;
  }>;
  returnCollections: Array<{
    vehicleId: string;
    driverName: string;
    passengerCount: number;
    perPersonCost: number;
    collectionAmount: number;
  }>;
  driverAdjustments: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
  driverFinalBalances: Array<{
    driverName: string;
    outboundCost: number;
    returnCost: number;
    totalVehicleCost: number;
    collectedAmount: number;
    finalBalance: number;
  }>;
}

export interface DualTripCalculationResult {
  roundUp: TripCalculationResult;
  roundDown: TripCalculationResult;
  recommendedMethod: 'roundUp' | 'roundDown';
  returnAdjustment: number;
}

export function getDriverSeatKey(vehicleType: VehicleType): string {
  const config = VEHICLE_CONFIGS[vehicleType];
  const driverRow = config.layout.find(row => row.isDriverRow);
  if (driverRow) {
    return `0-${driverRow.seats - 1}`;
  }
  return '0-1';
}

export const VEHICLE_CONFIGS: Record<VehicleType, {
  name: string;
  capacity: number;
  layout: Array<{ row: number; seats: number; isDriverRow?: boolean }>;
}> = {
  '4-seater': {
    name: '4人乗り',
    capacity: 4,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 2 }
    ]
  },
  '5-seater': {
    name: '5人乗り',
    capacity: 5,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 3 }
    ]
  },
  '7-seater': {
    name: '7人乗り',
    capacity: 7,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 2 },
      { row: 2, seats: 3 }
    ]
  },
  '8-seater': {
    name: '8人乗り',
    capacity: 8,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 3 },
      { row: 2, seats: 3 }
    ]
  },
  'hiace-10': {
    name: 'ハイエースバン(10人乗り)',
    capacity: 10,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 4 },
      { row: 2, seats: 4 }
    ]
  },
  'hiace-14': {
    name: 'ハイエースバン(14人乗り)',
    capacity: 14,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 4 },
      { row: 2, seats: 4 },
      { row: 3, seats: 4 }
    ]
  }
};

export type Gender = 'male' | 'female';

export interface Participant {
  id: string;
  name: string;
  gender?: Gender;
}

export type VehicleType = '4-seater' | '5-seater' | '7-seater' | '8-seater' | 'hiace-10' | 'custom';
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

export interface SeatAssignment {
  participantId?: string;
  name: string;
  gender: Gender;
  isManualEntry: boolean;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  category: VehicleCategory;
  customCapacity?: number;
  rentalCost?: number;
  gasCost?: CostDetail;
  highwayCost?: CostDetail;
  seats: { [key: string]: SeatAssignment };
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
  outboundAdjustment: number;
  returnAdjustment: number;
}

export function getDriverSeatKey(vehicle: Vehicle): string {
  const config = getVehicleConfig(vehicle);
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
    name: 'ハイエース(10人乗り)',
    capacity: 10,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 3 },
      { row: 2, seats: 2 },
      { row: 3, seats: 3 }
    ]
  },
  'custom': {
    name: 'カスタム',
    capacity: 5,
    layout: [
      { row: 0, seats: 2, isDriverRow: true },
      { row: 1, seats: 3 }
    ]
  }
};

export function getVehicleConfig(vehicle: Vehicle): {
  name: string;
  capacity: number;
  layout: Array<{ row: number; seats: number; isDriverRow?: boolean }>;
} {
  const baseConfig = VEHICLE_CONFIGS[vehicle.type];

  if (vehicle.type === 'custom' && vehicle.customCapacity && vehicle.customCapacity >= 2) {
    const capacity = vehicle.customCapacity;
    const layout: Array<{ row: number; seats: number; isDriverRow?: boolean }> = [
      { row: 0, seats: 2, isDriverRow: true }
    ];

    let remainingSeats = capacity - 2;
    let row = 1;

    while (remainingSeats > 0) {
      if (remainingSeats >= 4) {
        layout.push({ row, seats: 4 });
        remainingSeats -= 4;
      } else if (remainingSeats === 3) {
        layout.push({ row, seats: 3 });
        remainingSeats = 0;
      } else if (remainingSeats === 2) {
        layout.push({ row, seats: 2 });
        remainingSeats = 0;
      } else {
        layout.push({ row, seats: 1 });
        remainingSeats = 0;
      }
      row++;
    }

    return {
      name: `カスタム(${capacity}人乗り)`,
      capacity,
      layout
    };
  }

  return baseConfig;
}

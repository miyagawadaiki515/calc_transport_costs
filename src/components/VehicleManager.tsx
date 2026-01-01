import { useState } from 'react';
import { Vehicle, Participant, VehicleType, VehicleCategory, CostDetail, SeatAssignment, getVehicleConfig } from '../types';
import VehicleCard from './VehicleCard';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  participants: Participant[];
  direction: 'outbound' | 'return';
  linkedVehicles: Vehicle[];
  onAddVehicle: () => void;
  onRemoveVehicle: (id: string) => void;
  onVehicleTypeChange: (id: string, type: VehicleType) => void;
  onVehicleCategoryChange: (id: string, category: VehicleCategory) => void;
  onCustomCapacityChange: (id: string, capacity: number) => void;
  onRentalCostChange: (id: string, cost: number) => void;
  onGasCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onHighwayCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onAssignSeat: (vehicleId: string, seatKey: string, assignment: SeatAssignment) => void;
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
  onToggleGender: (vehicleId: string, seatKey: string) => void;
}

export default function VehicleManager({
  vehicles,
  participants,
  direction,
  linkedVehicles,
  onAddVehicle,
  onRemoveVehicle,
  onVehicleTypeChange,
  onVehicleCategoryChange,
  onCustomCapacityChange,
  onRentalCostChange,
  onGasCostChange,
  onHighwayCostChange,
  onAssignSeat,
  onRemoveFromSeat,
  onToggleGender
}: VehicleManagerProps) {
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(
    new Set(vehicles.map(v => v.id))
  );

  const toggleVehicle = (vehicleId: string) => {
    setExpandedVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  const getTotalCost = (vehicle: Vehicle) => {
    let total = 0;
    if (vehicle.rentalCost) total += vehicle.rentalCost;
    if (vehicle.gasCost) total += vehicle.gasCost.amount;
    if (vehicle.highwayCost) total += vehicle.highwayCost.amount;
    return total;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onAddVehicle}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 min-h-[44px]"
        >
          <Plus size={20} />
          車を追加
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-lg">
          <p>車両を追加してください</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-4">
            {vehicles.map((vehicle, index) => {
              const linkedVehicle = linkedVehicles.find((_, i) => i === index);
              const isExpanded = expandedVehicles.has(vehicle.id);
              const totalCost = getTotalCost(vehicle);
              const vehicleConfig = getVehicleConfig(vehicle);
              const categoryText = vehicle.category === 'private' ? '自家用車' : 'レンタカー';

              return (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <button
                    onClick={() => toggleVehicle(vehicle.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[60px]"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                      <div className="text-left">
                        <h3 className="text-base font-bold text-gray-800">
                          車両{index + 1} ({vehicleConfig.name}・{categoryText})
                        </h3>
                        <p className="text-sm text-gray-600">費用: {totalCost.toLocaleString()}円</p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200">
                      <VehicleCard
                        vehicle={vehicle}
                        index={index}
                        participants={participants}
                        direction={direction}
                        allVehicles={vehicles}
                        linkedVehicle={linkedVehicle}
                        onTypeChange={onVehicleTypeChange}
                        onCategoryChange={onVehicleCategoryChange}
                        onCustomCapacityChange={onCustomCapacityChange}
                        onRentalCostChange={onRentalCostChange}
                        onGasCostChange={onGasCostChange}
                        onHighwayCostChange={onHighwayCostChange}
                        onRemove={onRemoveVehicle}
                        onAssignSeat={onAssignSeat}
                        onRemoveFromSeat={onRemoveFromSeat}
                        onToggleGender={onToggleGender}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={onAddVehicle}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 min-h-[44px]"
            >
              <Plus size={20} />
              車を追加
            </button>
          </div>

          <div className="hidden md:flex md:flex-col lg:flex-row gap-6 lg:overflow-x-auto pb-4">
            {vehicles.map((vehicle, index) => {
              const linkedVehicle = linkedVehicles.find((_, i) => i === index);
              return (
                <div key={vehicle.id} className="lg:flex-shrink-0 lg:w-96">
                  <VehicleCard
                    vehicle={vehicle}
                    index={index}
                    participants={participants}
                    direction={direction}
                    allVehicles={vehicles}
                    linkedVehicle={linkedVehicle}
                    onTypeChange={onVehicleTypeChange}
                    onCategoryChange={onVehicleCategoryChange}
                    onCustomCapacityChange={onCustomCapacityChange}
                    onRentalCostChange={onRentalCostChange}
                    onGasCostChange={onGasCostChange}
                    onHighwayCostChange={onHighwayCostChange}
                    onRemove={onRemoveVehicle}
                    onAssignSeat={onAssignSeat}
                    onRemoveFromSeat={onRemoveFromSeat}
                    onToggleGender={onToggleGender}
                  />
                </div>
              );
            })}
            <div className="lg:flex-shrink-0 lg:w-96 flex items-center">
              <button
                onClick={onAddVehicle}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 min-h-[44px]"
              >
                <Plus size={20} />
                車を追加
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

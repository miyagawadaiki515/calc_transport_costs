import { Vehicle, Participant, VehicleType, VehicleCategory, CostDetail } from '../types';
import VehicleCard from './VehicleCard';
import { Plus } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  participants: Participant[];
  direction: 'outbound' | 'return';
  linkedVehicles: Vehicle[];
  onAddVehicle: () => void;
  onRemoveVehicle: (id: string) => void;
  onVehicleTypeChange: (id: string, type: VehicleType) => void;
  onVehicleCategoryChange: (id: string, category: VehicleCategory) => void;
  onRentalCostChange: (id: string, cost: number) => void;
  onGasCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onHighwayCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
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
  onRentalCostChange,
  onGasCostChange,
  onHighwayCostChange,
  onRemoveFromSeat
}: VehicleManagerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onAddVehicle}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
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
        <div className="flex gap-6 overflow-x-auto pb-4">
          {vehicles.map((vehicle, index) => {
            const linkedVehicle = linkedVehicles.find((_, i) => i === index);
            return (
              <div key={vehicle.id} className="flex-shrink-0 w-96">
                <VehicleCard
                  vehicle={vehicle}
                  index={index}
                  participants={participants}
                  direction={direction}
                  linkedVehicle={linkedVehicle}
                  onTypeChange={onVehicleTypeChange}
                  onCategoryChange={onVehicleCategoryChange}
                  onRentalCostChange={onRentalCostChange}
                  onGasCostChange={onGasCostChange}
                  onHighwayCostChange={onHighwayCostChange}
                  onRemove={onRemoveVehicle}
                  onRemoveFromSeat={onRemoveFromSeat}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

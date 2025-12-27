import { Vehicle, Participant, VehicleType } from '../types';
import VehicleCard from './VehicleCard';
import { Plus } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  participants: Participant[];
  onAddVehicle: () => void;
  onRemoveVehicle: (id: string) => void;
  onVehicleTypeChange: (id: string, type: VehicleType) => void;
  onVehicleCostChange: (id: string, cost: number) => void;
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
}

export default function VehicleManager({
  vehicles,
  participants,
  onAddVehicle,
  onRemoveVehicle,
  onVehicleTypeChange,
  onVehicleCostChange,
  onRemoveFromSeat
}: VehicleManagerProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">車両管理</h2>
        <button
          onClick={onAddVehicle}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          車を追加
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>車両を追加してください</p>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {vehicles.map((vehicle, index) => (
            <div key={vehicle.id} className="flex-shrink-0 w-96">
              <VehicleCard
                vehicle={vehicle}
                index={index}
                participants={participants}
                onTypeChange={onVehicleTypeChange}
                onCostChange={onVehicleCostChange}
                onRemove={onRemoveVehicle}
                onRemoveFromSeat={onRemoveFromSeat}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

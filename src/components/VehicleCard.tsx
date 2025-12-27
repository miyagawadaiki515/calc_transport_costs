import { Vehicle, Participant, VEHICLE_CONFIGS, VehicleType } from '../types';
import SeatLayout from './SeatLayout';
import { Car, Trash2 } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
  participants: Participant[];
  onTypeChange: (id: string, type: VehicleType) => void;
  onCostChange: (id: string, cost: number) => void;
  onRemove: (id: string) => void;
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
}

export default function VehicleCard({
  vehicle,
  index,
  participants,
  onTypeChange,
  onCostChange,
  onRemove,
  onRemoveFromSeat
}: VehicleCardProps) {
  const driverSeatKey = '0-0';
  const driverParticipantId = vehicle.seats[driverSeatKey];
  const hasDriver = !!driverParticipantId;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Car size={24} className="text-gray-600" />
          <h3 className="text-lg font-bold text-gray-800">車両 {index + 1}</h3>
          {!hasDriver && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
              運転手未設定
            </span>
          )}
        </div>
        <button
          onClick={() => onRemove(vehicle.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="車両を削除"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            車両タイプ
          </label>
          <select
            value={vehicle.type}
            onChange={(e) => onTypeChange(vehicle.id, e.target.value as VehicleType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(VEHICLE_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            かかる金額（円）
          </label>
          <input
            type="number"
            value={vehicle.cost || ''}
            onChange={(e) => onCostChange(vehicle.id, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">座席配置</h4>
        <SeatLayout
          vehicle={vehicle}
          participants={participants}
          onRemoveFromSeat={onRemoveFromSeat}
        />
      </div>
    </div>
  );
}

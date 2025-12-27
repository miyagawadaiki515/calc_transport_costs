import { Vehicle, Participant, VEHICLE_CONFIGS, VehicleType, VehicleCategory, CostDetail } from '../types';
import SeatLayout from './SeatLayout';
import { Car, Trash2 } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
  participants: Participant[];
  direction: 'outbound' | 'return';
  linkedVehicle?: Vehicle;
  onTypeChange: (id: string, type: VehicleType) => void;
  onCategoryChange: (id: string, category: VehicleCategory) => void;
  onRentalCostChange: (id: string, cost: number) => void;
  onGasCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onHighwayCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onRemove: (id: string) => void;
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
}

export default function VehicleCard({
  vehicle,
  index,
  participants,
  direction,
  linkedVehicle,
  onTypeChange,
  onCategoryChange,
  onRentalCostChange,
  onGasCostChange,
  onHighwayCostChange,
  onRemove,
  onRemoveFromSeat
}: VehicleCardProps) {
  const driverSeatKey = '0-0';
  const driverParticipantId = vehicle.seats[driverSeatKey];
  const hasDriver = !!driverParticipantId;

  const isGasDisabledByLinked = direction === 'return' && linkedVehicle?.gasCost?.type === 'round-trip';
  const isHighwayDisabledByLinked = direction === 'return' && linkedVehicle?.highwayCost?.type === 'round-trip';
  const isRentalDisabledByLinked = direction === 'return' && linkedVehicle?.category === 'rental';

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

      <div className="space-y-4 mb-6">
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
            車両区分
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="private"
                checked={vehicle.category === 'private'}
                onChange={() => onCategoryChange(vehicle.id, 'private')}
                className="mr-2"
              />
              <span className="text-sm">自家用車</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="rental"
                checked={vehicle.category === 'rental'}
                onChange={() => onCategoryChange(vehicle.id, 'rental')}
                className="mr-2"
              />
              <span className="text-sm">レンタカー</span>
            </label>
          </div>
        </div>

        {vehicle.category === 'rental' && (
          <div>
            {isRentalDisabledByLinked ? (
              <div className="bg-gray-100 px-3 py-2 rounded-md border border-gray-300">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  レンタカー代（往復分）
                </label>
                <p className="text-sm text-gray-500 italic">往復分として計上済み</p>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  レンタカー代（往復分）
                </label>
                <input
                  type="number"
                  value={vehicle.rentalCost || ''}
                  onChange={(e) => onRentalCostChange(vehicle.id, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
              </>
            )}
          </div>
        )}

        <div>
          {isGasDisabledByLinked ? (
            <div className="bg-gray-100 px-3 py-2 rounded-md border border-gray-300">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                ガソリン代
              </label>
              <p className="text-sm text-gray-500 italic">往復分として計上済み</p>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ガソリン代
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={vehicle.gasCost?.amount || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value);
                    if (amount) {
                      onGasCostChange(vehicle.id, {
                        amount,
                        type: vehicle.gasCost?.type || 'one-way'
                      });
                    } else {
                      onGasCostChange(vehicle.id, undefined);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
                <select
                  value={vehicle.gasCost?.type || 'one-way'}
                  onChange={(e) => {
                    if (vehicle.gasCost) {
                      onGasCostChange(vehicle.id, {
                        amount: vehicle.gasCost.amount,
                        type: e.target.value as 'one-way' | 'round-trip'
                      });
                    }
                  }}
                  disabled={!vehicle.gasCost}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="one-way">片道</option>
                  <option value="round-trip">往復</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div>
          {isHighwayDisabledByLinked ? (
            <div className="bg-gray-100 px-3 py-2 rounded-md border border-gray-300">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                高速代
              </label>
              <p className="text-sm text-gray-500 italic">往復分として計上済み</p>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                高速代
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={vehicle.highwayCost?.amount || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value);
                    if (amount) {
                      onHighwayCostChange(vehicle.id, {
                        amount,
                        type: vehicle.highwayCost?.type || 'one-way'
                      });
                    } else {
                      onHighwayCostChange(vehicle.id, undefined);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
                <select
                  value={vehicle.highwayCost?.type || 'one-way'}
                  onChange={(e) => {
                    if (vehicle.highwayCost) {
                      onHighwayCostChange(vehicle.id, {
                        amount: vehicle.highwayCost.amount,
                        type: e.target.value as 'one-way' | 'round-trip'
                      });
                    }
                  }}
                  disabled={!vehicle.highwayCost}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="one-way">片道</option>
                  <option value="round-trip">往復</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">座席配置</h4>
        <SeatLayout
          vehicle={vehicle}
          participants={participants}
          direction={direction}
          onRemoveFromSeat={onRemoveFromSeat}
        />
      </div>
    </div>
  );
}

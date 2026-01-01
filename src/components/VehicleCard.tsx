import { useState, useEffect } from 'react';
import { Vehicle, Participant, VEHICLE_CONFIGS, getVehicleConfig, VehicleType, VehicleCategory, CostDetail, SeatAssignment } from '../types';
import SeatLayout from './SeatLayout';
import { Car, Trash2 } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
  participants: Participant[];
  direction: 'outbound' | 'return';
  allVehicles: Vehicle[];
  linkedVehicle?: Vehicle;
  onTypeChange: (id: string, type: VehicleType) => void;
  onCategoryChange: (id: string, category: VehicleCategory) => void;
  onCustomCapacityChange: (id: string, capacity: number) => void;
  onRentalCostChange: (id: string, cost: number) => void;
  onGasCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onHighwayCostChange: (id: string, costDetail: CostDetail | undefined) => void;
  onRemove: (id: string) => void;
  onAssignSeat: (vehicleId: string, seatKey: string, assignment: SeatAssignment) => void;
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
  onToggleGender: (vehicleId: string, seatKey: string) => void;
}

export default function VehicleCard({
  vehicle,
  index,
  participants,
  direction,
  allVehicles,
  linkedVehicle,
  onTypeChange,
  onCategoryChange,
  onCustomCapacityChange,
  onRentalCostChange,
  onGasCostChange,
  onHighwayCostChange,
  onRemove,
  onAssignSeat,
  onRemoveFromSeat,
  onToggleGender
}: VehicleCardProps) {
  const driverSeatKey = '0-1';
  const driverSeat = vehicle.seats[driverSeatKey];
  const hasDriver = !!driverSeat;

  const [localCapacity, setLocalCapacity] = useState<string>(String(vehicle.customCapacity ?? 5));

  useEffect(() => {
    setLocalCapacity(String(vehicle.customCapacity ?? 5));
  }, [vehicle.customCapacity]);

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

        {vehicle.type === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              乗車人数
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={localCapacity}
              onChange={(e) => {
                const value = e.target.value;
                setLocalCapacity(value);
                if (value !== '' && !isNaN(parseInt(value))) {
                  const numValue = parseInt(value);
                  if (numValue >= 1) {
                    onCustomCapacityChange(vehicle.id, numValue);
                  }
                }
              }}
              onBlur={() => {
                const numValue = parseInt(localCapacity);
                if (isNaN(numValue) || numValue < 2) {
                  setLocalCapacity('2');
                  onCustomCapacityChange(vehicle.id, 2);
                } else if (numValue > 50) {
                  setLocalCapacity('50');
                  onCustomCapacityChange(vehicle.id, 50);
                }
              }}
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              placeholder="5"
              min="2"
              max="50"
            />
            <p className="text-xs text-gray-500 mt-1">2〜50人まで設定可能</p>
          </div>
        )}

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
                  inputMode="numeric"
                  value={vehicle.rentalCost ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      onRentalCostChange(vehicle.id, 0);
                    } else {
                      const amount = parseInt(value, 10);
                      if (!isNaN(amount) && amount >= 0) {
                        onRentalCostChange(vehicle.id, amount);
                      }
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
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
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={vehicle.gasCost?.amount ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      onGasCostChange(vehicle.id, undefined);
                    } else {
                      const amount = parseInt(value, 10);
                      if (!isNaN(amount) && amount >= 0) {
                        onGasCostChange(vehicle.id, {
                          amount,
                          type: vehicle.gasCost?.type || 'one-way'
                        });
                      }
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="0"
                  min="0"
                />
                <select
                  value={vehicle.gasCost?.type || 'one-way'}
                  onChange={(e) => {
                    if (vehicle.gasCost) {
                      onGasCostChange(vehicle.id, {
                        amount: Math.round(vehicle.gasCost.amount),
                        type: e.target.value as 'one-way' | 'round-trip'
                      });
                    }
                  }}
                  disabled={!vehicle.gasCost}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 min-h-[44px]"
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
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={vehicle.highwayCost?.amount ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      onHighwayCostChange(vehicle.id, undefined);
                    } else {
                      const amount = parseInt(value, 10);
                      if (!isNaN(amount) && amount >= 0) {
                        onHighwayCostChange(vehicle.id, {
                          amount,
                          type: vehicle.highwayCost?.type || 'one-way'
                        });
                      }
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="0"
                  min="0"
                />
                <select
                  value={vehicle.highwayCost?.type || 'one-way'}
                  onChange={(e) => {
                    if (vehicle.highwayCost) {
                      onHighwayCostChange(vehicle.id, {
                        amount: Math.round(vehicle.highwayCost.amount),
                        type: e.target.value as 'one-way' | 'round-trip'
                      });
                    }
                  }}
                  disabled={!vehicle.highwayCost}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 min-h-[44px]"
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
          allVehicles={allVehicles}
          onAssignSeat={onAssignSeat}
          onRemoveFromSeat={onRemoveFromSeat}
          onToggleGender={onToggleGender}
        />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { BasicInfo, Participant, Vehicle, VehicleType, VehicleCategory, CostDetail, SeatAssignment, getDriverSeatKey, DualTripCalculationResult } from './types';
import BasicInfoForm from './components/BasicInfoForm';
import ParticipantInput from './components/ParticipantInput';
import VehicleManager from './components/VehicleManager';
import CalculationResult from './components/CalculationResult';
import { calculateRoundTripCosts } from './utils/calculations';
import { exportToCSV, importFromCSV } from './utils/csv';
import { Calculator, AlertCircle } from 'lucide-react';
import logo from '/carpool-logo.svg';

export default function App() {
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    purpose: '',
    departureTime: '',
    meetingPlace: ''
  });

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [outboundVehicles, setOutboundVehicles] = useState<Vehicle[]>([]);
  const [returnVehicles, setReturnVehicles] = useState<Vehicle[]>([]);
  const [result, setResult] = useState<DualTripCalculationResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleImportNames = (names: string[]) => {
    const newParticipants: Participant[] = names.map(name => ({
      id: `participant-${Date.now()}-${Math.random()}`,
      name
    }));
    setParticipants(prev => [...prev, ...newParticipants]);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setOutboundVehicles(prev =>
      prev.map(v => ({
        ...v,
        seats: Object.fromEntries(
          Object.entries(v.seats).filter(([_, seat]) => seat.participantId !== id)
        )
      }))
    );
    setReturnVehicles(prev =>
      prev.map(v => ({
        ...v,
        seats: Object.fromEntries(
          Object.entries(v.seats).filter(([_, seat]) => seat.participantId !== id)
        )
      }))
    );
  };

  const handleAddVehicle = (direction: 'outbound' | 'return') => {
    const newVehicle: Vehicle = {
      id: `vehicle-${direction}-${Date.now()}`,
      type: '5-seater',
      category: 'private',
      seats: {}
    };
    if (direction === 'outbound') {
      setOutboundVehicles(prev => [...prev, newVehicle]);
    } else {
      setReturnVehicles(prev => [...prev, newVehicle]);
    }
  };

  const handleRemoveVehicle = (id: string, direction: 'outbound' | 'return') => {
    if (direction === 'outbound') {
      setOutboundVehicles(prev => prev.filter(v => v.id !== id));
    } else {
      setReturnVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleVehicleTypeChange = (id: string, type: VehicleType, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === id) {
          const updates: Partial<Vehicle> = { type, seats: {} };
          if (type === 'custom' && !v.customCapacity) {
            updates.customCapacity = 5;
          }
          return { ...v, ...updates };
        }
        return v;
      })
    );
  };

  const handleCustomCapacityChange = (id: string, capacity: number, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, customCapacity: capacity, seats: {} } : v)
    );
  };

  const handleVehicleCategoryChange = (id: string, category: VehicleCategory, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, category, rentalCost: category === 'private' ? undefined : v.rentalCost } : v)
    );
  };

  const handleRentalCostChange = (id: string, cost: number, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, rentalCost: Math.round(cost) } : v)
    );
  };

  const handleGasCostChange = (id: string, costDetail: CostDetail | undefined, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, gasCost: costDetail ? { ...costDetail, amount: Math.round(costDetail.amount) } : undefined } : v)
    );
  };

  const handleHighwayCostChange = (id: string, costDetail: CostDetail | undefined, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, highwayCost: costDetail ? { ...costDetail, amount: Math.round(costDetail.amount) } : undefined } : v)
    );
  };

  const handleAssignSeat = (vehicleId: string, seatKey: string, assignment: SeatAssignment, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            seats: {
              ...v.seats,
              [seatKey]: assignment
            }
          };
        }
        return v;
      })
    );
  };

  const handleRemoveFromSeat = (vehicleId: string, seatKey: string, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === vehicleId) {
          const newSeats = { ...v.seats };
          delete newSeats[seatKey];
          return { ...v, seats: newSeats };
        }
        return v;
      })
    );
  };

  const handleToggleGender = (vehicleId: string, seatKey: string, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === vehicleId && v.seats[seatKey]) {
          return {
            ...v,
            seats: {
              ...v.seats,
              [seatKey]: {
                ...v.seats[seatKey],
                gender: v.seats[seatKey].gender === 'male' ? 'female' : 'male'
              }
            }
          };
        }
        return v;
      })
    );
  };

  const handleCopyOutboundToReturn = () => {
    const copiedVehicles: Vehicle[] = outboundVehicles.map(vehicle => ({
      ...vehicle,
      id: `vehicle-return-${Date.now()}-${Math.random()}`,
      seats: { ...vehicle.seats },
      rentalCost: vehicle.rentalCost ? Math.round(vehicle.rentalCost) : undefined,
      gasCost: vehicle.gasCost ? { amount: Math.round(vehicle.gasCost.amount), type: vehicle.gasCost.type } : undefined,
      highwayCost: vehicle.highwayCost ? { amount: Math.round(vehicle.highwayCost.amount), type: vehicle.highwayCost.type } : undefined
    }));
    setReturnVehicles(copiedVehicles);
  };

  const handleCalculate = () => {
    const newErrors: string[] = [];

    if (outboundVehicles.length === 0 && returnVehicles.length === 0) {
      newErrors.push('行きまたは帰りの車両を少なくとも1台追加してください');
    }

    outboundVehicles.forEach((vehicle, index) => {
      const driverSeatKey = getDriverSeatKey(vehicle);
      if (!vehicle.seats[driverSeatKey]) {
        newErrors.push(`【行き】車両${index + 1}に運転手が設定されていません`);
      }
    });

    returnVehicles.forEach((vehicle, index) => {
      const driverSeatKey = getDriverSeatKey(vehicle);
      if (!vehicle.seats[driverSeatKey]) {
        newErrors.push(`【帰り】車両${index + 1}に運転手が設定されていません`);
      }
    });

    const outboundParticipants = new Set<string>();
    outboundVehicles.forEach(vehicle => {
      Object.values(vehicle.seats).forEach(seat => {
        if (seat.name) outboundParticipants.add(seat.name);
      });
    });

    const returnParticipants = new Set<string>();
    returnVehicles.forEach(vehicle => {
      Object.values(vehicle.seats).forEach(seat => {
        if (seat.name) returnParticipants.add(seat.name);
      });
    });

    if (outboundParticipants.size === 0 && returnParticipants.size === 0) {
      newErrors.push('参加者が誰も座席に配置されていません');
    }

    setErrors(newErrors);

    if (newErrors.length > 0) {
      setResult(null);
      return;
    }

    const calculationResult = calculateRoundTripCosts(outboundVehicles, returnVehicles, participants);
    setResult(calculationResult);
  };

  const handleExport = () => {
    if (!result) return;
    exportToCSV(basicInfo, participants, outboundVehicles, returnVehicles, '');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const data = importFromCSV(content);

      if (data) {
        setBasicInfo(data.basicInfo);
        setParticipants(data.participants);
        setOutboundVehicles(data.outboundVehicles);
        setReturnVehicles(data.returnVehicles);
        setResult(null);
        setErrors([]);
        alert('CSVファイルのインポートが完了しました');
      } else {
        alert('CSVファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1>
            <img src={logo} alt="車割り名人 - 交通費計算アプリ" className="h-12 sm:h-16 w-auto"/>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
            車で割り勘、簡単計算！<br className="sm:hidden" />
            複数の車で移動した時の交通費を公平に分けて、<br className="sm:hidden" />
            誰がいくら払うか一発計算。<br className="sm:hidden" />
            共有用の文章もワンクリックで作成します。
          </p>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto mb-6">
          <BasicInfoForm basicInfo={basicInfo} onChange={setBasicInfo} />
          <ParticipantInput
            participants={participants}
            onImport={handleImportNames}
            onRemove={handleRemoveParticipant}
          />
        </div>

        <div className="lg:hidden max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('outbound')}
                className={`flex-1 px-4 py-3 text-base font-semibold transition-all ${
                  activeTab === 'outbound'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                行き
              </button>
              <button
                onClick={() => setActiveTab('return')}
                className={`flex-1 px-4 py-3 text-base font-semibold transition-all ${
                  activeTab === 'return'
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                帰り
              </button>
            </div>

            <div className={`p-4 sm:p-6 ${activeTab === 'outbound' ? 'bg-blue-50' : 'bg-green-50'}`}>
              {activeTab === 'outbound' ? (
                <VehicleManager
                  vehicles={outboundVehicles}
                  participants={participants}
                  direction="outbound"
                  linkedVehicles={returnVehicles}
                  onAddVehicle={() => handleAddVehicle('outbound')}
                  onRemoveVehicle={(id) => handleRemoveVehicle(id, 'outbound')}
                  onVehicleTypeChange={(id, type) => handleVehicleTypeChange(id, type, 'outbound')}
                  onVehicleCategoryChange={(id, category) => handleVehicleCategoryChange(id, category, 'outbound')}
                  onCustomCapacityChange={(id, capacity) => handleCustomCapacityChange(id, capacity, 'outbound')}
                  onRentalCostChange={(id, cost) => handleRentalCostChange(id, cost, 'outbound')}
                  onGasCostChange={(id, costDetail) => handleGasCostChange(id, costDetail, 'outbound')}
                  onHighwayCostChange={(id, costDetail) => handleHighwayCostChange(id, costDetail, 'outbound')}
                  onAssignSeat={(vehicleId, seatKey, assignment) => handleAssignSeat(vehicleId, seatKey, assignment, 'outbound')}
                  onRemoveFromSeat={(vehicleId, seatKey) => handleRemoveFromSeat(vehicleId, seatKey, 'outbound')}
                  onToggleGender={(vehicleId, seatKey) => handleToggleGender(vehicleId, seatKey, 'outbound')}
                />
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleCopyOutboundToReturn}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md min-h-[44px]"
                    >
                      帰りも行きと同じ
                    </button>
                  </div>
                  <VehicleManager
                    vehicles={returnVehicles}
                    participants={participants}
                    direction="return"
                    linkedVehicles={outboundVehicles}
                    onAddVehicle={() => handleAddVehicle('return')}
                    onRemoveVehicle={(id) => handleRemoveVehicle(id, 'return')}
                    onVehicleTypeChange={(id, type) => handleVehicleTypeChange(id, type, 'return')}
                    onVehicleCategoryChange={(id, category) => handleVehicleCategoryChange(id, category, 'return')}
                    onCustomCapacityChange={(id, capacity) => handleCustomCapacityChange(id, capacity, 'return')}
                    onRentalCostChange={(id, cost) => handleRentalCostChange(id, cost, 'return')}
                    onGasCostChange={(id, costDetail) => handleGasCostChange(id, costDetail, 'return')}
                    onHighwayCostChange={(id, costDetail) => handleHighwayCostChange(id, costDetail, 'return')}
                    onAssignSeat={(vehicleId, seatKey, assignment) => handleAssignSeat(vehicleId, seatKey, assignment, 'return')}
                    onRemoveFromSeat={(vehicleId, seatKey) => handleRemoveFromSeat(vehicleId, seatKey, 'return')}
                    onToggleGender={(vehicleId, seatKey) => handleToggleGender(vehicleId, seatKey, 'return')}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex gap-6 max-w-[1920px] mx-auto">
          <div className="flex-1 min-w-0 space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-900">行きの車両</h2>
              </div>
              <VehicleManager
                vehicles={outboundVehicles}
                participants={participants}
                direction="outbound"
                linkedVehicles={returnVehicles}
                onAddVehicle={() => handleAddVehicle('outbound')}
                onRemoveVehicle={(id) => handleRemoveVehicle(id, 'outbound')}
                onVehicleTypeChange={(id, type) => handleVehicleTypeChange(id, type, 'outbound')}
                onVehicleCategoryChange={(id, category) => handleVehicleCategoryChange(id, category, 'outbound')}
                onCustomCapacityChange={(id, capacity) => handleCustomCapacityChange(id, capacity, 'outbound')}
                onRentalCostChange={(id, cost) => handleRentalCostChange(id, cost, 'outbound')}
                onGasCostChange={(id, costDetail) => handleGasCostChange(id, costDetail, 'outbound')}
                onHighwayCostChange={(id, costDetail) => handleHighwayCostChange(id, costDetail, 'outbound')}
                onAssignSeat={(vehicleId, seatKey, assignment) => handleAssignSeat(vehicleId, seatKey, assignment, 'outbound')}
                onRemoveFromSeat={(vehicleId, seatKey) => handleRemoveFromSeat(vehicleId, seatKey, 'outbound')}
                onToggleGender={(vehicleId, seatKey) => handleToggleGender(vehicleId, seatKey, 'outbound')}
              />
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-900">帰りの車両</h2>
                <button
                  onClick={handleCopyOutboundToReturn}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  帰りも行きと同じ
                </button>
              </div>
              <VehicleManager
                vehicles={returnVehicles}
                participants={participants}
                direction="return"
                linkedVehicles={outboundVehicles}
                onAddVehicle={() => handleAddVehicle('return')}
                onRemoveVehicle={(id) => handleRemoveVehicle(id, 'return')}
                onVehicleTypeChange={(id, type) => handleVehicleTypeChange(id, type, 'return')}
                onVehicleCategoryChange={(id, category) => handleVehicleCategoryChange(id, category, 'return')}
                onCustomCapacityChange={(id, capacity) => handleCustomCapacityChange(id, capacity, 'return')}
                onRentalCostChange={(id, cost) => handleRentalCostChange(id, cost, 'return')}
                onGasCostChange={(id, costDetail) => handleGasCostChange(id, costDetail, 'return')}
                onHighwayCostChange={(id, costDetail) => handleHighwayCostChange(id, costDetail, 'return')}
                onAssignSeat={(vehicleId, seatKey, assignment) => handleAssignSeat(vehicleId, seatKey, assignment, 'return')}
                onRemoveFromSeat={(vehicleId, seatKey) => handleRemoveFromSeat(vehicleId, seatKey, 'return')}
                onToggleGender={(vehicleId, seatKey) => handleToggleGender(vehicleId, seatKey, 'return')}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6">
          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 mt-0.5 mr-3" size={20} />
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">エラー</h3>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <button
              onClick={handleCalculate}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all min-h-[44px]"
            >
              <Calculator size={24} />
              計算する
            </button>
          </div>

          <CalculationResult
            result={result}
            outboundVehicles={outboundVehicles}
            returnVehicles={returnVehicles}
            participants={participants}
            basicInfo={basicInfo}
            onExport={handleExport}
            onImport={handleImport}
          />
        </div>
      </main>
    </div>
  );
}

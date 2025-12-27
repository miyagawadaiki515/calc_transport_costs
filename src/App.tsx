import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { BasicInfo, Participant, Vehicle, VehicleType, VehicleCategory, CostDetail, getDriverSeatKey, DualTripCalculationResult } from './types';
import BasicInfoForm from './components/BasicInfoForm';
import ParticipantInput from './components/ParticipantInput';
import ParticipantBoxes from './components/ParticipantBoxes';
import VehicleManager from './components/VehicleManager';
import CalculationResult from './components/CalculationResult';
import DraggableParticipant from './components/DraggableParticipant';
import { calculateRoundTripCosts } from './utils/calculations';
import { exportToCSV, importFromCSV } from './utils/csv';
import { Calculator, AlertCircle, Copy } from 'lucide-react';

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
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const getAssignedParticipantIds = (): Set<string> => {
    const assignedIds = new Set<string>();
    [...outboundVehicles, ...returnVehicles].forEach(vehicle => {
      Object.values(vehicle.seats).forEach(participantId => {
        if (participantId) {
          assignedIds.add(participantId);
        }
      });
    });
    return assignedIds;
  };

  const handleImportNames = (names: string[]) => {
    const newParticipants: Participant[] = names.map(name => ({
      id: `participant-${Date.now()}-${Math.random()}`,
      name
    }));
    setParticipants(prev => [...prev, ...newParticipants]);
  };

  const handleSetGender = (id: string, gender: 'male' | 'female') => {
    setParticipants(prev =>
      prev.map(p => p.id === id ? { ...p, gender } : p)
    );
  };

  const handleResetGender = (id: string) => {
    setParticipants(prev =>
      prev.map(p => p.id === id ? { ...p, gender: undefined } : p)
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
      prev.map(v => v.id === id ? { ...v, type, seats: {} } : v)
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
      prev.map(v => v.id === id ? { ...v, rentalCost: cost } : v)
    );
  };

  const handleGasCostChange = (id: string, costDetail: CostDetail | undefined, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, gasCost: costDetail } : v)
    );
  };

  const handleHighwayCostChange = (id: string, costDetail: CostDetail | undefined, direction: 'outbound' | 'return') => {
    const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, highwayCost: costDetail } : v)
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

  const handleCopyOutboundToReturn = () => {
    const copiedVehicles: Vehicle[] = outboundVehicles.map(vehicle => ({
      ...vehicle,
      id: `vehicle-return-${Date.now()}-${Math.random()}`,
      seats: { ...vehicle.seats },
      gasCost: vehicle.gasCost ? { ...vehicle.gasCost } : undefined,
      highwayCost: vehicle.highwayCost ? { ...vehicle.highwayCost } : undefined
    }));
    setReturnVehicles(copiedVehicles);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const participant = event.active.data.current?.participant as Participant;
    setActiveParticipant(participant);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveParticipant(null);

    if (!over) return;

    const participantId = active.id as string;
    const overId = over.id as string;

    if (overId === 'male-box') {
      handleSetGender(participantId, 'male');
      setOutboundVehicles(prev =>
        prev.map(v => ({
          ...v,
          seats: Object.fromEntries(
            Object.entries(v.seats).filter(([_, id]) => id !== participantId)
          )
        }))
      );
      setReturnVehicles(prev =>
        prev.map(v => ({
          ...v,
          seats: Object.fromEntries(
            Object.entries(v.seats).filter(([_, id]) => id !== participantId)
          )
        }))
      );
    } else if (overId === 'female-box') {
      handleSetGender(participantId, 'female');
      setOutboundVehicles(prev =>
        prev.map(v => ({
          ...v,
          seats: Object.fromEntries(
            Object.entries(v.seats).filter(([_, id]) => id !== participantId)
          )
        }))
      );
      setReturnVehicles(prev =>
        prev.map(v => ({
          ...v,
          seats: Object.fromEntries(
            Object.entries(v.seats).filter(([_, id]) => id !== participantId)
          )
        }))
      );
    } else if (overId === 'unassigned') {
      setParticipants(prev =>
        prev.map(p => p.id === participantId ? { ...p, gender: undefined } : p)
      );
      setOutboundVehicles(prev =>
        prev.map(v => ({
          ...v,
          seats: Object.fromEntries(
            Object.entries(v.seats).filter(([_, id]) => id !== participantId)
          )
        }))
      );
      setReturnVehicles(prev =>
        prev.map(v => ({
          ...v,
          seats: Object.fromEntries(
            Object.entries(v.seats).filter(([_, id]) => id !== participantId)
          )
        }))
      );
    } else {
      const dropData = over.data.current;
      if (dropData && dropData.vehicleId && dropData.seatKey !== undefined) {
        const vehicleId = dropData.vehicleId;
        const seatKey = dropData.seatKey;
        const direction = dropData.direction as 'outbound' | 'return';

        const setVehicles = direction === 'outbound' ? setOutboundVehicles : setReturnVehicles;

        setVehicles(prev =>
          prev.map(v => ({
            ...v,
            seats: Object.fromEntries(
              Object.entries(v.seats).filter(([_, id]) => id !== participantId)
            )
          }))
        );

        setVehicles(prev =>
          prev.map(v => {
            if (v.id === vehicleId) {
              return {
                ...v,
                seats: {
                  ...v.seats,
                  [seatKey]: participantId
                }
              };
            }
            return v;
          })
        );
      }
    }
  };

  const handleCalculate = () => {
    const newErrors: string[] = [];

    if (outboundVehicles.length === 0 && returnVehicles.length === 0) {
      newErrors.push('行きまたは帰りの車両を少なくとも1台追加してください');
    }

    outboundVehicles.forEach((vehicle, index) => {
      const driverSeatKey = getDriverSeatKey(vehicle.type);
      if (!vehicle.seats[driverSeatKey]) {
        newErrors.push(`【行き】車両${index + 1}に運転手が設定されていません`);
      }
    });

    returnVehicles.forEach((vehicle, index) => {
      const driverSeatKey = getDriverSeatKey(vehicle.type);
      if (!vehicle.seats[driverSeatKey]) {
        newErrors.push(`【帰り】車両${index + 1}に運転手が設定されていません`);
      }
    });

    const outboundParticipants = new Set<string>();
    outboundVehicles.forEach(vehicle => {
      Object.values(vehicle.seats).forEach(id => {
        if (id) outboundParticipants.add(id);
      });
    });

    const returnParticipants = new Set<string>();
    returnVehicles.forEach(vehicle => {
      Object.values(vehicle.seats).forEach(id => {
        if (id) returnParticipants.add(id);
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

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-3xl font-bold text-gray-800">交通費計算アプリ（往復対応）</h1>
            <p className="text-sm text-gray-600 mt-1">複数台の車での移動費用を行き・帰り別々に管理して公平に分配</p>
          </div>
        </header>

        <main className="max-w-full mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto mb-6">
            <BasicInfoForm basicInfo={basicInfo} onChange={setBasicInfo} />
            <ParticipantInput onImport={handleImportNames} />
          </div>

          <div className="flex gap-6 max-w-[1920px] mx-auto">
            <div className="w-80 flex-shrink-0 sticky top-4 self-start">
              <ParticipantBoxes
                participants={participants}
                assignedParticipantIds={getAssignedParticipantIds()}
                onSetGender={handleSetGender}
                onResetGender={handleResetGender}
              />
            </div>

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
                  onRentalCostChange={(id, cost) => handleRentalCostChange(id, cost, 'outbound')}
                  onGasCostChange={(id, costDetail) => handleGasCostChange(id, costDetail, 'outbound')}
                  onHighwayCostChange={(id, costDetail) => handleHighwayCostChange(id, costDetail, 'outbound')}
                  onRemoveFromSeat={(vehicleId, seatKey) => handleRemoveFromSeat(vehicleId, seatKey, 'outbound')}
                />
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-green-900">帰りの車両</h2>
                  <button
                    onClick={handleCopyOutboundToReturn}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    <Copy size={18} />
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
                  onRentalCostChange={(id, cost) => handleRentalCostChange(id, cost, 'return')}
                  onGasCostChange={(id, costDetail) => handleGasCostChange(id, costDetail, 'return')}
                  onHighwayCostChange={(id, costDetail) => handleHighwayCostChange(id, costDetail, 'return')}
                  onRemoveFromSeat={(vehicleId, seatKey) => handleRemoveFromSeat(vehicleId, seatKey, 'return')}
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
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
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

      <DragOverlay>
        {activeParticipant ? (
          <div className="opacity-80">
            <DraggableParticipant participant={activeParticipant} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

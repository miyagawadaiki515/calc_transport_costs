import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { BasicInfo, Participant, Vehicle, VehicleType, getDriverSeatKey, DualCalculationResult } from './types';
import BasicInfoForm from './components/BasicInfoForm';
import ParticipantInput from './components/ParticipantInput';
import ParticipantBoxes from './components/ParticipantBoxes';
import VehicleManager from './components/VehicleManager';
import CalculationResult from './components/CalculationResult';
import DraggableParticipant from './components/DraggableParticipant';
import { calculateTransportationCosts } from './utils/calculations';
import { exportToCSV, importFromCSV } from './utils/csv';
import { Calculator, AlertCircle } from 'lucide-react';

export default function App() {
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    purpose: '',
    departureTime: '',
    meetingPlace: ''
  });

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [result, setResult] = useState<DualCalculationResult | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const getAssignedParticipantIds = (): Set<string> => {
    const assignedIds = new Set<string>();
    vehicles.forEach(vehicle => {
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

  const handleAddVehicle = () => {
    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      type: '5-seater',
      cost: 0,
      seats: {}
    };
    setVehicles(prev => [...prev, newVehicle]);
  };

  const handleRemoveVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const handleVehicleTypeChange = (id: string, type: VehicleType) => {
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, type, seats: {} } : v)
    );
  };

  const handleVehicleCostChange = (id: string, cost: number) => {
    setVehicles(prev =>
      prev.map(v => v.id === id ? { ...v, cost } : v)
    );
  };

  const handleRemoveFromSeat = (vehicleId: string, seatKey: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const participantId = vehicle.seats[seatKey];
    if (!participantId) return;

    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

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
      setVehicles(prev =>
        prev.map(v => ({
          ...v,
          seats: Object.fromEntries(
            Object.entries(v.seats).filter(([_, id]) => id !== participantId)
          )
        }))
      );
    } else if (overId === 'female-box') {
      handleSetGender(participantId, 'female');
      setVehicles(prev =>
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
      setVehicles(prev =>
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

    if (vehicles.length === 0) {
      newErrors.push('車両が1台も追加されていません');
    }

    vehicles.forEach((vehicle, index) => {
      const driverSeatKey = getDriverSeatKey(vehicle.type);
      if (!vehicle.seats[driverSeatKey]) {
        newErrors.push(`車両${index + 1}に運転手が設定されていません`);
      }
    });

    const assignedParticipants = new Set<string>();
    vehicles.forEach(vehicle => {
      Object.values(vehicle.seats).forEach(id => {
        if (id) assignedParticipants.add(id);
      });
    });

    if (assignedParticipants.size === 0) {
      newErrors.push('参加者が誰も座席に配置されていません');
    }

    setErrors(newErrors);

    if (newErrors.length > 0) {
      setResult(null);
      return;
    }

    const calculationResult = calculateTransportationCosts(vehicles, participants);
    setResult(calculationResult);
  };

  const handleExport = () => {
    if (!result) return;
    exportToCSV(basicInfo, participants, vehicles, '');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const data = importFromCSV(content);

      if (data) {
        setBasicInfo(data.basicInfo);
        setParticipants(data.participants);
        setVehicles(data.vehicles);
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
            <h1 className="text-3xl font-bold text-gray-800">交通費計算アプリ</h1>
            <p className="text-sm text-gray-600 mt-1">複数台の車での移動費用を公平に分配</p>
          </div>
        </header>

        <main className="max-w-full mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto mb-6">
            <BasicInfoForm basicInfo={basicInfo} onChange={setBasicInfo} />
            <ParticipantInput onImport={handleImportNames} />
          </div>

          <div className="flex gap-6 max-w-[1920px] mx-auto">
            <div className="w-80 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-300px)] sticky top-0">
              <ParticipantBoxes
                participants={participants}
                assignedParticipantIds={getAssignedParticipantIds()}
                onSetGender={handleSetGender}
                onResetGender={handleResetGender}
              />
            </div>

            <div className="flex-1 min-w-0">
              <VehicleManager
                vehicles={vehicles}
                participants={participants}
                onAddVehicle={handleAddVehicle}
                onRemoveVehicle={handleRemoveVehicle}
                onVehicleTypeChange={handleVehicleTypeChange}
                onVehicleCostChange={handleVehicleCostChange}
                onRemoveFromSeat={handleRemoveFromSeat}
              />
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
              vehicles={vehicles}
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

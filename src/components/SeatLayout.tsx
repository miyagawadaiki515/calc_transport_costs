import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Vehicle, Participant, getVehicleConfig, SeatAssignment, Gender } from '../types';

interface SeatLayoutProps {
  vehicle: Vehicle;
  participants: Participant[];
  direction: 'outbound' | 'return';
  allVehicles: Vehicle[];
  onAssignSeat: (vehicleId: string, seatKey: string, assignment: SeatAssignment) => void;
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
  onToggleGender: (vehicleId: string, seatKey: string) => void;
}

export default function SeatLayout({
  vehicle,
  participants,
  direction,
  allVehicles,
  onAssignSeat,
  onRemoveFromSeat,
  onToggleGender
}: SeatLayoutProps) {
  const config = getVehicleConfig(vehicle);

  const getSeatKey = (row: number, seat: number) => `${row}-${seat}`;

  const getAvailableParticipants = (): Participant[] => {
    const assignedIds = new Set<string>();
    allVehicles.forEach(v => {
      Object.values(v.seats).forEach(seat => {
        if (seat.participantId) {
          assignedIds.add(seat.participantId);
        }
      });
    });
    return participants.filter(p => !assignedIds.has(p.id));
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {config.layout.map((rowConfig) => (
        <div key={rowConfig.row} className="flex gap-1 sm:gap-2 justify-center">
          {Array.from({ length: rowConfig.seats }, (_, seatIndex) => {
            const seatKey = getSeatKey(rowConfig.row, seatIndex);
            const seatAssignment = vehicle.seats[seatKey];
            const isDriverSeat = !!(rowConfig.isDriverRow && seatIndex === rowConfig.seats - 1);

            return (
              <SeatCard
                key={seatKey}
                seatKey={seatKey}
                vehicleId={vehicle.id}
                direction={direction}
                assignment={seatAssignment}
                isDriver={isDriverSeat}
                availableParticipants={getAvailableParticipants()}
                onAssign={onAssignSeat}
                onRemove={onRemoveFromSeat}
                onToggleGender={onToggleGender}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface SeatCardProps {
  seatKey: string;
  vehicleId: string;
  direction: 'outbound' | 'return';
  assignment?: SeatAssignment;
  isDriver: boolean;
  availableParticipants: Participant[];
  onAssign: (vehicleId: string, seatKey: string, assignment: SeatAssignment) => void;
  onRemove: (vehicleId: string, seatKey: string) => void;
  onToggleGender: (vehicleId: string, seatKey: string) => void;
}

function SeatCard({
  seatKey,
  vehicleId,
  assignment,
  isDriver,
  availableParticipants,
  onAssign,
  onRemove,
  onToggleGender
}: SeatCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleSelectParticipant = (participant: Participant) => {
    const newAssignment: SeatAssignment = {
      participantId: participant.id,
      name: participant.name,
      gender: 'male',
      isManualEntry: false
    };
    onAssign(vehicleId, seatKey, newAssignment);
    closeModal();
  };

  const handleManualInput = () => {
    if (manualName.trim()) {
      const newAssignment: SeatAssignment = {
        name: manualName.trim(),
        gender: 'male',
        isManualEntry: true
      };
      onAssign(vehicleId, seatKey, newAssignment);
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsManualInput(false);
    setManualName('');
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(vehicleId, seatKey);
  };

  const handleToggleGender = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleGender(vehicleId, seatKey);
  };

  const getBackgroundColor = () => {
    if (!assignment) return 'bg-white';
    return assignment.gender === 'male' ? 'bg-blue-400' : 'bg-red-400';
  };

  const getTextColor = () => {
    if (!assignment) return 'text-gray-700';
    return 'text-white';
  };

  if (assignment) {
    return (
      <div className={`relative w-16 h-20 sm:w-20 sm:h-24 border-2 ${isDriver ? 'border-amber-500' : 'border-gray-300'} rounded-lg flex flex-col items-center justify-center ${getBackgroundColor()} transition-all`}>
        {isDriver && (
          <div className="absolute top-0 left-0 right-0 text-[8px] sm:text-[9px] font-bold text-center bg-amber-500 text-white rounded-t-md py-0.5">運転席</div>
        )}
        <button
          onClick={handleToggleGender}
          className="absolute top-1 left-1 p-0.5 bg-white bg-opacity-80 hover:bg-opacity-100 rounded transition-all min-w-[20px] min-h-[20px]"
          title="性別切り替え"
        >
          <RefreshCw size={12} className="text-gray-700" />
        </button>
        <button
          onClick={handleRemove}
          className="absolute top-1 right-1 p-0.5 bg-white bg-opacity-80 hover:bg-opacity-100 rounded transition-all min-w-[20px] min-h-[20px]"
          title="削除"
        >
          <X size={12} className="text-red-600" />
        </button>
        <div className={`text-xs sm:text-sm font-medium text-center px-1 sm:px-2 ${getTextColor()} ${isDriver ? 'mt-3 sm:mt-4' : ''} leading-tight`}>
          {assignment.name}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`w-16 h-20 sm:w-20 sm:h-24 border-2 ${isDriver ? 'border-amber-500 bg-amber-50' : 'border-gray-300 bg-white'} rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all`}
      >
        {isDriver && (
          <div className="text-[8px] sm:text-[9px] font-bold text-amber-700 mb-1">運転席</div>
        )}
        <div className="text-[10px] sm:text-xs text-gray-400 text-center px-1">
          タップ<br />して選択
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          />
          <div className="relative bg-white w-full md:w-auto md:min-w-[400px] md:max-w-[500px] rounded-t-2xl md:rounded-2xl shadow-2xl transform transition-transform">
            <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">乗車する人を選択</h3>
              {!isManualInput ? (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {availableParticipants.length > 0 ? (
                    availableParticipants.map(participant => (
                      <button
                        key={participant.id}
                        onClick={() => handleSelectParticipant(participant)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-base border border-gray-200 rounded-lg min-h-[44px]"
                      >
                        {participant.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-base text-gray-400 text-center">
                      利用可能な参加者なし
                    </div>
                  )}
                  <button
                    onClick={() => setIsManualInput(true)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors text-base text-gray-700 border-2 border-gray-300 rounded-lg font-medium mt-4 min-h-[44px]"
                  >
                    手動で入力...
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualInput();
                      } else if (e.key === 'Escape') {
                        setIsManualInput(false);
                        setManualName('');
                      }
                    }}
                    placeholder="名前を入力"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 min-h-[44px]"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleManualInput}
                      disabled={!manualName.trim()}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      決定
                    </button>
                    <button
                      onClick={() => {
                        setIsManualInput(false);
                        setManualName('');
                      }}
                      className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg text-base font-medium hover:bg-gray-400 min-h-[44px]"
                    >
                      戻る
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-4 hidden md:block">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg text-base font-medium hover:bg-gray-300 min-h-[44px]"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

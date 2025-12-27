import { useDroppable } from '@dnd-kit/core';
import { Vehicle, Participant, VEHICLE_CONFIGS } from '../types';
import DraggableParticipant from './DraggableParticipant';

interface SeatLayoutProps {
  vehicle: Vehicle;
  participants: Participant[];
  onRemoveFromSeat: (vehicleId: string, seatKey: string) => void;
}

export default function SeatLayout({ vehicle, participants, onRemoveFromSeat }: SeatLayoutProps) {
  const config = VEHICLE_CONFIGS[vehicle.type];

  const getSeatKey = (row: number, seat: number) => `${row}-${seat}`;

  return (
    <div className="space-y-3">
      {config.layout.map((rowConfig) => (
        <div key={rowConfig.row} className="flex gap-2 justify-center">
          {Array.from({ length: rowConfig.seats }, (_, seatIndex) => {
            const seatKey = getSeatKey(rowConfig.row, seatIndex);
            const participantId = vehicle.seats[seatKey];
            const participant = participants.find(p => p.id === participantId);
            const isDriverSeat = !!(rowConfig.isDriverRow && seatIndex === rowConfig.seats - 1);

            return (
              <Seat
                key={seatKey}
                seatKey={seatKey}
                vehicleId={vehicle.id}
                participant={participant}
                isDriver={isDriverSeat}
                onRemove={onRemoveFromSeat}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface SeatProps {
  seatKey: string;
  vehicleId: string;
  participant?: Participant;
  isDriver: boolean;
  onRemove: (vehicleId: string, seatKey: string) => void;
}

function Seat({ seatKey, vehicleId, participant, isDriver, onRemove }: SeatProps) {
  const dropId = `${vehicleId}-${seatKey}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { vehicleId, seatKey }
  });

  const baseClasses = "w-20 h-24 border-2 rounded-lg flex flex-col items-center justify-center transition-all";
  const driverClasses = isDriver
    ? "border-amber-500 bg-amber-50"
    : "border-gray-300 bg-white";
  const hoverClasses = isOver ? "ring-2 ring-blue-400 bg-blue-50" : "";
  const filledClasses = participant ? "bg-opacity-90" : "";

  return (
    <div
      ref={setNodeRef}
      className={`${baseClasses} ${driverClasses} ${hoverClasses} ${filledClasses}`}
    >
      {isDriver && (
        <div className="text-[10px] font-bold text-amber-700 mb-1">運転席</div>
      )}
      {participant ? (
        <div className="w-full px-2">
          <DraggableParticipant
            participant={participant}
            onRemove={() => onRemove(vehicleId, seatKey)}
            isInSeat
          />
        </div>
      ) : (
        <div className="text-xs text-gray-400">
          {isDriver ? 'ドラッグ' : '空席'}
        </div>
      )}
    </div>
  );
}

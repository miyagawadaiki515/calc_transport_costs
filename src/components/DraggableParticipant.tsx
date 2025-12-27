import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Participant } from '../types';
import { GripVertical, X } from 'lucide-react';

interface DraggableParticipantProps {
  participant: Participant;
  onRemove?: (id: string) => void;
  isInSeat?: boolean;
}

export default function DraggableParticipant({ participant, onRemove, isInSeat }: DraggableParticipantProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participant.id,
    data: { participant }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = participant.gender === 'male' ? 'bg-blue-100 border-blue-300' : 'bg-red-100 border-red-300';
  const textColor = participant.gender === 'male' ? 'text-blue-800' : 'text-red-800';

  if (isInSeat) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${bgColor} border rounded px-1 py-1 cursor-move flex flex-col items-center justify-center group hover:shadow-md transition-shadow relative`}
      >
        <div
          className="flex items-center justify-center"
          style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
          {...listeners}
          {...attributes}
        >
          <span className={`font-medium ${textColor} text-xs`}>{participant.name}</span>
        </div>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(participant.id);
            }}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/50 rounded"
          >
            <X size={10} className="text-gray-600" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${bgColor} border rounded px-3 py-2 cursor-move flex items-center justify-between group hover:shadow-md transition-shadow text-sm`}
    >
      <div
        className="flex items-center gap-2 flex-1"
        {...listeners}
        {...attributes}
      >
        <GripVertical size={16} className="text-gray-400" />
        <span className={`font-medium ${textColor}`}>{participant.name}</span>
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(participant.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
        >
          <X size={14} className="text-gray-600" />
        </button>
      )}
    </div>
  );
}

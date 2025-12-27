import { useDroppable } from '@dnd-kit/core';
import { Participant } from '../types';
import DraggableParticipant from './DraggableParticipant';
import { Users } from 'lucide-react';

interface ParticipantBoxesProps {
  participants: Participant[];
  assignedParticipantIds: Set<string>;
  onSetGender: (id: string, gender: 'male' | 'female') => void;
  onResetGender: (id: string) => void;
}

export default function ParticipantBoxes({ participants, assignedParticipantIds, onSetGender, onResetGender }: ParticipantBoxesProps) {
  const unassigned = participants.filter(p => !p.gender);
  const males = participants.filter(p => p.gender === 'male' && !assignedParticipantIds.has(p.id));
  const females = participants.filter(p => p.gender === 'female' && !assignedParticipantIds.has(p.id));

  const { setNodeRef: setUnassignedRef } = useDroppable({ id: 'unassigned' });
  const { setNodeRef: setMaleRef } = useDroppable({ id: 'male-box' });
  const { setNodeRef: setFemaleRef } = useDroppable({ id: 'female-box' });

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-4 pr-2">
      {unassigned.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <Users size={18} />
            性別未選択
          </h3>
          <div
            ref={setUnassignedRef}
            className="border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[120px] bg-gray-50"
          >
            <div className="space-y-2">
              {unassigned.map(participant => (
                <div key={participant.id} className="bg-white p-3 rounded border border-gray-200">
                  <div className="font-medium text-sm mb-2">{participant.name}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSetGender(participant.id, 'male')}
                      className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      男性
                    </button>
                    <button
                      onClick={() => onSetGender(participant.id, 'female')}
                      className="flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    >
                      女性
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold mb-3 text-blue-700 flex items-center gap-2">
          <Users size={18} />
          男性 ({males.length}人)
        </h3>
        <div
          ref={setMaleRef}
          className="border-2 border-blue-300 rounded-lg p-3 min-h-[200px] bg-blue-50"
        >
          {males.length === 0 ? (
            <p className="text-blue-300 text-sm text-center mt-8">参加者をドラッグしてください</p>
          ) : (
            <div className="space-y-2">
              {males.map(participant => (
                <DraggableParticipant
                  key={participant.id}
                  participant={participant}
                  onRemove={onResetGender}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold mb-3 text-red-700 flex items-center gap-2">
          <Users size={18} />
          女性 ({females.length}人)
        </h3>
        <div
          ref={setFemaleRef}
          className="border-2 border-red-300 rounded-lg p-3 min-h-[200px] bg-red-50"
        >
          {females.length === 0 ? (
            <p className="text-red-300 text-sm text-center mt-8">参加者をドラッグしてください</p>
          ) : (
            <div className="space-y-2">
              {females.map(participant => (
                <DraggableParticipant
                  key={participant.id}
                  participant={participant}
                  onRemove={onResetGender}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

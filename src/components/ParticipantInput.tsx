import { useState } from 'react';
import { UserPlus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantInputProps {
  participants: Participant[];
  onImport: (names: string[]) => void;
  onRemove: (id: string) => void;
}

export default function ParticipantInput({ participants, onImport, onRemove }: ParticipantInputProps) {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleImport = () => {
    const names = inputText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length > 0) {
      onImport(names);
      setInputText('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          参加者一覧 ({participants.length}人)
        </h2>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名前を改行区切りで入力
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                placeholder="山田太郎&#10;佐藤花子&#10;鈴木次郎"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleImport}
                disabled={!inputText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-fit w-full md:w-auto min-h-[44px]"
              >
                <UserPlus size={20} />
                取り込み
              </button>
            </div>
          </div>

          {participants.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">参加者一覧</h3>
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {participants.map(participant => (
                    <div key={participant.id} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200">
                      <span className="text-sm font-medium text-gray-800">・{participant.name}</span>
                      <button
                        onClick={() => onRemove(participant.id)}
                        className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm min-h-[36px]"
                        title="削除"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">削除</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

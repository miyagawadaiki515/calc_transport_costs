import { useState } from 'react';
import { UserPlus } from 'lucide-react';

interface ParticipantInputProps {
  onImport: (names: string[]) => void;
}

export default function ParticipantInput({ onImport }: ParticipantInputProps) {
  const [inputText, setInputText] = useState('');

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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">参加者登録</h2>
      <div className="flex gap-4">
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
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-fit"
          >
            <UserPlus size={20} />
            取り込み
          </button>
        </div>
      </div>
    </div>
  );
}

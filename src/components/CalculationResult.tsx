import { Download, Upload, FileText } from 'lucide-react';
import { useState } from 'react';
import type { CalculationResult as CalculationResultType } from '../types';
import { DualCalculationResult, Vehicle, Participant, BasicInfo } from '../types';
import { generateResultText } from '../utils/calculations';

interface CalculationResultProps {
  result: DualCalculationResult | null;
  vehicles: Vehicle[];
  participants: Participant[];
  basicInfo: BasicInfo;
  onExport: () => void;
  onImport: (file: File) => void;
}

function ResultColumn({
  title,
  result,
  vehicles
}: {
  title: string;
  result: CalculationResultType;
  vehicles: Vehicle[];
}) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">{title}</h3>

      <div className="space-y-4">
        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">費用計算</h4>
          <div className="space-y-1 text-sm">
            <p>総費用: {result.totalCost.toLocaleString()}円</p>
            <p>総参加者数: {result.totalParticipants}人</p>
            <p className="font-bold text-blue-600">一人当たり金額: {result.perPersonCost.toLocaleString()}円</p>
            <p>徴収総額: {result.totalCollected.toLocaleString()}円</p>
            <p className="font-bold text-red-600">運転手負担額: {result.totalDriverLoss.toLocaleString()}円</p>
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">各車での徴収</h4>
          <div className="space-y-2 text-sm">
            {result.vehicleCollections.map((vc, index) => (
              <div key={vc.vehicleId} className="border-l-2 border-blue-400 pl-2">
                <p className="font-medium">車両{index + 1}: {vc.driverName}</p>
                <p className="text-gray-600">
                  {vc.passengerCount}人から{result.perPersonCost.toLocaleString()}円ずつ徴収
                  → 合計{vc.collectionAmount.toLocaleString()}円
                </p>
                <p className="text-xs text-gray-500">車両費用: {vehicles[index].cost.toLocaleString()}円</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">運転手間の差額調整</h4>
          {result.driverAdjustments.length === 0 ? (
            <p className="text-sm text-gray-600">調整不要</p>
          ) : (
            <div className="space-y-1 text-sm">
              {result.driverAdjustments.map((adj, index) => (
                <p key={index} className="text-gray-700">
                  {adj.from} → {adj.to}: {adj.amount.toLocaleString()}円
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalculationResult({
  result,
  vehicles,
  participants,
  basicInfo,
  onExport,
  onImport
}: CalculationResultProps) {
  const [selectedRounding, setSelectedRounding] = useState<'up' | 'down'>('up');
  const [expandedText, setExpandedText] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  const handleGenerateExpandedText = () => {
    if (!result) return;
    const selectedResult = selectedRounding === 'up' ? result.roundUp : result.roundDown;
    const text = generateResultText(basicInfo, vehicles, participants, selectedResult, selectedRounding);
    setExpandedText(text);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">計算結果</h2>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload size={20} />
            CSVインポート
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <button
            onClick={onExport}
            disabled={!result}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={20} />
            CSVエクスポート
          </button>
        </div>
      </div>

      {result ? (
        <div className="space-y-6">
          <div className="flex gap-4">
            <ResultColumn
              title="100円単位で切り上げ"
              result={result.roundUp}
              vehicles={vehicles}
            />
            <ResultColumn
              title="100円単位で切り捨て"
              result={result.roundDown}
              vehicles={vehicles}
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-gray-800">展開用テキスト出力</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">適用方式:</label>
                <select
                  value={selectedRounding}
                  onChange={(e) => setSelectedRounding(e.target.value as 'up' | 'down')}
                  className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="up">切り上げ</option>
                  <option value="down">切り捨て</option>
                </select>
              </div>
              <button
                onClick={handleGenerateExpandedText}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FileText size={20} />
                展開用テキストを出力
              </button>
            </div>

            {expandedText ? (
              <textarea
                value={expandedText}
                readOnly
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none focus:outline-none"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md text-gray-400">
                「展開用テキストを出力」ボタンを押すとテキストが表示されます
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md text-gray-400">
          「計算する」ボタンを押すと結果が表示されます
        </div>
      )}
    </div>
  );
}

import { Download, Upload, FileText, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { TripCalculationResult } from '../types';
import { DualTripCalculationResult, Vehicle, Participant, BasicInfo } from '../types';
import { generateTripResultText, generateSimpleTripResultText } from '../utils/calculations';

interface CalculationResultProps {
  result: DualTripCalculationResult | null;
  outboundVehicles: Vehicle[];
  returnVehicles: Vehicle[];
  participants: Participant[];
  basicInfo: BasicInfo;
  onExport: () => void;
  onImport: (file: File) => void;
}

function ResultColumn({
  title,
  result,
  isRecommended,
  adjustmentInfo
}: {
  title: string;
  result: TripCalculationResult;
  isRecommended?: boolean;
  adjustmentInfo?: string;
}) {
  return (
    <div className={`flex-1 rounded-lg p-4 ${isRecommended ? 'bg-blue-50 border-2 border-blue-400' : 'bg-gray-50'}`}>
      <div className="flex flex-col items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-800 text-center">{title}</h3>
          {isRecommended && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">おすすめ</span>
          )}
        </div>
        {isRecommended && adjustmentInfo && (
          <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
            {adjustmentInfo}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">往復費用計算</h4>
          <div className="space-y-1 text-sm">
            <p>行き費用: {result.outboundCost.toLocaleString()}円 ({result.outboundParticipants}人)</p>
            <p>帰り費用: {result.returnCost.toLocaleString()}円 ({result.returnParticipants}人)</p>
            <p className="font-bold text-blue-600 pt-1 border-t">総費用: {result.totalCost.toLocaleString()}円</p>
            <p>全参加者数: {result.allParticipants}人</p>
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">個人別一人当たり</h4>
          <div className="space-y-1 text-sm">
            <p>行き一人当たり: {result.outboundPerPerson.toLocaleString()}円</p>
            <p>帰り一人当たり: {result.returnPerPerson.toLocaleString()}円</p>
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">個人別負担（一部抜粋）</h4>
          <div className="space-y-2 text-sm">
            {result.participantCosts.slice(0, 5).map((pc) => (
              <div key={pc.participantId} className="border-l-2 border-blue-400 pl-2">
                <p className="font-medium">{pc.name}</p>
                {pc.outboundCost > 0 && pc.returnCost > 0 ? (
                  <p className="text-gray-600">
                    行き{pc.outboundCost.toLocaleString()}円 + 帰り{pc.returnCost.toLocaleString()}円 = {pc.totalCost.toLocaleString()}円
                  </p>
                ) : pc.outboundCost > 0 ? (
                  <p className="text-gray-600">行きのみ {pc.outboundCost.toLocaleString()}円</p>
                ) : (
                  <p className="text-gray-600">帰りのみ {pc.returnCost.toLocaleString()}円</p>
                )}
              </div>
            ))}
            {result.participantCosts.length > 5 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                他 {result.participantCosts.length - 5}名（詳細は展開用テキストで確認）
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">運転手間の差額調整（往復トータル）</h4>
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
  outboundVehicles,
  returnVehicles,
  participants,
  basicInfo,
  onExport,
  onImport
}: CalculationResultProps) {
  const [selectedRounding, setSelectedRounding] = useState<'up' | 'down'>(
    result?.recommendedMethod === 'roundUp' ? 'up' : 'down'
  );
  const [expandedText, setExpandedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (result) {
      setSelectedRounding(result.recommendedMethod === 'roundUp' ? 'up' : 'down');
    }
  }, [result]);

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
    const isRecommendedMethod = (selectedRounding === 'up' && result.recommendedMethod === 'roundUp') ||
                                 (selectedRounding === 'down' && result.recommendedMethod === 'roundDown');
    const adjustmentToUse = isRecommendedMethod ? result.returnAdjustment : 0;
    const text = generateTripResultText(basicInfo, outboundVehicles, returnVehicles, participants, selectedResult, selectedRounding, adjustmentToUse);
    setExpandedText(text);
  };

  const handleGenerateSimpleText = () => {
    if (!result) return;
    const selectedResult = selectedRounding === 'up' ? result.roundUp : result.roundDown;
    const isRecommendedMethod = (selectedRounding === 'up' && result.recommendedMethod === 'roundUp') ||
                                 (selectedRounding === 'down' && result.recommendedMethod === 'roundDown');
    const adjustmentToUse = isRecommendedMethod ? result.returnAdjustment : 0;
    const text = generateSimpleTripResultText(basicInfo, outboundVehicles, returnVehicles, participants, selectedResult, adjustmentToUse);
    setExpandedText(text);
  };

  const handleCopyText = async () => {
    if (!expandedText) return;
    try {
      await navigator.clipboard.writeText(expandedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
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
              isRecommended={result.recommendedMethod === 'roundUp'}
              adjustmentInfo={result.recommendedMethod === 'roundUp' && result.returnAdjustment !== 0
                ? `帰り${result.returnAdjustment > 0 ? '+' : ''}${result.returnAdjustment}円調整`
                : undefined}
            />
            <ResultColumn
              title="100円単位で切り捨て"
              result={result.roundDown}
              isRecommended={result.recommendedMethod === 'roundDown'}
              adjustmentInfo={result.recommendedMethod === 'roundDown' && result.returnAdjustment !== 0
                ? `帰り${result.returnAdjustment > 0 ? '+' : ''}${result.returnAdjustment}円調整`
                : undefined}
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
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
                onClick={handleGenerateSimpleText}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FileText size={20} />
                展開用テキストを出力
              </button>
              <button
                onClick={handleGenerateExpandedText}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FileText size={20} />
                展開用テキスト(計算式あり)を出力
              </button>
            </div>

            {expandedText ? (
              <div className="relative">
                <textarea
                  value={expandedText}
                  readOnly
                  className="w-full h-96 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none focus:outline-none"
                />
                <button
                  onClick={handleCopyText}
                  className="absolute top-2 right-2 p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors shadow-sm"
                  title="コピー"
                >
                  {isCopied ? (
                    <Check size={20} className="text-green-600" />
                  ) : (
                    <Copy size={20} className="text-gray-600" />
                  )}
                </button>
              </div>
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

import { BasicInfo } from '../types';

interface BasicInfoFormProps {
  basicInfo: BasicInfo;
  onChange: (info: BasicInfo) => void;
}

export default function BasicInfoForm({ basicInfo, onChange }: BasicInfoFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">基本情報</h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-4">
        入力すると共有用文章の作成時に出力されます。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            目的
            <span className="ml-2 text-xs text-gray-500 font-normal">任意</span>
          </label>
          <input
            type="text"
            value={basicInfo.purpose}
            onChange={(e) => onChange({ ...basicInfo, purpose: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            placeholder="例: 社員旅行"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            出発日時
            <span className="ml-2 text-xs text-gray-500 font-normal">任意</span>
          </label>
          <input
            type="datetime-local"
            value={basicInfo.departureTime}
            onChange={(e) => onChange({ ...basicInfo, departureTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            集合場所
            <span className="ml-2 text-xs text-gray-500 font-normal">任意</span>
          </label>
          <input
            type="text"
            value={basicInfo.meetingPlace}
            onChange={(e) => onChange({ ...basicInfo, meetingPlace: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            placeholder="例: 会社駐車場"
          />
        </div>
      </div>
    </div>
  );
}

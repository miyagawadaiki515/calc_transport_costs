import { BasicInfo, Participant, Vehicle } from '../types';

export function exportToCSV(
  basicInfo: BasicInfo,
  participants: Participant[],
  outboundVehicles: Vehicle[],
  returnVehicles: Vehicle[],
  resultText: string
): void {
  const lines: string[] = [];

  lines.push('# Basic Info');
  lines.push(`purpose,${escapeCSV(basicInfo.purpose)}`);
  lines.push(`departureTime,${escapeCSV(basicInfo.departureTime)}`);
  lines.push(`meetingPlace,${escapeCSV(basicInfo.meetingPlace)}`);
  lines.push('');

  lines.push('# Participants');
  lines.push('id,name,gender');
  participants.forEach(p => {
    lines.push(`${p.id},${escapeCSV(p.name)},${p.gender || ''}`);
  });
  lines.push('');

  lines.push('# Outbound Vehicles');
  lines.push('id,type,category,rentalCost,gasCost,highwayCost,seats');
  outboundVehicles.forEach(v => {
    const seatsJson = JSON.stringify(v.seats);
    const gasCostJson = v.gasCost ? JSON.stringify(v.gasCost) : '';
    const highwayCostJson = v.highwayCost ? JSON.stringify(v.highwayCost) : '';
    lines.push(`${v.id},${v.type},${v.category},${v.rentalCost || ''},${escapeCSV(gasCostJson)},${escapeCSV(highwayCostJson)},${escapeCSV(seatsJson)}`);
  });
  lines.push('');

  lines.push('# Return Vehicles');
  lines.push('id,type,category,rentalCost,gasCost,highwayCost,seats');
  returnVehicles.forEach(v => {
    const seatsJson = JSON.stringify(v.seats);
    const gasCostJson = v.gasCost ? JSON.stringify(v.gasCost) : '';
    const highwayCostJson = v.highwayCost ? JSON.stringify(v.highwayCost) : '';
    lines.push(`${v.id},${v.type},${v.category},${v.rentalCost || ''},${escapeCSV(gasCostJson)},${escapeCSV(highwayCostJson)},${escapeCSV(seatsJson)}`);
  });
  lines.push('');

  lines.push('# Result');
  lines.push('resultText');
  const resultLines = resultText.split('\n');
  resultLines.forEach(line => {
    lines.push(escapeCSV(line));
  });

  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const sanitizeFileName = (str: string): string => {
    return str.replace(/[/\\:*?"<>|]/g, '_').trim() || '未設定';
  };

  const extractDate = (dateTimeStr: string): string => {
    if (!dateTimeStr) return '未設定';
    const match = dateTimeStr.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : dateTimeStr.split('T')[0] || '未設定';
  };

  const purpose = sanitizeFileName(basicInfo.purpose || '未設定');
  const date = extractDate(basicInfo.departureTime);
  const meetingPlace = sanitizeFileName(basicInfo.meetingPlace || '未設定');
  const fileName = `${purpose}_${date}_${meetingPlace}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importFromCSV(
  content: string
): {
  basicInfo: BasicInfo;
  participants: Participant[];
  outboundVehicles: Vehicle[];
  returnVehicles: Vehicle[];
} | null {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    let section = '';
    const basicInfo: BasicInfo = { purpose: '', departureTime: '', meetingPlace: '' };
    const participants: Participant[] = [];
    const outboundVehicles: Vehicle[] = [];
    const returnVehicles: Vehicle[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('# Basic Info')) {
        section = 'basicInfo';
        continue;
      } else if (line.startsWith('# Participants')) {
        section = 'participants';
        continue;
      } else if (line.startsWith('# Outbound Vehicles')) {
        section = 'outboundVehicles';
        continue;
      } else if (line.startsWith('# Return Vehicles')) {
        section = 'returnVehicles';
        continue;
      } else if (line.startsWith('# Result')) {
        break;
      }

      if (section === 'basicInfo') {
        const [key, ...valueParts] = line.split(',');
        const value = unescapeCSV(valueParts.join(','));
        if (key === 'purpose') basicInfo.purpose = value;
        else if (key === 'departureTime') basicInfo.departureTime = value;
        else if (key === 'meetingPlace') basicInfo.meetingPlace = value;
      } else if (section === 'participants') {
        if (line === 'id,name,gender') continue;
        const parts = parseCSVLine(line);
        if (parts.length >= 2) {
          participants.push({
            id: parts[0],
            name: parts[1],
            gender: parts[2] ? (parts[2] as 'male' | 'female') : undefined
          });
        }
      } else if (section === 'outboundVehicles') {
        if (line.startsWith('id,type,')) continue;
        const parts = parseCSVLine(line);
        if (parts.length >= 7) {
          outboundVehicles.push({
            id: parts[0],
            type: parts[1] as any,
            category: (parts[2] as 'private' | 'rental') || 'private',
            rentalCost: parts[3] ? parseFloat(parts[3]) : undefined,
            gasCost: parts[4] ? JSON.parse(unescapeCSV(parts[4])) : undefined,
            highwayCost: parts[5] ? JSON.parse(unescapeCSV(parts[5])) : undefined,
            seats: JSON.parse(unescapeCSV(parts[6]))
          });
        }
      } else if (section === 'returnVehicles') {
        if (line.startsWith('id,type,')) continue;
        const parts = parseCSVLine(line);
        if (parts.length >= 7) {
          returnVehicles.push({
            id: parts[0],
            type: parts[1] as any,
            category: (parts[2] as 'private' | 'rental') || 'private',
            rentalCost: parts[3] ? parseFloat(parts[3]) : undefined,
            gasCost: parts[4] ? JSON.parse(unescapeCSV(parts[4])) : undefined,
            highwayCost: parts[5] ? JSON.parse(unescapeCSV(parts[5])) : undefined,
            seats: JSON.parse(unescapeCSV(parts[6]))
          });
        }
      }
    }

    return { basicInfo, participants, outboundVehicles, returnVehicles };
  } catch (error) {
    console.error('CSV import error:', error);
    return null;
  }
}

function escapeCSV(str: string): string {
  if (!str) return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function unescapeCSV(str: string): string {
  if (!str) return '';
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1).replace(/""/g, '"');
  }
  return str;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

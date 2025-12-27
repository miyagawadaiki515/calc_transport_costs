import { BasicInfo, Participant, Vehicle } from '../types';

export function exportToCSV(
  basicInfo: BasicInfo,
  participants: Participant[],
  vehicles: Vehicle[],
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

  lines.push('# Vehicles');
  lines.push('id,type,cost,seats');
  vehicles.forEach(v => {
    const seatsJson = JSON.stringify(v.seats);
    lines.push(`${v.id},${v.type},${v.cost},${escapeCSV(seatsJson)}`);
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
  vehicles: Vehicle[];
} | null {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    let section = '';
    const basicInfo: BasicInfo = { purpose: '', departureTime: '', meetingPlace: '' };
    const participants: Participant[] = [];
    const vehicles: Vehicle[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('# Basic Info')) {
        section = 'basicInfo';
        continue;
      } else if (line.startsWith('# Participants')) {
        section = 'participants';
        continue;
      } else if (line.startsWith('# Vehicles')) {
        section = 'vehicles';
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
      } else if (section === 'vehicles') {
        if (line === 'id,type,cost,seats') continue;
        const parts = parseCSVLine(line);
        if (parts.length >= 4) {
          vehicles.push({
            id: parts[0],
            type: parts[1] as any,
            cost: parseFloat(parts[2]) || 0,
            seats: JSON.parse(unescapeCSV(parts[3]))
          });
        }
      }
    }

    return { basicInfo, participants, vehicles };
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

import { Vehicle, Participant, CalculationResult, DualCalculationResult, getDriverSeatKey } from '../types';

function calculateSinglePattern(
  vehicles: Vehicle[],
  participants: Participant[],
  totalCost: number,
  totalParticipants: number,
  roundingMode: 'up' | 'down'
): CalculationResult {
  const rawPerPersonCost = totalParticipants > 0 ? totalCost / totalParticipants : 0;
  const perPersonCost = roundingMode === 'up'
    ? Math.ceil(rawPerPersonCost / 100) * 100
    : Math.floor(rawPerPersonCost / 100) * 100;

  const vehicleCollections = vehicles.map(vehicle => {
    const driverSeatKey = getDriverSeatKey(vehicle.type);
    const driverParticipantId = vehicle.seats[driverSeatKey];
    const driverParticipant = participants.find(p => p.id === driverParticipantId);
    const driverName = driverParticipant?.name || '未設定';

    const passengerCount = Object.values(vehicle.seats).filter(id => id).length;
    const collectionAmount = passengerCount * perPersonCost;

    return {
      vehicleId: vehicle.id,
      driverName,
      passengerCount,
      collectionAmount,
      actualCost: vehicle.cost || 0,
      difference: (vehicle.cost || 0) - collectionAmount
    };
  });

  const driverAdjustments: Array<{ from: string; to: string; amount: number }> = [];

  const driversNeedingMoney = vehicleCollections
    .filter(vc => vc.difference > 0)
    .map(vc => ({ name: vc.driverName, amount: vc.difference }));

  const driversWithExtraMoney = vehicleCollections
    .filter(vc => vc.difference < 0)
    .map(vc => ({ name: vc.driverName, amount: Math.abs(vc.difference) }));

  let i = 0, j = 0;
  while (i < driversWithExtraMoney.length && j < driversNeedingMoney.length) {
    const giver = driversWithExtraMoney[i];
    const receiver = driversNeedingMoney[j];

    const transferAmount = Math.min(giver.amount, receiver.amount);

    if (transferAmount > 0) {
      driverAdjustments.push({
        from: giver.name,
        to: receiver.name,
        amount: Math.round(transferAmount)
      });
    }

    giver.amount -= transferAmount;
    receiver.amount -= transferAmount;

    if (giver.amount === 0) i++;
    if (receiver.amount === 0) j++;
  }

  const totalCollected = vehicleCollections.reduce((sum, vc) => sum + vc.collectionAmount, 0);
  const totalDriverLoss = totalCollected - totalCost;

  return {
    totalCost,
    totalParticipants,
    perPersonCost,
    totalCollected,
    totalDriverLoss,
    vehicleCollections: vehicleCollections.map(vc => ({
      vehicleId: vc.vehicleId,
      driverName: vc.driverName,
      passengerCount: vc.passengerCount,
      collectionAmount: vc.collectionAmount
    })),
    driverAdjustments
  };
}

export function calculateTransportationCosts(
  vehicles: Vehicle[],
  participants: Participant[]
): DualCalculationResult {
  const totalCost = vehicles.reduce((sum, v) => sum + (v.cost || 0), 0);

  const allAssignedParticipants = new Set<string>();
  vehicles.forEach(vehicle => {
    Object.values(vehicle.seats).forEach(participantId => {
      if (participantId) {
        allAssignedParticipants.add(participantId);
      }
    });
  });

  const totalParticipants = allAssignedParticipants.size;

  return {
    roundUp: calculateSinglePattern(vehicles, participants, totalCost, totalParticipants, 'up'),
    roundDown: calculateSinglePattern(vehicles, participants, totalCost, totalParticipants, 'down')
  };
}

function formatDateTime(dateTimeString: string): string {
  if (!dateTimeString) return '未入力';

  try {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  } catch {
    return dateTimeString;
  }
}

export function generateResultText(
  basicInfo: { purpose: string; departureTime: string; meetingPlace: string },
  vehicles: Vehicle[],
  participants: Participant[],
  result: CalculationResult,
  roundingMode: 'up' | 'down'
): string {
  let text = '【移動情報】\n';
  text += `目的: ${basicInfo.purpose || '未入力'}\n`;
  text += `出発日時: ${formatDateTime(basicInfo.departureTime)}\n`;
  text += `集合場所: ${basicInfo.meetingPlace || '未入力'}\n\n`;

  vehicles.forEach((vehicle, index) => {
    text += `【車両${index + 1}】\n`;

    const driverSeatKey = getDriverSeatKey(vehicle.type);
    const driverParticipantId = vehicle.seats[driverSeatKey];
    const driverParticipant = participants.find(p => p.id === driverParticipantId);
    text += `運転手: ${driverParticipant?.name || '未設定'}\n`;

    const passengers = Object.entries(vehicle.seats)
      .filter(([key, id]) => key !== driverSeatKey && id)
      .map(([_, id]) => participants.find(p => p.id === id)?.name)
      .filter(Boolean);

    text += `乗車メンバー: ${passengers.length > 0 ? passengers.join(', ') : 'なし'}\n`;
    text += `車両費用: ${vehicle.cost || 0}円\n\n`;
  });

  text += '【費用計算】\n';
  text += `総費用: ${result.totalCost}円\n`;
  text += `総参加者数: ${result.totalParticipants}人\n`;
  text += `一人当たり金額: ${result.perPersonCost}円（100円単位で${roundingMode === 'up' ? '切り上げ' : '切り捨て'}）\n`;
  text += `徴収総額: ${result.totalCollected}円\n`;
  text += `運転手負担額: ${result.totalDriverLoss}円\n\n`;

  text += '【各車での徴収】\n';
  result.vehicleCollections.forEach((vc, index) => {
    text += `車両${index + 1}: ${vc.driverName}が${vc.passengerCount}人から${result.perPersonCost}円ずつ徴収 → 合計${vc.collectionAmount}円\n`;
  });

  text += '\n【運転手間の差額調整】\n';
  if (result.driverAdjustments.length === 0) {
    text += '調整不要\n';
  } else {
    result.driverAdjustments.forEach(adj => {
      text += `${adj.from}は${adj.amount}円を${adj.to}に渡す\n`;
    });
  }

  return text;
}

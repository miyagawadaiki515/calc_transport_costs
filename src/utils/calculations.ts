import { Vehicle, Participant, CalculationResult, DualCalculationResult, TripCalculationResult, DualTripCalculationResult, getDriverSeatKey } from '../types';

function calculateVehicleCost(vehicle: Vehicle, direction: 'outbound' | 'return', linkedVehicle?: Vehicle): number {
  let totalCost = 0;

  if (direction === 'outbound') {
    if (vehicle.category === 'rental' && vehicle.rentalCost) {
      totalCost += vehicle.rentalCost / 2;
    }
    if (vehicle.gasCost) {
      totalCost += vehicle.gasCost.amount;
    }
    if (vehicle.highwayCost) {
      totalCost += vehicle.highwayCost.amount;
    }
  } else {
    const isRentalAlreadyCounted = linkedVehicle?.category === 'rental';
    const isGasRoundTrip = linkedVehicle?.gasCost?.type === 'round-trip';
    const isHighwayRoundTrip = linkedVehicle?.highwayCost?.type === 'round-trip';

    if (isRentalAlreadyCounted && vehicle.category === 'rental' && vehicle.rentalCost) {
      totalCost += vehicle.rentalCost / 2;
    } else if (!isRentalAlreadyCounted && vehicle.category === 'rental' && vehicle.rentalCost) {
      totalCost += vehicle.rentalCost;
    }
    if (!isGasRoundTrip && vehicle.gasCost) {
      totalCost += vehicle.gasCost.amount;
    }
    if (!isHighwayRoundTrip && vehicle.highwayCost) {
      totalCost += vehicle.highwayCost.amount;
    }
  }

  return totalCost;
}

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
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    const driverName = driverSeat?.name || '未設定';

    const totalInVehicle = Object.values(vehicle.seats).filter(seat => seat).length;
    const passengerCount = totalInVehicle > 0 ? totalInVehicle - 1 : 0;
    const collectionAmount = passengerCount * perPersonCost;
    const actualCost = calculateVehicleCost(vehicle, 'outbound');

    return {
      vehicleId: vehicle.id,
      driverName,
      passengerCount,
      collectionAmount,
      actualCost,
      difference: actualCost - collectionAmount
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
    const roundedTransferAmount = Math.round(transferAmount / 100) * 100;

    if (roundedTransferAmount > 0) {
      driverAdjustments.push({
        from: giver.name,
        to: receiver.name,
        amount: roundedTransferAmount
      });
    }

    giver.amount -= transferAmount;
    receiver.amount -= transferAmount;

    if (giver.amount === 0) i++;
    if (receiver.amount === 0) j++;
  }

  const totalCollected = vehicleCollections.reduce((sum, vc) => sum + vc.collectionAmount, 0);
  const totalDriverLoss = totalCollected - totalCost;

  const driverBalanceMap = new Map<string, { vehicleCost: number; collectedAmount: number; adjustments: number }>();

  vehicleCollections.forEach(vc => {
    driverBalanceMap.set(vc.driverName, {
      vehicleCost: vc.actualCost,
      collectedAmount: vc.collectionAmount,
      adjustments: 0
    });
  });

  driverAdjustments.forEach(adj => {
    const giver = driverBalanceMap.get(adj.from);
    const receiver = driverBalanceMap.get(adj.to);
    if (giver) giver.adjustments -= adj.amount;
    if (receiver) receiver.adjustments += adj.amount;
  });

  const driverNames = Array.from(driverBalanceMap.keys());
  const driverCount = driverNames.length;

  const currentBalances = new Map<string, number>();
  driverNames.forEach(name => {
    const data = driverBalanceMap.get(name)!;
    currentBalances.set(name, data.collectedAmount - data.vehicleCost + data.adjustments);
  });

  const totalBalance = Array.from(currentBalances.values()).reduce((sum, balance) => sum + balance, 0);

  const baseAmount = Math.floor(totalBalance / driverCount / 100) * 100;
  const remainder = totalBalance - (baseAmount * driverCount);
  const extraCount = Math.round(remainder / 100);

  const targetBalances = new Map<string, number>();
  driverNames.forEach((name, index) => {
    targetBalances.set(name, baseAmount + (index < extraCount ? 100 : 0));
  });

  const equalizationNeeds: Array<{ name: string; amount: number }> = [];
  const equalizationSurplus: Array<{ name: string; amount: number }> = [];

  driverNames.forEach(name => {
    const currentBalance = currentBalances.get(name)!;
    const targetBalance = targetBalances.get(name)!;
    const diff = targetBalance - currentBalance;

    if (diff > 0) {
      equalizationNeeds.push({ name, amount: diff });
    } else if (diff < 0) {
      equalizationSurplus.push({ name, amount: Math.abs(diff) });
    }
  });

  let ei = 0, ej = 0;
  while (ei < equalizationSurplus.length && ej < equalizationNeeds.length) {
    const giver = equalizationSurplus[ei];
    const receiver = equalizationNeeds[ej];
    const transferAmount = Math.min(giver.amount, receiver.amount);
    const roundedTransferAmount = Math.round(transferAmount / 100) * 100;

    if (roundedTransferAmount > 0) {
      driverAdjustments.push({
        from: giver.name,
        to: receiver.name,
        amount: roundedTransferAmount
      });

      const giverData = driverBalanceMap.get(giver.name)!;
      const receiverData = driverBalanceMap.get(receiver.name)!;
      giverData.adjustments -= roundedTransferAmount;
      receiverData.adjustments += roundedTransferAmount;
    }

    giver.amount -= transferAmount;
    receiver.amount -= transferAmount;

    if (giver.amount === 0) ei++;
    if (receiver.amount === 0) ej++;
  }

  const driverFinalBalances = Array.from(driverBalanceMap.entries()).map(([driverName, data]) => ({
    driverName,
    vehicleCost: data.vehicleCost,
    collectedAmount: data.collectedAmount,
    finalBalance: data.collectedAmount - data.vehicleCost + data.adjustments
  }));

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
    driverAdjustments,
    driverFinalBalances
  };
}

export function calculateTransportationCosts(
  vehicles: Vehicle[],
  participants: Participant[]
): DualCalculationResult {
  const totalCost = vehicles.reduce((sum, v) => sum + calculateVehicleCost(v, 'outbound'), 0);

  const allAssignedParticipants = new Set<string>();
  const driverNames = new Set<string>();

  vehicles.forEach(vehicle => {
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    if (driverSeat) {
      driverNames.add(driverSeat.name);
    }

    Object.values(vehicle.seats).forEach(seat => {
      if (seat) {
        allAssignedParticipants.add(seat.name);
      }
    });
  });

  const totalParticipants = allAssignedParticipants.size - driverNames.size;

  const roundUp = calculateSinglePattern(vehicles, participants, totalCost, totalParticipants, 'up');
  const roundDown = calculateSinglePattern(vehicles, participants, totalCost, totalParticipants, 'down');

  const roundUpTotal = roundUp.driverAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const roundDownTotal = roundDown.driverAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

  return {
    roundUp,
    roundDown,
    recommendedMethod: roundUpTotal <= roundDownTotal ? 'roundUp' : 'roundDown'
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
  let text = `目的: ${basicInfo.purpose || '未入力'}\n`;
  text += `出発日時: ${formatDateTime(basicInfo.departureTime)}\n`;
  text += `集合場所: ${basicInfo.meetingPlace || '未入力'}\n\n`;

  vehicles.forEach((vehicle, index) => {
    const categoryLabel = vehicle.category === 'rental' ? 'レンタカー' : '自家用車';
    text += `【車両${index + 1}】(${categoryLabel})\n`;

    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    text += `運転手: ${driverSeat?.name || '未設定'}\n`;

    const passengers = Object.entries(vehicle.seats)
      .filter(([key, seat]) => key !== driverSeatKey && seat)
      .map(([_, seat]) => seat.name)
      .filter(Boolean);

    text += `乗車メンバー: ${passengers.length > 0 ? passengers.join(', ') : 'なし'}\n`;

    text += '費用内訳:\n';
    if (vehicle.category === 'rental' && vehicle.rentalCost) {
      const halfCost = vehicle.rentalCost / 2;
      text += `  レンタカー代: ${halfCost.toLocaleString()}円(往復${vehicle.rentalCost.toLocaleString()}円の半額)\n`;
    }
    if (vehicle.gasCost) {
      const typeLabel = vehicle.gasCost.type === 'round-trip' ? '往復' : '片道';
      text += `  ガソリン代: ${vehicle.gasCost.amount.toLocaleString()}円(${typeLabel})\n`;
    }
    if (vehicle.highwayCost) {
      const typeLabel = vehicle.highwayCost.type === 'round-trip' ? '往復' : '片道';
      text += `  高速代: ${vehicle.highwayCost.amount.toLocaleString()}円(${typeLabel})\n`;
    }

    const vehicleCost = calculateVehicleCost(vehicle, 'outbound');
    text += `車両費用合計: ${vehicleCost.toLocaleString()}円\n\n`;
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

  text += '\n【運転手の最終収支】\n';
  result.driverFinalBalances.forEach(balance => {
    const sign = balance.finalBalance >= 0 ? '+' : '';
    text += `${balance.driverName}: 車両費用${balance.vehicleCost}円 - 徴収${balance.collectedAmount}円 = ${sign}${balance.finalBalance}円\n`;
  });

  return text;
}

function calculateTripPattern(
  outboundVehicles: Vehicle[],
  returnVehicles: Vehicle[],
  participants: Participant[],
  roundingMode: 'up' | 'down',
  outboundAdjustment: number = 0,
  returnAdjustment: number = 0
): TripCalculationResult {
  const outboundCost = outboundVehicles.reduce((sum, v) => {
    return sum + calculateVehicleCost(v, 'outbound');
  }, 0);

  const returnCost = returnVehicles.reduce((sum, v, index) => {
    const linkedVehicle = outboundVehicles[index];
    return sum + calculateVehicleCost(v, 'return', linkedVehicle);
  }, 0);

  const totalCost = outboundCost + returnCost;

  const outboundParticipantNames = new Set<string>();
  const outboundDriverNames = new Set<string>();
  outboundVehicles.forEach(vehicle => {
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    if (driverSeat) {
      outboundDriverNames.add(driverSeat.name);
    }
    Object.values(vehicle.seats).forEach(seat => {
      if (seat) outboundParticipantNames.add(seat.name);
    });
  });

  const returnParticipantNames = new Set<string>();
  const returnDriverNames = new Set<string>();
  returnVehicles.forEach(vehicle => {
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    if (driverSeat) {
      returnDriverNames.add(driverSeat.name);
    }
    Object.values(vehicle.seats).forEach(seat => {
      if (seat) returnParticipantNames.add(seat.name);
    });
  });

  const allParticipantNames = new Set([...outboundParticipantNames, ...returnParticipantNames]);
  const allDriverNames = new Set([...outboundDriverNames, ...returnDriverNames]);

  const outboundParticipants = outboundParticipantNames.size - outboundDriverNames.size;
  const returnParticipants = returnParticipantNames.size - returnDriverNames.size;
  const allParticipants = allParticipantNames.size - allDriverNames.size;

  const rawOutboundPerPerson = outboundParticipants > 0 ? outboundCost / outboundParticipants : 0;
  const rawReturnPerPerson = returnParticipants > 0 ? returnCost / returnParticipants : 0;

  const baseOutboundPerPerson = roundingMode === 'up'
    ? Math.ceil(rawOutboundPerPerson / 100) * 100
    : Math.floor(rawOutboundPerPerson / 100) * 100;

  const baseReturnPerPerson = roundingMode === 'up'
    ? Math.ceil(rawReturnPerPerson / 100) * 100
    : Math.floor(rawReturnPerPerson / 100) * 100;

  const outboundPerPerson = baseOutboundPerPerson + outboundAdjustment;
  const returnPerPerson = baseReturnPerPerson + returnAdjustment;

  const participantCosts = Array.from(allParticipantNames).map(name => {
    const participant = participants.find(p => p.name === name);
    const isDriver = allDriverNames.has(name);
    const isOutbound = outboundParticipantNames.has(name);
    const isReturn = returnParticipantNames.has(name);

    return {
      participantId: participant?.id || name,
      name,
      isDriver,
      outboundCost: isDriver ? 0 : (isOutbound ? outboundPerPerson : 0),
      returnCost: isDriver ? 0 : (isReturn ? returnPerPerson : 0),
      totalCost: isDriver ? 0 : ((isOutbound ? outboundPerPerson : 0) + (isReturn ? returnPerPerson : 0))
    };
  });

  const outboundCollections = outboundVehicles.map((vehicle) => {
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    const totalInVehicle = Object.values(vehicle.seats).filter(seat => seat).length;
    const passengerCount = totalInVehicle > 0 ? totalInVehicle - 1 : 0;
    const actualCost = calculateVehicleCost(vehicle, 'outbound');

    return {
      vehicleId: vehicle.id,
      driverName: driverSeat?.name || '未設定',
      passengerCount,
      perPersonCost: outboundPerPerson,
      collectionAmount: passengerCount * outboundPerPerson,
      actualCost
    };
  });

  const returnCollections = returnVehicles.map((vehicle, index) => {
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    const totalInVehicle = Object.values(vehicle.seats).filter(seat => seat).length;
    const passengerCount = totalInVehicle > 0 ? totalInVehicle - 1 : 0;
    const linkedVehicle = outboundVehicles[index];
    const actualCost = calculateVehicleCost(vehicle, 'return', linkedVehicle);

    return {
      vehicleId: vehicle.id,
      driverName: driverSeat?.name || '未設定',
      passengerCount,
      perPersonCost: returnPerPerson,
      collectionAmount: passengerCount * returnPerPerson,
      actualCost
    };
  });

  const driverDifferences = new Map<string, number>();

  outboundCollections.forEach(vc => {
    const diff = vc.actualCost - vc.collectionAmount;
    driverDifferences.set(vc.driverName, (driverDifferences.get(vc.driverName) || 0) + diff);
  });

  returnCollections.forEach(vc => {
    const diff = vc.actualCost - vc.collectionAmount;
    driverDifferences.set(vc.driverName, (driverDifferences.get(vc.driverName) || 0) + diff);
  });

  const driversNeedingMoney: Array<{ name: string; amount: number }> = [];
  const driversWithExtraMoney: Array<{ name: string; amount: number }> = [];

  driverDifferences.forEach((amount, name) => {
    if (amount > 0) {
      driversNeedingMoney.push({ name, amount });
    } else if (amount < 0) {
      driversWithExtraMoney.push({ name, amount: Math.abs(amount) });
    }
  });

  const driverAdjustments: Array<{ from: string; to: string; amount: number }> = [];
  let i = 0, j = 0;
  while (i < driversWithExtraMoney.length && j < driversNeedingMoney.length) {
    const giver = driversWithExtraMoney[i];
    const receiver = driversNeedingMoney[j];
    const transferAmount = Math.min(giver.amount, receiver.amount);
    const roundedTransferAmount = Math.round(transferAmount / 100) * 100;

    if (roundedTransferAmount > 0) {
      driverAdjustments.push({
        from: giver.name,
        to: receiver.name,
        amount: roundedTransferAmount
      });
    }

    giver.amount -= transferAmount;
    receiver.amount -= transferAmount;

    if (giver.amount === 0) i++;
    if (receiver.amount === 0) j++;
  }

  const driverBalanceMap = new Map<string, { outboundCost: number; returnCost: number; collectedAmount: number; adjustments: number }>();

  outboundCollections.forEach(vc => {
    const existing = driverBalanceMap.get(vc.driverName) || { outboundCost: 0, returnCost: 0, collectedAmount: 0, adjustments: 0 };
    existing.outboundCost = vc.actualCost;
    existing.collectedAmount += vc.collectionAmount;
    driverBalanceMap.set(vc.driverName, existing);
  });

  returnCollections.forEach(vc => {
    const existing = driverBalanceMap.get(vc.driverName) || { outboundCost: 0, returnCost: 0, collectedAmount: 0, adjustments: 0 };
    existing.returnCost = vc.actualCost;
    existing.collectedAmount += vc.collectionAmount;
    driverBalanceMap.set(vc.driverName, existing);
  });

  driverAdjustments.forEach(adj => {
    const giver = driverBalanceMap.get(adj.from);
    const receiver = driverBalanceMap.get(adj.to);
    if (giver) giver.adjustments -= adj.amount;
    if (receiver) receiver.adjustments += adj.amount;
  });

  const driverNames = Array.from(driverBalanceMap.keys());
  const driverCount = driverNames.length;

  const currentBalances = new Map<string, number>();
  driverNames.forEach(name => {
    const data = driverBalanceMap.get(name)!;
    currentBalances.set(name, data.collectedAmount - (data.outboundCost + data.returnCost) + data.adjustments);
  });

  const totalBalance = Array.from(currentBalances.values()).reduce((sum, balance) => sum + balance, 0);

  const baseAmount = Math.floor(totalBalance / driverCount / 100) * 100;
  const remainder = totalBalance - (baseAmount * driverCount);
  const extraCount = Math.round(remainder / 100);

  const targetBalances = new Map<string, number>();
  driverNames.forEach((name, index) => {
    targetBalances.set(name, baseAmount + (index < extraCount ? 100 : 0));
  });

  const equalizationNeeds: Array<{ name: string; amount: number }> = [];
  const equalizationSurplus: Array<{ name: string; amount: number }> = [];

  driverNames.forEach(name => {
    const currentBalance = currentBalances.get(name)!;
    const targetBalance = targetBalances.get(name)!;
    const diff = targetBalance - currentBalance;

    if (diff > 0) {
      equalizationNeeds.push({ name, amount: diff });
    } else if (diff < 0) {
      equalizationSurplus.push({ name, amount: Math.abs(diff) });
    }
  });

  let ei = 0, ej = 0;
  while (ei < equalizationSurplus.length && ej < equalizationNeeds.length) {
    const giver = equalizationSurplus[ei];
    const receiver = equalizationNeeds[ej];
    const transferAmount = Math.min(giver.amount, receiver.amount);
    const roundedTransferAmount = Math.round(transferAmount / 100) * 100;

    if (roundedTransferAmount > 0) {
      driverAdjustments.push({
        from: giver.name,
        to: receiver.name,
        amount: roundedTransferAmount
      });

      const giverData = driverBalanceMap.get(giver.name)!;
      const receiverData = driverBalanceMap.get(receiver.name)!;
      giverData.adjustments -= roundedTransferAmount;
      receiverData.adjustments += roundedTransferAmount;
    }

    giver.amount -= transferAmount;
    receiver.amount -= transferAmount;

    if (giver.amount === 0) ei++;
    if (receiver.amount === 0) ej++;
  }

  const driverFinalBalances = Array.from(driverBalanceMap.entries()).map(([driverName, data]) => ({
    driverName,
    outboundCost: data.outboundCost,
    returnCost: data.returnCost,
    totalVehicleCost: data.outboundCost + data.returnCost,
    collectedAmount: data.collectedAmount,
    finalBalance: data.collectedAmount - (data.outboundCost + data.returnCost) + data.adjustments
  }));

  return {
    outboundCost,
    returnCost,
    outboundParticipants,
    returnParticipants,
    totalCost,
    allParticipants,
    outboundPerPerson,
    returnPerPerson,
    participantCosts,
    outboundCollections: outboundCollections.map(vc => ({
      vehicleId: vc.vehicleId,
      driverName: vc.driverName,
      passengerCount: vc.passengerCount,
      perPersonCost: vc.perPersonCost,
      collectionAmount: vc.collectionAmount
    })),
    returnCollections: returnCollections.map(vc => ({
      vehicleId: vc.vehicleId,
      driverName: vc.driverName,
      passengerCount: vc.passengerCount,
      perPersonCost: vc.perPersonCost,
      collectionAmount: vc.collectionAmount
    })),
    driverAdjustments,
    driverFinalBalances
  };
}

export function calculateRoundTripCosts(
  outboundVehicles: Vehicle[],
  returnVehicles: Vehicle[],
  participants: Participant[]
): DualTripCalculationResult {
  const hasReturn = returnVehicles.length > 0;
  const hasOutbound = outboundVehicles.length > 0;

  const adjustmentPatterns: Array<[number, number]> = hasReturn && hasOutbound
    ? [[0, 0], [100, 0], [-100, 0], [0, 100], [0, -100]]
    : [[0, 0]];

  let bestPattern: {
    result: TripCalculationResult;
    method: 'roundUp' | 'roundDown';
    outboundAdjustment: number;
    returnAdjustment: number;
    score: number
  } | null = null;

  for (const roundingMode of ['up', 'down'] as const) {
    for (const [outboundAdj, returnAdj] of adjustmentPatterns) {
      const result = calculateTripPattern(
        outboundVehicles,
        returnVehicles,
        participants,
        roundingMode,
        outboundAdj,
        returnAdj
      );

      const score = result.driverFinalBalances.reduce((sum, balance) => sum + Math.abs(balance.finalBalance), 0);

      if (bestPattern === null || score < bestPattern.score) {
        bestPattern = {
          result,
          method: roundingMode === 'up' ? 'roundUp' : 'roundDown',
          outboundAdjustment: outboundAdj,
          returnAdjustment: returnAdj,
          score
        };
      }
    }
  }

  const roundUp = bestPattern!.method === 'roundUp'
    ? bestPattern!.result
    : calculateTripPattern(outboundVehicles, returnVehicles, participants, 'up', 0, 0);

  const roundDown = bestPattern!.method === 'roundDown'
    ? bestPattern!.result
    : calculateTripPattern(outboundVehicles, returnVehicles, participants, 'down', 0, 0);

  return {
    roundUp,
    roundDown,
    recommendedMethod: bestPattern!.method,
    outboundAdjustment: bestPattern!.outboundAdjustment,
    returnAdjustment: bestPattern!.returnAdjustment
  };
}

export function generateTripResultText(
  basicInfo: { purpose: string; departureTime: string; meetingPlace: string },
  outboundVehicles: Vehicle[],
  returnVehicles: Vehicle[],
  participants: Participant[],
  result: TripCalculationResult,
  roundingMode: 'up' | 'down',
  outboundAdjustment: number = 0,
  returnAdjustment: number = 0
): string {
  let text = `目的: ${basicInfo.purpose || '未入力'}\n`;
  text += `出発時間: ${formatDateTime(basicInfo.departureTime)}\n`;
  text += `集合場所: ${basicInfo.meetingPlace || '未入力'}\n\n`;

  text += '━━━━━━━━━━━━━━━━━━━━━━\n';
  text += '【行き】\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  outboundVehicles.forEach((vehicle, index) => {
    const categoryLabel = vehicle.category === 'rental' ? 'レンタカー' : '自家用車';
    text += `【車両${index + 1}】(${categoryLabel})\n`;
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    text += `運転手: ${driverSeat?.name || '未設定'}\n`;

    const passengers = Object.entries(vehicle.seats)
      .filter(([key, seat]) => key !== driverSeatKey && seat)
      .map(([_, seat]) => seat.name)
      .filter(Boolean);

    text += `乗車メンバー: ${passengers.length > 0 ? passengers.join(', ') : 'なし'}\n`;

    text += '費用内訳:\n';
    if (vehicle.category === 'rental' && vehicle.rentalCost) {
      const halfCost = vehicle.rentalCost / 2;
      text += `  レンタカー代: ${halfCost.toLocaleString()}円(往復${vehicle.rentalCost.toLocaleString()}円の半額)\n`;
    }
    if (vehicle.gasCost) {
      const typeLabel = vehicle.gasCost.type === 'round-trip' ? '往復' : '片道';
      text += `  ガソリン代: ${vehicle.gasCost.amount.toLocaleString()}円(${typeLabel})\n`;
    }
    if (vehicle.highwayCost) {
      const typeLabel = vehicle.highwayCost.type === 'round-trip' ? '往復' : '片道';
      text += `  高速代: ${vehicle.highwayCost.amount.toLocaleString()}円(${typeLabel})\n`;
    }

    const vehicleCost = calculateVehicleCost(vehicle, 'outbound');
    text += `車両費用合計: ${vehicleCost.toLocaleString()}円\n\n`;
  });

  text += `行き 小計: ${result.outboundCost}円\n`;
  text += `行き 参加者数: ${result.outboundParticipants}人\n\n`;

  text += '━━━━━━━━━━━━━━━━━━━━━━\n';
  text += '【帰り】\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  returnVehicles.forEach((vehicle, index) => {
    const categoryLabel = vehicle.category === 'rental' ? 'レンタカー' : '自家用車';
    text += `【車両${index + 1}】(${categoryLabel})\n`;
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    text += `運転手: ${driverSeat?.name || '未設定'}\n`;

    const passengers = Object.entries(vehicle.seats)
      .filter(([key, seat]) => key !== driverSeatKey && seat)
      .map(([_, seat]) => seat.name)
      .filter(Boolean);

    text += `乗車メンバー: ${passengers.length > 0 ? passengers.join(', ') : 'なし'}\n`;

    const linkedVehicle = outboundVehicles[index];
    const isRentalAlreadyCounted = linkedVehicle?.category === 'rental';
    const isGasRoundTrip = linkedVehicle?.gasCost?.type === 'round-trip';
    const isHighwayRoundTrip = linkedVehicle?.highwayCost?.type === 'round-trip';

    text += '費用内訳:\n';
    if (vehicle.category === 'rental') {
      if (isRentalAlreadyCounted && vehicle.rentalCost) {
        const halfCost = vehicle.rentalCost / 2;
        text += `  レンタカー代: ${halfCost.toLocaleString()}円(往復${vehicle.rentalCost.toLocaleString()}円の半額)\n`;
      } else if (vehicle.rentalCost) {
        text += `  レンタカー代: ${vehicle.rentalCost.toLocaleString()}円(往復分)\n`;
      }
    }
    if (isGasRoundTrip) {
      text += '  ガソリン代: (往復分として計上済み)\n';
    } else if (vehicle.gasCost) {
      const typeLabel = vehicle.gasCost.type === 'round-trip' ? '往復' : '片道';
      text += `  ガソリン代: ${vehicle.gasCost.amount.toLocaleString()}円(${typeLabel})\n`;
    }
    if (isHighwayRoundTrip) {
      text += '  高速代: (往復分として計上済み)\n';
    } else if (vehicle.highwayCost) {
      const typeLabel = vehicle.highwayCost.type === 'round-trip' ? '往復' : '片道';
      text += `  高速代: ${vehicle.highwayCost.amount.toLocaleString()}円(${typeLabel})\n`;
    }

    const vehicleCost = calculateVehicleCost(vehicle, 'return', linkedVehicle);
    text += `車両費用合計: ${vehicleCost.toLocaleString()}円\n\n`;
  });

  text += `帰り 小計: ${result.returnCost}円\n`;
  text += `帰り 参加者数: ${result.returnParticipants}人\n\n`;

  text += '━━━━━━━━━━━━━━━━━━━━━━\n';
  text += '【費用計算(往復合算)】\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  text += `総費用: ${result.totalCost}円\n`;
  text += `全参加者数: ${result.allParticipants}人\n`;
  text += `計算方式: 100円単位で${roundingMode === 'up' ? '切り上げ' : '切り捨て'}\n`;
  if (outboundAdjustment !== 0 || returnAdjustment !== 0) {
    const adjustments: string[] = [];
    if (outboundAdjustment !== 0) {
      adjustments.push(`行き${outboundAdjustment > 0 ? '+' : ''}${outboundAdjustment}円`);
    }
    if (returnAdjustment !== 0) {
      adjustments.push(`帰り${returnAdjustment > 0 ? '+' : ''}${returnAdjustment}円`);
    }
    text += `※一人当たり金額調整: ${adjustments.join('、')}（運転手収支最適化）\n`;
  }
  text += '\n【個人別負担】\n';
  result.participantCosts.forEach(pc => {
    if (pc.isDriver) {
      text += `${pc.name}: 差額を運転手間で調整\n`;
    } else if (pc.outboundCost > 0 && pc.returnCost > 0) {
      const outboundDriver = outboundVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      const returnDriver = returnVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      const driverText = outboundDriver === returnDriver
        ? `を${outboundDriver}に支払い`
        : `を行き${outboundDriver}、帰り${returnDriver}に支払い`;

      text += `${pc.name}: 行き${pc.outboundCost}円 + 帰り${pc.returnCost}円 = 合計${pc.totalCost}円${driverText}\n`;
    } else if (pc.outboundCost > 0) {
      const outboundDriver = outboundVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      text += `${pc.name}: 行きのみ${pc.outboundCost}円を${outboundDriver}に支払い\n`;
    } else if (pc.returnCost > 0) {
      const returnDriver = returnVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      text += `${pc.name}: 帰りのみ${pc.returnCost}円を${returnDriver}に支払い\n`;
    }
  });

  text += '\n【各車での徴収(行き)】\n';
  result.outboundCollections.forEach((vc, index) => {
    text += `車両${index + 1}: ${vc.driverName}が${vc.passengerCount}人から${vc.perPersonCost}円ずつ徴収 → 合計${vc.collectionAmount}円\n`;
  });

  text += '\n【各車での徴収(帰り)】\n';
  result.returnCollections.forEach((vc, index) => {
    text += `車両${index + 1}: ${vc.driverName}が${vc.passengerCount}人から${vc.perPersonCost}円ずつ徴収 → 合計${vc.collectionAmount}円\n`;
  });

  text += '\n【運転手間の差額調整(往復トータル)】\n';
  if (result.driverAdjustments.length === 0) {
    text += '調整不要\n';
  } else {
    result.driverAdjustments.forEach(adj => {
      text += `${adj.from}は${adj.amount}円を${adj.to}に渡す\n`;
    });
  }

  text += '\n【運転手の最終収支】\n';
  result.driverFinalBalances.forEach(balance => {
    const sign = balance.finalBalance >= 0 ? '+' : '';
    text += `${balance.driverName}: 車両費用合計${balance.totalVehicleCost}円(行き${balance.outboundCost}円+帰り${balance.returnCost}円) - 徴収${balance.collectedAmount}円 = ${sign}${balance.finalBalance}円\n`;
  });

  return text;
}

export function generateSimpleTripResultText(
  basicInfo: { purpose: string; departureTime: string; meetingPlace: string },
  outboundVehicles: Vehicle[],
  returnVehicles: Vehicle[],
  participants: Participant[],
  result: TripCalculationResult,
  outboundAdjustment: number = 0,
  returnAdjustment: number = 0
): string {
  let text = `目的: ${basicInfo.purpose || '未入力'}\n`;
  text += `出発時間: ${formatDateTime(basicInfo.departureTime)}\n`;
  text += `集合場所: ${basicInfo.meetingPlace || '未入力'}\n\n`;

  text += '━━━━━━━━━━━━━━━━━━━━━━\n';
  text += '【行き】\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  outboundVehicles.forEach((vehicle, index) => {
    const categoryLabel = vehicle.category === 'rental' ? 'レンタカー' : '自家用車';
    text += `【車両${index + 1}】(${categoryLabel})\n`;
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    text += `運転手: ${driverSeat?.name || '未設定'}\n`;

    const passengers = Object.entries(vehicle.seats)
      .filter(([key, seat]) => key !== driverSeatKey && seat)
      .map(([_, seat]) => seat.name)
      .filter(Boolean);

    text += `乗車メンバー: ${passengers.length > 0 ? passengers.join(', ') : 'なし'}\n\n`;
  });

  text += '━━━━━━━━━━━━━━━━━━━━━━\n';
  text += '【帰り】\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  returnVehicles.forEach((vehicle, index) => {
    const categoryLabel = vehicle.category === 'rental' ? 'レンタカー' : '自家用車';
    text += `【車両${index + 1}】(${categoryLabel})\n`;
    const driverSeatKey = getDriverSeatKey(vehicle);
    const driverSeat = vehicle.seats[driverSeatKey];
    text += `運転手: ${driverSeat?.name || '未設定'}\n`;

    const passengers = Object.entries(vehicle.seats)
      .filter(([key, seat]) => key !== driverSeatKey && seat)
      .map(([_, seat]) => seat.name)
      .filter(Boolean);

    text += `乗車メンバー: ${passengers.length > 0 ? passengers.join(', ') : 'なし'}\n\n`;
  });

  text += '━━━━━━━━━━━━━━━━━━━━━━\n';
  text += '【費用計算(往復合算)】\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  if (outboundAdjustment !== 0 || returnAdjustment !== 0) {
    const adjustments: string[] = [];
    if (outboundAdjustment !== 0) {
      adjustments.push(`行き${outboundAdjustment > 0 ? '+' : ''}${outboundAdjustment}円`);
    }
    if (returnAdjustment !== 0) {
      adjustments.push(`帰り${returnAdjustment > 0 ? '+' : ''}${returnAdjustment}円`);
    }
    text += `※一人当たり金額調整: ${adjustments.join('、')}（運転手収支最適化）\n\n`;
  }

  text += '【個人別負担】\n';
  result.participantCosts.forEach(pc => {
    if (pc.isDriver) {
      text += `${pc.name}: 差額を運転手間で調整\n`;
    } else if (pc.outboundCost > 0 && pc.returnCost > 0) {
      const outboundDriver = outboundVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      const returnDriver = returnVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      const driverText = outboundDriver === returnDriver
        ? `を${outboundDriver}に支払い`
        : `を行き${outboundDriver}、帰り${returnDriver}に支払い`;

      text += `${pc.name}: 行き${pc.outboundCost}円 + 帰り${pc.returnCost}円 = 合計${pc.totalCost}円${driverText}\n`;
    } else if (pc.outboundCost > 0) {
      const outboundDriver = outboundVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      text += `${pc.name}: 行きのみ${pc.outboundCost}円を${outboundDriver}に支払い\n`;
    } else if (pc.returnCost > 0) {
      const returnDriver = returnVehicles.map(v => {
        const driverSeatKey = getDriverSeatKey(v);
        const driverSeat = v.seats[driverSeatKey];
        const hasParticipant = Object.values(v.seats).some(seat => seat?.name === pc.name);
        return hasParticipant ? driverSeat?.name : null;
      }).find(name => name);

      text += `${pc.name}: 帰りのみ${pc.returnCost}円を${returnDriver}に支払い\n`;
    }
  });

  text += '\n【運転手間の差額調整(往復トータル)】\n';
  if (result.driverAdjustments.length === 0) {
    text += '調整不要\n';
  } else {
    result.driverAdjustments.forEach(adj => {
      text += `${adj.from}は${adj.amount}円を${adj.to}に渡す\n`;
    });
  }

  text += '\n【運転手の最終収支】\n';
  result.driverFinalBalances.forEach(balance => {
    const sign = balance.finalBalance >= 0 ? '+' : '';
    text += `${balance.driverName}: 車両費用合計${balance.totalVehicleCost}円(行き${balance.outboundCost}円+帰り${balance.returnCost}円) - 徴収${balance.collectedAmount}円 = ${sign}${balance.finalBalance}円\n`;
  });

  return text;
}

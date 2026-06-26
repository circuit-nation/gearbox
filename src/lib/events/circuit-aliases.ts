const ALIASES: Record<string, string> = {
  "Suzuka Circuit": "Suzuka International Racing Course",
  "Losail International Circuit": "Lusail International Circuit",
  "Circuito de Jerez": "Circuito de Jerez-Ángel Nieto",
  "Circuit Ricardo Tormo, Cheste": "Circuit Ricardo Tormo",
  "Phillip Island Circuit": "Phillip Island Grand Prix Circuit",
  "Mandalika Circuit": "Pertamina Mandalika International Street Circuit",
  "Balaton Park": "Balaton Park Circuit",
};

export function resolveCircuitName(name: string): string {
  return ALIASES[name.trim()] ?? name.trim();
}

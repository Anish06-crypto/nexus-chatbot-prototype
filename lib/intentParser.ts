export type ParsedResponse = {
  text: string;
  intent: string;
  issue_type: string | null;
  location: string | null;
  urgency: string | null;
  description: string | null;
};

const VALID_INTENTS = ['REPAIR_REQUEST', 'RENT_QUERY', 'MAINTENANCE_STATUS', 'GENERAL'];
const VALID_URGENCIES = ['CRITICAL', 'EMERGENCY', 'URGENT', 'ROUTINE'];

function mapUrgencyFallback(value: string | null): string {
  if (!value) return 'ROUTINE';
  const upper = value.toUpperCase();
  if (upper.includes('CRITICAL')) return 'CRITICAL';
  if (upper.includes('EMERGENCY')) return 'EMERGENCY';
  if (upper.includes('URGENT')) return 'URGENT';
  return 'ROUTINE';
}

export function parseIntent(raw: string): ParsedResponse | null {
  const jsonStart = raw.lastIndexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  let parsed: Record<string, unknown> | null = null;
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try {
      parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch {
      parsed = null;
    }
  }

  if (parsed === null) return null;

  const text = raw.slice(0, jsonStart).trim();

  // Validate intent — reject entirely if unrecognised
  const intent = (parsed?.intent as string) ?? 'GENERAL';
  if (!VALID_INTENTS.includes(intent)) return null;

  // Validate urgency — map near-misses to valid values, never reject
  const rawUrgency = (parsed?.urgency as string | null) ?? null;
  const urgency = rawUrgency === null
    ? null
    : VALID_URGENCIES.includes(rawUrgency)
      ? rawUrgency
      : mapUrgencyFallback(rawUrgency);

  return {
    text,
    intent,
    issue_type: (parsed?.issue_type as string | null) ?? null,
    location: (parsed?.location as string | null) ?? null,
    urgency,
    description: (parsed?.description as string | null) ?? null,
  };
}
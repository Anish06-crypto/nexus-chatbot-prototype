export type ParsedResponse = {
  text: string;
  intent: string;
  issue_type: string | null;
  location: string | null;
  urgency: string | null;
  description: string | null;
};

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

  return {
    text,
    intent: (parsed?.intent as string) ?? "GENERAL",
    issue_type: (parsed?.issue_type as string | null) ?? null,
    location: (parsed?.location as string | null) ?? null,
    urgency: (parsed?.urgency as string | null) ?? null,
    description: (parsed?.description as string | null) ?? null,
  };
}

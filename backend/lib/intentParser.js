const VALID_INTENTS = ['REPAIR_REQUEST', 'RENT_QUERY', 'MAINTENANCE_STATUS', 'GENERAL'];
const VALID_URGENCIES = ['CRITICAL', 'EMERGENCY', 'URGENT', 'ROUTINE'];

function mapUrgencyFallback(value) {
    if (!value) return 'ROUTINE';
    const upper = value.toUpperCase();
    if (upper.includes('CRITICAL')) return 'CRITICAL';
    if (upper.includes('EMERGENCY')) return 'EMERGENCY';
    if (upper.includes('URGENT')) return 'URGENT';
    return 'ROUTINE';
}

function parseIntent(raw) {
    const jsonStart = raw.lastIndexOf('{');
    const jsonEnd = raw.lastIndexOf('}');

    let parsed = null;
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
            parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
        } catch {
            parsed = null;
        }
    }

    if (parsed === null) return null;

    const text = raw.slice(0, jsonStart).trim();

    const intent = parsed.intent ?? 'GENERAL';
    if (!VALID_INTENTS.includes(intent)) return null;

    const rawUrgency = parsed.urgency ?? null;
    const urgency = rawUrgency === null
        ? null
        : VALID_URGENCIES.includes(rawUrgency)
            ? rawUrgency
            : mapUrgencyFallback(rawUrgency);

    return {
        text,
        intent,
        issue_type: parsed.issue_type ?? null,
        location: parsed.location ?? null,
        urgency,
        description: parsed.description ?? null,
    };
}

module.exports = { parseIntent };

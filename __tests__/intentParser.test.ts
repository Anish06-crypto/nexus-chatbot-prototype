import { parseIntent } from '../lib/intentParser';

describe('intentParser', () => {

    test('extracts a valid REPAIR_REQUEST intent', () => {
        const raw = `I can help with that. Your boiler issue has been noted.
{
  "intent": "REPAIR_REQUEST",
  "issue_type": "Boiler",
  "location": "Kitchen",
  "urgency": "URGENT",
  "description": "Boiler not producing hot water"
}`;

        const result = parseIntent(raw);
        expect(result).not.toBeNull();
        expect(result!.intent).toBe('REPAIR_REQUEST');
        expect(result!.issue_type).toBe('Boiler');
        expect(result!.location).toBe('Kitchen');
        expect(result!.urgency).toBe('URGENT');
        expect(result!.description).toBe('Boiler not producing hot water');
    });

    test('extracts the text portion without the JSON block', () => {
        const raw = `I can help with that. Your boiler issue has been noted.
{"intent":"REPAIR_REQUEST","issue_type":"Boiler","location":"Kitchen","urgency":"URGENT","description":"test"}`;

        const result = parseIntent(raw);
        expect(result!.text).toBe(
            "I can help with that. Your boiler issue has been noted."
        );
    });

    test('returns null for malformed JSON', () => {
        const raw = `Here is my response. { "intent": "REPAIR_REQUEST", bad json }`;
        const result = parseIntent(raw);
        expect(result).toBeNull();
    });

    test('returns null when no JSON block is present', () => {
        const raw = `I can help you with your query. Please call 0800 849 1400.`;
        const result = parseIntent(raw);
        expect(result).toBeNull();
    });

    test('handles GENERAL intent with null fields', () => {
        const raw = `Our office is open Monday to Thursday 9am-5pm.
{
  "intent": "GENERAL",
  "issue_type": null,
  "location": null,
  "urgency": null,
  "description": null
}`;

        const result = parseIntent(raw);
        expect(result!.intent).toBe('GENERAL');
        expect(result!.issue_type).toBeNull();
        expect(result!.urgency).toBeNull();
    });

    test('handles RENT_QUERY intent', () => {
        const raw = `Your rent is due on the first of each month.
{"intent":"RENT_QUERY","issue_type":null,"location":null,"urgency":null,"description":null}`;

        const result = parseIntent(raw);
        expect(result!.intent).toBe('RENT_QUERY');
    });

    test('handles JSON with extra whitespace', () => {
        const raw = `Response text here.

{
  "intent":  "REPAIR_REQUEST" ,
  "issue_type":   "Leak",
  "location": "Bathroom",
  "urgency":  "EMERGENCY",
  "description": "Water dripping from ceiling"
}`;

        const result = parseIntent(raw);
        expect(result).not.toBeNull();
        expect(result!.urgency).toBe('EMERGENCY');
    });

    test('handles multilingual text with English JSON block', () => {
        const raw = `آپ کی مدد کے لیے حاضر ہوں۔
{"intent":"REPAIR_REQUEST","issue_type":"Boiler","location":"Kitchen","urgency":"URGENT","description":"Boiler not working"}`;

        const result = parseIntent(raw);
        expect(result).not.toBeNull();
        expect(result!.intent).toBe('REPAIR_REQUEST');
        expect(result!.issue_type).toBe('Boiler');
    });

    test('handles empty string input', () => {
        const result = parseIntent('');
        expect(result).toBeNull();
    });

    test('handles JSON block with no preceding text', () => {
        const raw = `{"intent":"GENERAL","issue_type":null,"location":null,"urgency":null,"description":null}`;
        const result = parseIntent(raw);
        expect(result).not.toBeNull();
        expect(result!.text).toBe('');
    });

});

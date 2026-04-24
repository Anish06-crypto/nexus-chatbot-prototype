import { parseIntent } from "../intentParser";

const REPAIR_RESPONSE = `I can see your boiler isn't producing hot water. This is classified as an urgent repair under Nehemiah's schedule, with a 5 working day response time. I'll help you log this repair now.

{
  "intent": "REPAIR_REQUEST",
  "issue_type": "Boiler",
  "location": "Kitchen",
  "urgency": "URGENT",
  "description": "Boiler not producing hot water"
}`;

const GENERAL_RESPONSE = `Rent payments are due on the first of each month. You can pay online via the tenant portal or by Direct Debit.

{
  "intent": "RENT_QUERY",
  "issue_type": null,
  "location": null,
  "urgency": null,
  "description": null
}`;

const MALFORMED_RESPONSE = `Here is some text without any JSON block at all.`;

describe("parseIntent", () => {
  it("extracts text and repair intent from a REPAIR_REQUEST response", () => {
    const result = parseIntent(REPAIR_RESPONSE);
    expect(result.intent).toBe("REPAIR_REQUEST");
    expect(result.issue_type).toBe("Boiler");
    expect(result.location).toBe("Kitchen");
    expect(result.urgency).toBe("URGENT");
    expect(result.description).toBe("Boiler not producing hot water");
    expect(result.text).toContain("I can see your boiler");
    expect(result.text).not.toContain('"intent"');
  });

  it("extracts text and nulls from a non-repair response", () => {
    const result = parseIntent(GENERAL_RESPONSE);
    expect(result.intent).toBe("RENT_QUERY");
    expect(result.issue_type).toBeNull();
    expect(result.urgency).toBeNull();
    expect(result.text).toContain("Rent payments");
  });

  it("falls back to GENERAL intent when JSON is missing", () => {
    const result = parseIntent(MALFORMED_RESPONSE);
    expect(result.intent).toBe("GENERAL");
    expect(result.issue_type).toBeNull();
    expect(result.text).toBe(MALFORMED_RESPONSE);
  });
});

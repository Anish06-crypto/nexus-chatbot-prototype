const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type Repair = {
  _id: string;
  reference: string;
  issue_type: string;
  location: string;
  urgency: "CRITICAL" | "EMERGENCY" | "URGENT" | "ROUTINE";
  description: string;
  photo_uri: string | null;
  status: "Submitted" | "Assigned" | "In Progress" | "Completed";
  created_at: string;
};

export type CreateRepairPayload = {
  issue_type: string;
  location: string;
  urgency: string;
  description: string;
  photo_uri?: string | null;
};

export async function createRepair(
  payload: CreateRepairPayload
): Promise<Repair> {
  const response = await fetch(`${API_URL}/api/repairs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Failed to create repair"
    );
  }
  return response.json() as Promise<Repair>;
}

export async function fetchRepairs(): Promise<Repair[]> {
  const response = await fetch(`${API_URL}/api/repairs`);
  if (!response.ok) throw new Error("Failed to fetch repairs");
  return response.json() as Promise<Repair[]>;
}

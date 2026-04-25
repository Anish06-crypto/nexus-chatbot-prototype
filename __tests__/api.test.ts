import { submitRepair, fetchRepairs, sendChatMessage } from '../lib/api';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3001';
});

describe('api — submitRepair', () => {

    test('sends POST request with correct payload', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                _id: '123',
                reference: 'NEX-2026-1234',
                status: 'Submitted',
            }),
        } as Response);

        const payload = {
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
            description: 'No hot water',
        };

        const result = await submitRepair(payload);

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/repairs',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(payload),
            })
        );
        expect(result.reference).toBe('NEX-2026-1234');
    });

    test('throws when response is not ok', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Validation failed' }),
        } as Response);

        await expect(
            submitRepair({
                issue_type: 'Boiler',
                location: 'Kitchen',
                urgency: 'INVALID',
                description: '',
            })
        ).rejects.toThrow();
    });

    test('throws on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

        await expect(
            submitRepair({
                issue_type: 'Boiler',
                location: 'Kitchen',
                urgency: 'URGENT',
                description: '',
            })
        ).rejects.toThrow('Network request failed');
    });

});

describe('api — sendChatMessage', () => {

    test('sends message and history to /api/chat', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                text: 'Your boiler issue is urgent.',
                intent: {
                    intent: 'REPAIR_REQUEST',
                    issue_type: 'Boiler',
                    location: 'Kitchen',
                    urgency: 'URGENT',
                    description: 'Boiler not working'
                },
                detectedLanguage: 'EN'
            })
        } as Response);

        const result = await sendChatMessage('My boiler is broken', []);
        expect(result.text).toBe('Your boiler issue is urgent.');
        expect(result.intent?.urgency).toBe('URGENT');
    });

    test('throws on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        } as Response);

        await expect(
            sendChatMessage('My boiler is broken', [])
        ).rejects.toThrow('Chat request failed');
    });

});

describe('api — fetchRepairs', () => {

    test('returns repairs array on success', async () => {
        const mockRepairs = [
            {
                _id: '1',
                reference: 'NEX-2026-0001',
                issue_type: 'Boiler',
                urgency: 'URGENT',
                status: 'Submitted',
            },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRepairs,
        } as Response);

        const result = await fetchRepairs();
        expect(result).toHaveLength(1);
        expect(result[0].reference).toBe('NEX-2026-0001');
    });

    test('throws when response is not ok', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
        } as Response);

        await expect(fetchRepairs()).rejects.toThrow();
    });

});

const Repair = require('../models/Repair');
require('./setup');

describe('Repair Model — Schema Validation', () => {

    test('creates a valid repair document', async () => {
        const repair = new Repair({
            reference: 'NEX-2026-1001',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
            description: 'No hot water',
        });
        const saved = await repair.save();
        expect(saved._id).toBeDefined();
        expect(saved.status).toBe('Submitted');
        expect(saved.created_at).toBeDefined();
    });

    test('rejects an invalid urgency value', async () => {
        const repair = new Repair({
            reference: 'NEX-2026-1002',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'VERY_URGENT',
        });
        await expect(repair.save()).rejects.toThrow(/urgency/);
    });

    test('rejects an invalid status value', async () => {
        const repair = new Repair({
            reference: 'NEX-2026-1003',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'ROUTINE',
            status: 'Pending',
        });
        await expect(repair.save()).rejects.toThrow(/status/);
    });

    test('requires issue_type', async () => {
        const repair = new Repair({
            reference: 'NEX-2026-1004',
            location: 'Kitchen',
            urgency: 'URGENT',
        });
        await expect(repair.save()).rejects.toThrow(/issue_type/);
    });

    test('requires location', async () => {
        const repair = new Repair({
            reference: 'NEX-2026-1005',
            issue_type: 'Boiler',
            urgency: 'URGENT',
        });
        await expect(repair.save()).rejects.toThrow(/location/);
    });

    test('requires urgency', async () => {
        const repair = new Repair({
            reference: 'NEX-2026-1006',
            issue_type: 'Boiler',
            location: 'Kitchen',
        });
        await expect(repair.save()).rejects.toThrow(/urgency/);
    });

    test('enforces unique reference numbers', async () => {
        await new Repair({
            reference: 'NEX-2026-1007',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
        }).save();

        const duplicate = new Repair({
            reference: 'NEX-2026-1007',
            issue_type: 'Leak',
            location: 'Bathroom',
            urgency: 'EMERGENCY',
        });
        await expect(duplicate.save()).rejects.toThrow();
    });

    test('defaults status to Submitted', async () => {
        const repair = await new Repair({
            reference: 'NEX-2026-1008',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
        }).save();
        expect(repair.status).toBe('Submitted');
    });

    test('accepts all four valid urgency values', async () => {
        const urgencies = ['CRITICAL', 'EMERGENCY', 'URGENT', 'ROUTINE'];
        for (const [i, urgency] of urgencies.entries()) {
            const repair = await new Repair({
                reference: `NEX-2026-200${i}`,
                issue_type: 'Test',
                location: 'Test',
                urgency,
            }).save();
            expect(repair.urgency).toBe(urgency);
        }
    });

    test('accepts all four valid status values', async () => {
        const statuses = ['Submitted', 'Assigned', 'In Progress', 'Completed'];
        for (const [i, status] of statuses.entries()) {
            const repair = await new Repair({
                reference: `NEX-2026-300${i}`,
                issue_type: 'Test',
                location: 'Test',
                urgency: 'ROUTINE',
                status,
            }).save();
            expect(repair.status).toBe(status);
        }
    });

});

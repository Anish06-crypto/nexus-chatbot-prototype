const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const repairRoutes = require('../routes/repairs');
const Repair = require('../models/Repair');

let mongod;
let app;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/repairs', repairRoutes);
});

afterEach(async () => {
    await Repair.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

describe('POST /api/repairs', () => {

    test('creates a repair and returns 201 with reference number', async () => {
        const res = await request(app)
            .post('/api/repairs')
            .send({
                issue_type: 'Boiler',
                location: 'Kitchen',
                urgency: 'URGENT',
                description: 'No hot water',
            });

        expect(res.status).toBe(201);
        expect(res.body.reference).toMatch(/^NEX-\d{4}-\d{4}$/);
        expect(res.body.status).toBe('Submitted');
        expect(res.body.issue_type).toBe('Boiler');
        expect(res.body.urgency).toBe('URGENT');
    });

    test('returns 400 for invalid urgency value', async () => {
        const res = await request(app)
            .post('/api/repairs')
            .send({
                issue_type: 'Boiler',
                location: 'Kitchen',
                urgency: 'SUPER_URGENT',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test('returns 400 when issue_type is missing', async () => {
        const res = await request(app)
            .post('/api/repairs')
            .send({
                location: 'Kitchen',
                urgency: 'URGENT',
            });

        expect(res.status).toBe(400);
    });

    test('returns 400 when location is missing', async () => {
        const res = await request(app)
            .post('/api/repairs')
            .send({
                issue_type: 'Boiler',
                urgency: 'URGENT',
            });

        expect(res.status).toBe(400);
    });

    test('returns 400 when urgency is missing', async () => {
        const res = await request(app)
            .post('/api/repairs')
            .send({
                issue_type: 'Boiler',
                location: 'Kitchen',
            });

        expect(res.status).toBe(400);
    });

    test('generates unique reference numbers for concurrent submissions', async () => {
        const submissions = Array.from({ length: 5 }, (_, i) =>
            request(app)
                .post('/api/repairs')
                .send({
                    issue_type: `Issue ${i}`,
                    location: 'Kitchen',
                    urgency: 'ROUTINE',
                })
        );

        const results = await Promise.all(submissions);
        const references = results.map((r) => r.body.reference);
        const unique = new Set(references);
        expect(unique.size).toBe(5);
    });

});

describe('GET /api/repairs', () => {

    test('returns empty array when no repairs exist', async () => {
        const res = await request(app).get('/api/repairs');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('returns all repairs sorted newest first', async () => {
        await Repair.create({
            reference: 'NEX-2026-0001',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
            created_at: new Date('2026-04-01'),
        });
        await Repair.create({
            reference: 'NEX-2026-0002',
            issue_type: 'Leak',
            location: 'Bathroom',
            urgency: 'EMERGENCY',
            created_at: new Date('2026-04-23'),
        });

        const res = await request(app).get('/api/repairs');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].reference).toBe('NEX-2026-0002');
        expect(res.body[1].reference).toBe('NEX-2026-0001');
    });

    test('returns required fields on each repair', async () => {
        await Repair.create({
            reference: 'NEX-2026-0003',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
        });

        const res = await request(app).get('/api/repairs');
        const repair = res.body[0];

        expect(repair.reference).toBeDefined();
        expect(repair.issue_type).toBeDefined();
        expect(repair.location).toBeDefined();
        expect(repair.urgency).toBeDefined();
        expect(repair.status).toBeDefined();
        expect(repair.created_at).toBeDefined();
    });

});

describe('PATCH /api/repairs/:id', () => {

    test('updates repair status successfully', async () => {
        const repair = await Repair.create({
            reference: 'NEX-2026-0004',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
        });

        const res = await request(app)
            .patch(`/api/repairs/${repair._id}`)
            .send({ status: 'In Progress' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('In Progress');
    });

    test('returns 400 for invalid status value', async () => {
        const repair = await Repair.create({
            reference: 'NEX-2026-0005',
            issue_type: 'Boiler',
            location: 'Kitchen',
            urgency: 'URGENT',
        });

        const res = await request(app)
            .patch(`/api/repairs/${repair._id}`)
            .send({ status: 'Pending' });

        expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent repair id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .patch(`/api/repairs/${fakeId}`)
            .send({ status: 'Completed' });

        expect(res.status).toBe(404);
    });

    test('accepts all valid status transitions', async () => {
        const statuses = ['Assigned', 'In Progress', 'Completed'];

        for (const status of statuses) {
            const repair = await Repair.create({
                reference: `NEX-2026-${Math.floor(Math.random() * 9000) + 1000}`,
                issue_type: 'Test',
                location: 'Test',
                urgency: 'ROUTINE',
            });

            const res = await request(app)
                .patch(`/api/repairs/${repair._id}`)
                .send({ status });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(status);
        }
    });

});

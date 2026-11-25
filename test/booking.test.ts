import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { startServer, stopServer } from '../src/server.ts';
import prisma from '../src/prisma.ts';

const BASE_URL = 'http://localhost:8000';

const GUEST_A_UNIT_1 = {
    unitID: '1',
    guestName: 'GuestA',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const GUEST_A_UNIT_2 = {
    unitID: '2',
    guestName: 'GuestA',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const GUEST_B_UNIT_1 = {
    unitID: '1',
    guestName: 'GuestB',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

async function postBooking(data: object) {
    return fetch(`${BASE_URL}/api/v1/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

beforeAll(async () => {
    await startServer();
});

afterAll(async () => {
    await prisma.$disconnect();
    await stopServer();
});

beforeEach(async () => {
    await prisma.booking.deleteMany();
});

describe('Booking API', () => {
    it('Create fresh booking', async () => {
        const response = await postBooking(GUEST_A_UNIT_1);
        expect(response.status).toBe(200);
        const data = await response.json() as Record<string, unknown>;
        expect(data.guestName).toBe(GUEST_A_UNIT_1.guestName);
        expect(data.unitID).toBe(GUEST_A_UNIT_1.unitID);
        expect(data.numberOfNights).toBe(GUEST_A_UNIT_1.numberOfNights);
    });

    it('Same guest same unit booking', async () => {
        let response = await postBooking(GUEST_A_UNIT_1);
        expect(response.status).toBe(200);

        response = await postBooking(GUEST_A_UNIT_1);
        expect(response.status).toBe(400);
        const message = await response.json();
        expect(message).toBe('The given guest name cannot book the same unit multiple times');
    });

    it('Same guest different unit booking', async () => {
        let response = await postBooking(GUEST_A_UNIT_1);
        expect(response.status).toBe(200);

        response = await postBooking(GUEST_A_UNIT_2);
        expect(response.status).toBe(400);
        const message = await response.json();
        expect(message).toBe('The same guest cannot be in multiple units at the same time');
    });

    it('Different guest same unit booking', async () => {
        let response = await postBooking(GUEST_A_UNIT_1);
        expect(response.status).toBe(200);

        response = await postBooking(GUEST_B_UNIT_1);
        expect(response.status).toBe(400);
        const message = await response.json();
        expect(message).toBe('For the given check-in date, the unit is already occupied');
    });

    it('Different guest same unit booking different date', async () => {
        const response1 = await postBooking(GUEST_A_UNIT_1);
        expect(response1.status).toBe(200);

        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const response2 = await postBooking({
            unitID: '1',
            guestName: 'GuestB',
            checkInDate: tomorrow,
            numberOfNights: 5,
        });
        expect(response2.status).toBe(400);
        const message = await response2.json();
        expect(message).toBe('For the given check-in date, the unit is already occupied');
    });
});

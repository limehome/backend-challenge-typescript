import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma.js';

interface Booking {
    guestName: string;
    unitID: string;
    checkInDate: Date;
    numberOfNights: number;
}

const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: "OK"
    })
}

const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    const booking: Booking = req.body;

    const outcome = await isBookingPossible(booking);
    if (!outcome.result) {
        return res.status(400).json(outcome.reason);
    }

    const bookingResult = await prisma.booking.create({
        data: {
            guestName: booking.guestName,
            unitID: booking.unitID,
            checkInDate: new Date(booking.checkInDate),
            numberOfNights: booking.numberOfNights,
        }
    });

    return res.status(200).json(bookingResult);
}

type bookingOutcome = { result: boolean; reason: string };

async function isBookingPossible(booking: Booking): Promise<bookingOutcome> {
    // check 1 : The same guest cannot book the same unit multiple times
    const sameGuestSameUnit = await prisma.booking.findFirst({
        where: {
            guestName: booking.guestName,
            unitID: booking.unitID,
        },
    });
    if (sameGuestSameUnit) {
        return { result: false, reason: "The given guest name cannot book the same unit multiple times" };
    }

    // check 2 : the same guest cannot be in multiple units at the same time
    const sameGuestAlreadyBooked = await prisma.booking.findFirst({
        where: { guestName: booking.guestName },
    });
    if (sameGuestAlreadyBooked) {
        return { result: false, reason: "The same guest cannot be in multiple units at the same time" };
    }

    // check 3 : Unit is available for the check-in date
    const unitOccupiedOnDate = await prisma.booking.findFirst({
        where: {
            unitID: booking.unitID,
            checkInDate: new Date(booking.checkInDate),
        },
    });
    if (unitOccupiedOnDate) {
        return { result: false, reason: "For the given check-in date, the unit is already occupied" };
    }

    return { result: true, reason: "OK" };
}

export default { healthCheck, createBooking }

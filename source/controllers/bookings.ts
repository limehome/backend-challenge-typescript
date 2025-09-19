import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma'

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

const estimateCheckOutDate = (
  checkInDate: Date,
  numberOfNights: number
): Date => {
  return new Date(checkInDate.getTime() + numberOfNights * 24 * 60 * 60 * 1000);
};


const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    const booking: Booking = req.body;

    let outcome = await isBookingPossible(booking);
    if (!outcome.result) {
        return res.status(400).json(outcome.reason);
    }

    const checkInDate = new Date(booking.checkInDate);
    const checkOutDate = estimateCheckOutDate(
      checkInDate,
      booking.numberOfNights
    );

    let bookingResult = await prisma.booking.create({
        data: {
             guestName: booking.guestName,
             unitID: booking.unitID,
             checkInDate,
             checkOutDate,
             numberOfNights: booking.numberOfNights
       }
    })

    return res.status(200).json(bookingResult);
}

type bookingOutcome = {result:boolean, reason:string};

async function isBookingPossible(booking: Booking): Promise<bookingOutcome> {
    // check 1 : The Same guest cannot book the same unit multiple times
    let sameGuestSameUnit = await prisma.booking.findMany({
        where: {
            AND: {
                guestName: {
                    equals: booking.guestName,
                },
                unitID: {
                    equals: booking.unitID,
                },
            },
        },
    });
    if (sameGuestSameUnit.length > 0) {
        return {result: false, reason: "The given guest name cannot book the same unit multiple times"};
    }

    // check 2 : the same guest cannot be in multiple units at the same time
    let sameGuestAlreadyBooked = await prisma.booking.findMany({
        where: {
            guestName: {
                equals: booking.guestName,
            },
        },
    });
    if (sameGuestAlreadyBooked.length > 0) {
        return {result: false, reason: "The same guest cannot be in multiple units at the same time"};
    }

    const checkInDate = new Date(booking.checkInDate);

    // check 3 : Unit is available for the check-in date
    let isUnitAvailableOnCheckInDate = await prisma.booking.findMany({
        where: {
            AND: {
                checkOutDate: {
                  gt: checkInDate,
                },
                unitID: {
                    equals: booking.unitID,
                }
            }
        }
    });
    if (isUnitAvailableOnCheckInDate.length > 0) {
        return {result: false, reason: "For the given check-in date, the unit is already occupied"};
    }

    return {result: true, reason: "OK"};
}

type BookingUpdate = Pick<Booking, "numberOfNights">;

const updateBooking = async (req: Request, res: Response) => {
  const bookingId = parseInt(req.params.bookingId);
  const update: BookingUpdate = req.body;

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
    },
  });

  if (!booking) {
    return res.status(404).json("Booking not found");
  }

  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = estimateCheckOutDate(
    checkInDate,
    booking.numberOfNights + update.numberOfNights
  );

  const outcome = await isBookingExtensionPossible(booking, checkOutDate);
  if (!outcome.result) {
    return res.status(400).json(outcome.reason);
  }

  const updatedBooking = await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      ...booking,
      checkOutDate,
    },
  });

  return res.status(200).json(updatedBooking);
};

const isBookingExtensionPossible = async (
  booking: Booking,
  checkOutDate: Date
): Promise<bookingOutcome> => {
  const conflicts = await prisma.booking.findMany({
    where: {
      AND: {
        checkInDate: {
          lt: checkOutDate,
        },
        unitID: {
          equals: booking.unitID,
        },
        guestName: {
          not: booking.guestName,
        },
      },
    },
  });
  if (conflicts.length > 0) {
    return {
      result: false,
      reason:
        "For the given booking extension, the unit will be already occupied",
    };
  }

  return { result: true, reason: "OK" };
};

export default { healthCheck, createBooking, updateBooking }

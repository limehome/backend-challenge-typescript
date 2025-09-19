PRAGMA defer_foreign_keys = ON;

PRAGMA foreign_keys = OFF;

CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestName" TEXT NOT NULL,
    "unitID" TEXT NOT NULL,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "numberOfNights" INTEGER NOT NULL
);

INSERT INTO
    "new_Booking" (
        "checkInDate",
        "guestName",
        "id",
        "numberOfNights",
        "unitID",
        "checkOutDate"
    )
SELECT
    "checkInDate",
    "guestName",
    "id",
    "numberOfNights",
    "unitID",
    "checkInDate" + (
        "numberOfNights" * 24 * 60 * 60 * 1000
    ) as "checkOutDate"
FROM "Booking";

DROP TABLE "Booking";

ALTER TABLE "new_Booking" RENAME TO "Booking";

PRAGMA foreign_keys = ON;

PRAGMA defer_foreign_keys = OFF;
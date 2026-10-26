
const Counter = require("../models/Counter");

const generateInvoiceNumber = async (year = new Date().getFullYear()) => {
    const counter = await Counter.findByIdAndUpdate(
        `invoice-${year}`,
        {
            $inc: { sequence: 1 },
        },
        {
            returnDocument: "after",
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    const sequence = String(counter.sequence).padStart(4, "0");

    return `INV-${year}-${sequence}`;
};

module.exports = generateInvoiceNumber;

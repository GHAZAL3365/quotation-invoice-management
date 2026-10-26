const Client = require("../models/Client");

const createClient = async (clientData) => {
    const {
        clientName,
        email,
        phone,
        billingAddress,
        taxId,
        notes,
    } = clientData;

    const client = await Client.create({
        clientName,
        email,
        phone,
        billingAddress,
        taxId,
        notes,
    });

    return client;
};


const getClients = async ({
    page = 1,
    limit = 10,
    search,
    isActive,
    user
}) => {
    const filter = {
        isDeleted: { $ne: true },
    };

    page = Number(page);
    limit = Number(limit);

   

    if (search) {
        filter.$or = [
            { clientName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    if (isActive !== undefined) {
        filter.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
        Client.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Client.countDocuments(filter),
    ]);

    return {
        clients,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};



const getClientById = async (clientId) => {
    const client = await Client.findOne({
        _id: clientId,
        isDeleted: { $ne: true },
    }).lean();

    if (!client) {
        const error = new Error("Client not found");
        error.statusCode = 404;
        throw error;
    }

    return client;
};



const updateClient = async (clientId, clientData) => {
    const { clientName, email, phone, billingAddress, taxId, notes } =
        clientData;

    const client = await Client.findByIdAndUpdate(
        clientId,
        {
            clientName,
            email,
            phone,
            billingAddress,
            taxId,
            notes,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!client) {
        const error = new Error("Client not found");
        error.statusCode = 404;
        throw error;
    }

    return client;
};


const deleteClient = async (clientId) => {
    const client = await Client.findOneAndUpdate(
        {
            _id: clientId,
            isDeleted: { $ne: true },
        },
        {
            $set: { isDeleted: true },
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!client) {
        const error = new Error("Client not found");
        error.statusCode = 404;
        throw error;
    }

    return client;
};



module.exports = {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
};



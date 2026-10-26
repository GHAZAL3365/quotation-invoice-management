const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Initial Seed Data
const adminPasswordHash = bcrypt.hashSync("admin123", 10);
const clientPasswordHash = bcrypt.hashSync("client123", 10);

const adminId = new mongoose.Types.ObjectId().toString();
const clientId = new mongoose.Types.ObjectId().toString();
const sampleClientId = new mongoose.Types.ObjectId().toString();
const sampleClientId2 = new mongoose.Types.ObjectId().toString();

const store = {
  users: [
    {
      _id: adminId,
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: clientId,
      name: "Demo Client",
      email: "client@example.com",
      passwordHash: clientPasswordHash,
      role: "client",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  clients: [
    {
      _id: sampleClientId,
      clientName: "Acme Corporation",
      email: "client@example.com",
      phone: "+1 (555) 234-5678",
      billingAddress: "100 Tech Boulevard, Suite 400, San Francisco, CA 94107",
      taxId: "US-87654321",
      notes: "Preferred enterprise customer",
      isActive: true,
      isDeleted: false,
      createdAt: new Date(Date.now() - 7 * 86400000),
      updatedAt: new Date(Date.now() - 7 * 86400000),
    },
    {
      _id: sampleClientId2,
      clientName: "Nexus Technologies",
      email: "accounts@nexustech.io",
      phone: "+1 (555) 987-6543",
      billingAddress: "450 Innovation Way, Austin, TX 78701",
      taxId: "TX-12345678",
      notes: "Net 30 payment terms",
      isActive: true,
      isDeleted: false,
      createdAt: new Date(Date.now() - 3 * 86400000),
      updatedAt: new Date(Date.now() - 3 * 86400000),
    },
  ],
  quotations: [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      quotationNumber: "QT-2026-0001",
      clientId: sampleClientId,
      quotationDate: new Date(Date.now() - 5 * 86400000),
      validUntil: new Date(Date.now() + 25 * 86400000),
      status: "Sent",
      items: [
        {
          description: "Cloud Architecture Consultation & Setup",
          quantity: 20,
          rate: 150,
          amount: 3000,
        },
        {
          description: "API Integration & Migration Services",
          quantity: 40,
          rate: 120,
          amount: 4800,
        },
      ],
      subtotal: 7800,
      discount: 300,
      taxRate: 10,
      taxAmount: 750,
      total: 8250,
      notes: "Payment due within 30 days of quotation acceptance.",
      isDeleted: false,
      createdAt: new Date(Date.now() - 5 * 86400000),
      updatedAt: new Date(Date.now() - 5 * 86400000),
    },
  ],
  invoices: [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      invoiceNumber: "INV-2026-0001",
      clientId: sampleClientId,
      invoiceDate: new Date(Date.now() - 2 * 86400000),
      dueDate: new Date(Date.now() + 28 * 86400000),
      status: "Unpaid",
      items: [
        {
          description: "Enterprise System Implementation - Milestone 1",
          quantity: 1,
          rate: 5000,
          amount: 5000,
        },
      ],
      subtotal: 5000,
      discount: 0,
      taxRate: 10,
      taxAmount: 500,
      total: 5500,
      paidAmount: 0,
      notes: "Thank you for your business. Please remit payment via bank transfer.",
      isDeleted: false,
      createdAt: new Date(Date.now() - 2 * 86400000),
      updatedAt: new Date(Date.now() - 2 * 86400000),
    },
  ],
  payments: [],
  counters: {
    invoice: 1,
    quotation: 1,
  },
};

function matchesQuery(item, query = {}) {
  for (const [key, val] of Object.entries(query)) {
    if (key === "$or" && Array.isArray(val)) {
      const matchAny = val.some((subQuery) => matchesQuery(item, subQuery));
      if (!matchAny) return false;
      continue;
    }
    const itemVal = item[key];
    if (val && typeof val === "object" && !(val instanceof RegExp)) {
      if ("$ne" in val && itemVal === val.$ne) return false;
      if ("$regex" in val) {
        const regex = new RegExp(val.$regex, val.$options || "");
        if (!regex.test(String(itemVal || ""))) return false;
        continue;
      }
      if ("$in" in val && Array.isArray(val.$in)) {
        if (!val.$in.map(String).includes(String(itemVal))) return false;
        continue;
      }
    } else if (val instanceof RegExp) {
      if (!val.test(String(itemVal || ""))) return false;
    } else if (val !== undefined) {
      if (String(itemVal) !== String(val)) return false;
    }
  }
  return true;
}

function cloneDoc(doc, selectFields) {
  if (!doc) return null;
  const copy = { ...doc };
  if (copy._id && typeof copy._id.toString === "function") {
    copy._id = copy._id.toString();
  }
  if (!selectFields || !selectFields.includes("+passwordHash")) {
    if (!selectFields?.includes("passwordHash")) {
      delete copy.passwordHash;
    }
  }
  return copy;
}

function populateDoc(doc, collectionName) {
  if (!doc) return doc;
  const copy = { ...doc };
  if ((collectionName === "quotations" || collectionName === "invoices") && copy.clientId) {
    const client = store.clients.find((c) => String(c._id) === String(copy.clientId));
    if (client) {
      copy.clientId = cloneDoc(client);
    }
  }
  return copy;
}

function createQuery(collectionName, items, filter = {}) {
  let filtered = items.filter((item) => matchesQuery(item, filter));
  let selectFields = "";
  let shouldPopulate = false;
  let skipCount = 0;
  let limitCount = Infinity;

  const queryObj = {
    sort(sortObj) {
      return queryObj;
    },
    skip(n) {
      skipCount = Number(n) || 0;
      return queryObj;
    },
    limit(n) {
      limitCount = Number(n) || Infinity;
      return queryObj;
    },
    select(fields) {
      selectFields = fields;
      return queryObj;
    },
    populate(path) {
      shouldPopulate = true;
      return queryObj;
    },
    lean() {
      return queryObj;
    },
    then(resolve, reject) {
      try {
        let result = filtered.slice(skipCount, skipCount + limitCount);
        result = result.map((item) => {
          let doc = cloneDoc(item, selectFields);
          if (shouldPopulate) doc = populateDoc(doc, collectionName);
          return doc;
        });
        return Promise.resolve(result).then(resolve, reject);
      } catch (err) {
        return Promise.reject(err).then(resolve, reject);
      }
    },
  };
  return queryObj;
}

function createSingleQuery(collectionName, items, filter = {}) {
  let selectFields = "";
  let shouldPopulate = false;

  const queryObj = {
    select(fields) {
      selectFields = fields;
      return queryObj;
    },
    populate(path) {
      shouldPopulate = true;
      return queryObj;
    },
    lean() {
      return queryObj;
    },
    then(resolve, reject) {
      try {
        const item = items.find((i) => matchesQuery(i, filter));
        if (!item) return Promise.resolve(null).then(resolve, reject);
        let doc = cloneDoc(item, selectFields);
        if (shouldPopulate) doc = populateDoc(doc, collectionName);
        return Promise.resolve(doc).then(resolve, reject);
      } catch (err) {
        return Promise.reject(err).then(resolve, reject);
      }
    },
  };
  return queryObj;
}

function attachInMemoryFallback(modelName, collectionKey) {
  const model = mongoose.models[modelName];
  if (!model) return;

  const originalFind = model.find.bind(model);
  const originalFindOne = model.findOne.bind(model);
  const originalCreate = model.create.bind(model);
  const originalCount = model.countDocuments.bind(model);
  const originalFindByIdAndUpdate = model.findByIdAndUpdate?.bind(model);
  const originalFindOneAndUpdate = model.findOneAndUpdate?.bind(model);

  model.find = function (filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return originalFind(filter);
    }
    return createQuery(collectionKey, store[collectionKey] || [], filter);
  };

  model.findOne = function (filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return originalFindOne(filter);
    }
    return createSingleQuery(collectionKey, store[collectionKey] || [], filter);
  };

  model.findById = function (id) {
    if (mongoose.connection.readyState === 1) {
      return model.findOne({ _id: id });
    }
    return createSingleQuery(collectionKey, store[collectionKey] || [], { _id: id });
  };

  model.countDocuments = function (filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return originalCount(filter);
    }
    const filtered = (store[collectionKey] || []).filter((item) => matchesQuery(item, filter));
    return Promise.resolve(filtered.length);
  };

  model.create = function (docOrDocs) {
    if (mongoose.connection.readyState === 1) {
      return originalCreate(docOrDocs);
    }
    const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];
    const created = docs.map((d) => {
      const id = d._id ? String(d._id) : new mongoose.Types.ObjectId().toString();
      const newDoc = {
        ...d,
        _id: id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (store[collectionKey] = store[collectionKey] || []).unshift(newDoc);
      return cloneDoc(newDoc);
    });
    return Promise.resolve(Array.isArray(docOrDocs) ? created : created[0]);
  };

  model.findByIdAndUpdate = function (id, update, options = {}) {
    return model.findOneAndUpdate({ _id: id }, update, options);
  };

  model.findOneAndUpdate = function (filter, update, options = {}) {
    if (mongoose.connection.readyState === 1 && originalFindOneAndUpdate) {
      return originalFindOneAndUpdate(filter, update, options);
    }
    const list = store[collectionKey] || [];
    let item = list.find((i) => matchesQuery(i, filter));

    if (!item && options.upsert) {
      item = { _id: new mongoose.Types.ObjectId().toString(), ...filter };
      list.push(item);
    }

    if (item) {
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          item[k] = (item[k] || 0) + v;
        }
      }
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith("$")) {
          item[k] = v;
        }
      }
      item.updatedAt = new Date();
    }
    return Promise.resolve(cloneDoc(item));
  };
}

function initializeInMemoryFallbacks() {
  attachInMemoryFallback("User", "users");
  attachInMemoryFallback("Client", "clients");
  attachInMemoryFallback("Quotation", "quotations");
  attachInMemoryFallback("Invoice", "invoices");
  attachInMemoryFallback("Payment", "payments");
  attachInMemoryFallback("Counter", "counters");
  attachInMemoryFallback("QuotationCounter", "counters");
}

module.exports = {
  store,
  initializeInMemoryFallbacks,
};

export const fulfillmentResponse = {
  listFulfillments: {
    statusCode: 200,
    message: 'Fulfillments retrieved',
    data: [
      {
        id: 'ff-uuid-001',
        applicationId: 'app-uuid-001',
        status: 'dispatched',
        deliveryMethod: 'delivery',
        dispatchedAt: '2026-04-20T08:00:00.000Z',
        deliveredAt: null,
        supplier: { id: 'sup-uuid-001', name: 'AgroSupply Co.' },
        application: { applicationRef: 'UBI-2026-AB3CD7E' },
      },
    ],
    meta: { total: 1, page: 1, limit: 20, pages: 1 },
  },
  createFulfillment: {
    statusCode: 201,
    message: 'Fulfillment created',
    data: {
      id: 'ff-uuid-001',
      applicationId: 'app-uuid-001',
      supplierId: 'sup-uuid-001',
      status: 'pending',
      deliveryMethod: 'delivery',
      deliveryAddress: 'No 4 Kankia Road, Katsina',
      items: [
        { itemName: 'Maize Seeds (OPV)', quantity: 5, unitOfMeasure: 'bag', stockAvailable: true },
        { itemName: 'Urea Fertilizer', quantity: 2, unitOfMeasure: 'bag', stockAvailable: true },
      ],
    },
  },
  dispatch: {
    statusCode: 200,
    message: 'Dispatch recorded',
    data: null,
  },
  deliver: {
    statusCode: 200,
    message: 'Delivery recorded',
    data: null,
  },
  listSuppliers: {
    statusCode: 200,
    message: 'Suppliers retrieved',
    data: [
      {
        id: 'sup-uuid-001',
        name: 'AgroSupply Co.',
        location: 'Kano, Nigeria',
        contactPerson: 'Musa Ibrahim',
        contactPhone: '08012345678',
        deliveryCoverage: 'Kano, Katsina, Kaduna, Jigawa',
        isActive: true,
      },
    ],
  },
  createSupplier: {
    statusCode: 201,
    message: 'Supplier created',
    data: {
      id: 'sup-uuid-002',
      name: 'Delta AgroMart',
      location: 'Asaba, Delta State',
      contactPerson: 'Chukwuemeka Eze',
      contactPhone: '08023456789',
      isActive: true,
    },
  },
} as const;

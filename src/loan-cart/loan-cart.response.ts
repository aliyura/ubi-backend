export const loanCartResponse = {
  getCart: {
    statusCode: 200,
    message: 'Cart retrieved',
    data: {
      id: 'cart-uuid-001',
      userId: 'user-uuid-001',
      total: 39500,
      items: [
        {
          id: 'item-uuid-001',
          cartId: 'cart-uuid-001',
          resourceId: 'res-uuid-001',
          quantity: 5,
          resource: {
            id: 'res-uuid-001',
            name: 'Maize Seeds (OPV)',
            unitPrice: 3500,
            unitOfMeasure: 'bag',
            stockQuantity: 200,
            category: { name: 'Seeds' },
          },
        },
        {
          id: 'item-uuid-002',
          cartId: 'cart-uuid-001',
          resourceId: 'res-uuid-002',
          quantity: 1,
          resource: {
            id: 'res-uuid-002',
            name: 'Urea Fertilizer',
            unitPrice: 22000,
            unitOfMeasure: 'bag',
            stockQuantity: 500,
            category: { name: 'Fertilizers' },
          },
        },
      ],
    },
  },
  addItem: {
    statusCode: 200,
    message: 'Cart retrieved',
    data: { id: 'cart-uuid-001', total: 39500, items: [] },
  },
  updateItem: {
    statusCode: 200,
    message: 'Cart retrieved',
    data: { id: 'cart-uuid-001', total: 29000, items: [] },
  },
  removeItem: {
    statusCode: 200,
    message: 'Cart retrieved',
    data: { id: 'cart-uuid-001', total: 22000, items: [] },
  },
  clearCart: {
    statusCode: 200,
    message: 'Cart cleared',
    data: null,
  },
} as const;

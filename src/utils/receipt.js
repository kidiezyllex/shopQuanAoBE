/**
 * @param {Object} order - The order object
 * @returns {Object} Receipt data
 */
export const generateReceipt = async (order) => {
  try {
    const date = new Date(order.createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    const customerInfo = order.customer ? {
      name: order.customer.fullName || 'Khách lẻ',
      phone: order.customer.phone || 'N/A',
      email: order.customer.email || 'N/A'
    } : {
      name: 'Khách lẻ',
      phone: 'N/A',
      email: 'N/A'
    };

    const paymentInfo = order.payments.map(payment => ({
      method: payment.method,
      amount: payment.amount,
      date: new Date(payment.createdAt).toLocaleString()
    }));

    const items = order.items.map(item => {
      const product = item.product;
      return {
        name: product.name,
        variant: product.variants.id(item.variant)?.name || 'N/A',
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      };
    });

    const receipt = {
      orderNumber: order._id,
      date: formattedDate,
      time: formattedTime,
      customer: customerInfo,
      items: items,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.totalAmount,
      paid: order.paidAmount,
      remaining: order.totalAmount - order.paidAmount,
      payments: paymentInfo,
      staff: order.createdBy?.fullName || 'Nhân viên'
    };

    return receipt;
  } catch (error) {
    throw new Error('Không thể tạo hóa đơn');
  }
}; 
const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD', 
  EWALLET: 'EWALLET'
};

export const processPaymentByMethod = async (method, paymentDetails) => {
  switch (method) {
    case PAYMENT_METHODS.CASH:
      return processCashPayment(paymentDetails);
    case PAYMENT_METHODS.CARD:
      return processCardPayment(paymentDetails);
    case PAYMENT_METHODS.EWALLET:
      return processEWalletPayment(paymentDetails);
    default:
      throw new Error('Phương thức thanh toán không hợp lệ');
  }
};

const processCashPayment = (paymentDetails) => {
  void paymentDetails;
  return {
    success: true,
    message: 'Thanh toán tiền mặt thành công',
    transactionId: `CASH_${Date.now()}`
  };
};

const processCardPayment = async (paymentDetails) => {
  void paymentDetails;
  return {
    success: true,
    message: 'Thanh toán thẻ thành công',
    transactionId: `CARD_${Date.now()}`
  };
};

const processEWalletPayment = async (paymentDetails) => {
  void paymentDetails;
  return {
    success: true,
    message: 'Thanh toán ví điện tử thành công',
    transactionId: `EWALLET_${Date.now()}`
  };
}; 
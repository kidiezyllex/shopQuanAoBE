const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.isValidStatus = (status) => {
  return Object.values(ORDER_STATUS).includes(status);
};

exports.canTransitionTo = (currentStatus, newStatus) => {
  const validTransitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: []
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

exports.getNextPossibleStatuses = (currentStatus) => {
  const validTransitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: []
  };

  return validTransitions[currentStatus] || [];
};

exports.ORDER_STATUS = ORDER_STATUS; 
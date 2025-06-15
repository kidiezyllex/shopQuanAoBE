import vnpay, { dateFormat, ProductCode, VnpLocale } from '../utils/vnpay-fix.js';
import { v4 as uuidv4 } from 'uuid';

const vnpayInstance = new vnpay.VNPay({
  tmnCode: "LXS5R4EG",
  secureSecret: 'E9ZVT6V5D1XF2APNOJP7UBWU91VHGWG7',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512'
});

/**
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} VNPay payment URL and transaction info
 */
export const createQR = async (req, res) => {
  try {
    const { amount, orderInfo, returnUrl, ipAddr } = req.body;
    if (!amount || !orderInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: amount, orderInfo'
      });
    }

    const txnRef = uuidv4().replace(/-/g, '').substring(0, 15);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const vnpayResponse = await vnpayInstance.buildPaymentUrl({
      vnp_Amount: Number(amount) * 100,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl || "http://localhost:5000/api/vnpay/check-payment-vnpay",
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr || req.ip,
    });

    return res.status(201).json({
      success: true,
      data: vnpayResponse,
      txnRef
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Payment verification result
 */
export const checkPayment = async (req, res) => {
  try {
    const vnpayParams = req.query;
    
    const verifyResult = vnpayInstance.verifyReturnUrl(vnpayParams);
    if (verifyResult.isSuccess) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          transactionInfo: verifyResult,
          vnpayParams
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: verifyResult
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleIPN = async (req, res) => {
  try {
    const vnpayParams = req.query;
    const verifyResult = vnpayInstance.verifyReturnUrl(vnpayParams);
    if (verifyResult.isSuccess) {
      const vnp_ResponseCode = vnpayParams['vnp_ResponseCode'];
      if (vnp_ResponseCode === '00') {
        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      } else {
        return res.status(200).json({ RspCode: vnp_ResponseCode, Message: 'Transaction failed or cancelled' });
      }
    } else {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
    }
  } catch (error) {
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
}; 
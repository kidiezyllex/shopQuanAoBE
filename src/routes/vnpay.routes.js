import express from 'express';
import { createQR, checkPayment, handleIPN } from '../controllers/vnpay.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: VNPay
 *   description: Các API liên quan đến thanh toán qua VNPay
 */

/**
 * @swagger
 * /vnpay/create-qr:
 *   post:
 *     summary: Tạo mã QR thanh toán qua VNPay
 *     tags: [VNPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderInfo
 *               - ipAddr
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền thanh toán (VND)
 *                 example: 50000
 *               orderInfo:
 *                 type: string
 *                 description: Thông tin đơn hàng
 *                 example: "Payment for order #123456"
 *               ipAddr:
 *                 type: string
 *                 description: Địa chỉ IP của người dùng
 *                 example: "127.0.0.1"
 *               returnUrl:
 *                 type: string
 *                 description: URL callback sau khi thanh toán (tùy chọn)
 *                 example: "http://localhost:3000/payment/result"
 *     responses:
 *       201:
 *         description: Tạo URL thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: URL thanh toán VNPay
 *                       example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=5000000&vnp_CreateDate=20220528094248&..."
 *                     qrCodeUrl:
 *                       type: string
 *                       description: URL mã QR thanh toán
 *                       example: "https://sandbox.vnpayment.vn/paymentv2/qr/data?vnp_TmnCode=XXX&vnp_Amount=5000000&..."
 *                 txnRef:
 *                   type: string
 *                   description: Mã tham chiếu giao dịch
 *                   example: "abcdef123456789"
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/create-qr', createQR);

/**
 * @swagger
 * /vnpay/check-payment-vnpay:
 *   get:
 *     summary: Kiểm tra kết quả thanh toán VNPay (callback URL)
 *     tags: [VNPay]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Mã phản hồi từ VNPay
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Mã tham chiếu giao dịch
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Số tiền giao dịch
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema:
 *           type: string
 *         description: Thông tin đơn hàng
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: Mã giao dịch VNPay
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Mã ngân hàng thanh toán
 *       - in: query
 *         name: vnp_PayDate
 *         schema:
 *           type: string
 *         description: Thời gian thanh toán
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Mã checksum xác thực
 *     responses:
 *       200:
 *         description: Xác thực thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionInfo:
 *                       type: object
 *                       properties:
 *                         isSuccess:
 *                           type: boolean
 *                           example: true
 *                         message:
 *                           type: string
 *                           example: "Transaction successfully"
 *                     vnpayParams:
 *                       type: object
 *                       description: Tất cả các tham số từ VNPay
 *       400:
 *         description: Xác thực thanh toán thất bại
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/check-payment-vnpay', checkPayment);

/**
 * @swagger
 * /vnpay/vnpay_ipn:
 *   get:
 *     summary: VNPay IPN (Instant Payment Notification) URL
 *     tags: [VNPay]
 *     description: >
 *       This endpoint is for VNPay to send server-to-server notifications about the payment status.
 *       It should verify the secure hash and update the order status in the database.
 *       VNPay expects a JSON response: {"RspCode":"00","Message":"Confirm Success"} for successful processing.
 *     parameters:
 *       - in: query
 *         name: vnp_Amount
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_BankCode
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_BankTranNo
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_CardType
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_PayDate
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_TmnCode
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_TransactionStatus
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_TxnRef
 *         schema: { type: string }
 *       - in: query
 *         name: vnp_SecureHash
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: IPN processed, VNPAY expects specific JSON response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 RspCode:
 *                   type: string
 *                   example: "00"
 *                 Message:
 *                   type: string
 *                   example: "Confirm Success"
 */
router.get('/vnpay_ipn', handleIPN);

export default router; 
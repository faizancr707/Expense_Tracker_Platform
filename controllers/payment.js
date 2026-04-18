const crypto = require('crypto');
const razorPayInstance = require('../util/razorPay');
const db = require('../util/database');

/**
 * ================= CREATE ORDER =================
 */
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const options = {
      amount: 100, // ₹1
      currency: 'INR'
    };

    // Create Razorpay order
    const razorOrder = await razorPayInstance.orders.create(options);

    // Store in DB (status = CREATED)
    await connection.execute(
      `INSERT INTO orders (order_id, status, user_id)
       VALUES (?, ?, ?)`,
      [razorOrder.id, 'CREATED', req.user.userId]
    );

    return res.status(201).json({
      orderId: razorOrder.id,
      amount: razorOrder.amount,
      currency: razorOrder.currency,
      key_id: process.env.RAZOR_ID
    });

  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ message: 'Unable to create order' });
  } finally {
    connection.release();
  }
};


/**
 * ================= VERIFY & UPDATE ORDER =================
 */
exports.addOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body.response;

    // 🔐 STEP 1: Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZOR_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await connection.execute(
        `UPDATE orders SET status = 'FAILED' WHERE order_id = ?`,
        [razorpay_order_id]
      );

      return res.status(400).json({ message: 'Invalid signature' });
    }

    // 🔥 STEP 2: Transaction (critical)
    await connection.beginTransaction();

    // Update order
    await connection.execute(
      `UPDATE orders 
       SET payment_id = ?, signature = ?, status = 'SUCCESS'
       WHERE order_id = ?`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Upgrade user
    await connection.execute(
      `UPDATE users 
       SET is_premium_user = 1 
       WHERE id = ?`,
      [req.user.userId]
    );

    await connection.commit();

    return res.status(200).json({
      message: 'User upgraded to premium'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Payment Error:', error);
    return res.status(500).json({ message: 'Payment verification failed' });
  } finally {
    connection.release();
  }
};
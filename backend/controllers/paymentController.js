const crypto = require("crypto");
const Razorpay = require("razorpay");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const Payment = require("../models/Payment");
const { enrollLearnerInCourse } = require("./courseController");

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createCourseOrder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (course.accessRule !== "Paid") {
      return res.status(400).json({ success: false, message: "This course does not require payment" });
    }

    if (!course.published && req.user.role === "Learner") {
      return res.status(403).json({ success: false, message: "This course is not published yet" });
    }

    const existingProgress = await Progress.findOne({ userId, courseId });
    if (existingProgress) {
      return res.status(400).json({ success: false, message: "You are already enrolled in this course" });
    }

    const amountInPaise = Math.round((Number(course.price) || 0) * 100);
    if (amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: "Course price must be greater than zero" });
    }

    const razorpay = getRazorpayClient();
    const receipt = `course_${course._id}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        courseId: course._id.toString(),
        userId: userId.toString(),
      },
    });

    await Payment.create({
      userId,
      courseId: course._id,
      amount: Number(course.price) || 0,
      currency: order.currency,
      status: "created",
      razorpayOrderId: order.id,
      receipt,
      metadata: {
        orderAmount: order.amount,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        course: {
          id: course._id,
          title: course.title,
          price: Number(course.price) || 0,
        },
        user: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error("Create Course Order Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to create payment order" });
  }
};

const verifyCoursePayment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification details" });
    }

    const paymentRecord = await Payment.findOne({ razorpayOrderId: orderId, userId, courseId });
    if (!paymentRecord) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    if (paymentRecord.status === "paid") {
      const course = await Course.findById(courseId);
      const existingProgress = await Progress.findOne({ userId, courseId });
      if (course && !existingProgress) {
        await enrollLearnerInCourse(course, userId);
      }

      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { paymentId: paymentRecord.razorpayPaymentId },
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      paymentRecord.status = "failed";
      paymentRecord.razorpayPaymentId = paymentId;
      paymentRecord.razorpaySignature = signature;
      await paymentRecord.save();

      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    const razorpay = getRazorpayClient();
    const razorpayPayment = await razorpay.payments.fetch(paymentId);

    if (!razorpayPayment || razorpayPayment.order_id !== orderId) {
      return res.status(400).json({ success: false, message: "Payment order mismatch" });
    }

    const expectedAmount = Math.round(paymentRecord.amount * 100);
    if (Number(razorpayPayment.amount) !== expectedAmount || razorpayPayment.currency !== paymentRecord.currency) {
      return res.status(400).json({ success: false, message: "Payment amount verification failed" });
    }

    if (!["authorized", "captured"].includes(razorpayPayment.status)) {
      return res.status(400).json({ success: false, message: "Payment is not successful" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const progress = await enrollLearnerInCourse(course, userId);

    paymentRecord.status = "paid";
    paymentRecord.razorpayPaymentId = paymentId;
    paymentRecord.razorpaySignature = signature;
    paymentRecord.purchasedAt = new Date();
    paymentRecord.metadata = {
      ...paymentRecord.metadata,
      paymentStatus: razorpayPayment.status,
      paymentMethod: razorpayPayment.method,
    };
    await paymentRecord.save();

    res.status(200).json({
      success: true,
      message: "Payment verified and enrollment completed",
      data: {
        paymentId,
        progress,
      },
    });
  } catch (error) {
    console.error("Verify Course Payment Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

const handleRazorpayWebhook = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay webhook is not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity =
        event.payload?.payment?.entity ||
        event.payload?.order?.entity ||
        null;

      const orderId = paymentEntity?.order_id || paymentEntity?.id || null;
      const paymentId = paymentEntity?.id || "";

      if (orderId) {
        const paymentRecord = await Payment.findOne({ razorpayOrderId: orderId });
        if (paymentRecord && paymentRecord.status !== "paid") {
          const course = await Course.findById(paymentRecord.courseId);
          if (course) {
            await enrollLearnerInCourse(course, paymentRecord.userId);
          }

          paymentRecord.status = "paid";
          paymentRecord.razorpayPaymentId = paymentId;
          paymentRecord.purchasedAt = new Date();
          paymentRecord.metadata = {
            ...paymentRecord.metadata,
            webhookEvent: event.event,
          };
          await paymentRecord.save();
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error.message);
    res.status(500).json({ success: false, message: "Webhook handling failed" });
  }
};

module.exports = {
  createCourseOrder,
  verifyCoursePayment,
  handleRazorpayWebhook,
};

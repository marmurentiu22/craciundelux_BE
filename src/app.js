const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const apiKey = process.env.STRIPE_API_KEY;
const stripe = require("stripe")(apiKey);
const {
  PrismaClient,
  PrismaClientKnownRequestError,
} = require("@prisma/client");
const prisma = new PrismaClient();

const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

const app = express();

const corsOpts = {
  origin: "*",

  methods: ["GET", "POST"],

  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOpts));

app.use(logger("dev"));

app.post(
  "/orders/confirmPayment",
  express.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];
    const endpointSecret =
      "whsec_b10a767f0be4cba4673406103a6f053447e7ad942b4cf8833ac8daa38defd6cd";

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      console.log(err);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const checkoutSessionCompleted = event.data.object;
        //get orderid = client_reference_id
        const orderId = checkoutSessionCompleted.client_reference_id;
        if (orderId == null) {
          console.log("orderId is null");
          return;
        }

        //update order status to completed
        prisma.order.update({
          where: { id: orderId },
          data: { status: "completed" },
        });

        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

module.exports = app;

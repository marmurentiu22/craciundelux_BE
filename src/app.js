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
const asyncMiddleware = (fn) => (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  Promise.resolve(fn(req, res, next)).catch(next);
};
app.post(
  "/orders/confirmPayment",
  express.raw({ type: "application/json" }),
  asyncMiddleware(async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const endpointSecret = "whsec_ekG8UuUsAhWjGzHF00PakDuaQKUzajO5";

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
        console.log(checkoutSessionCompleted);
        const orderId = checkoutSessionCompleted.metadata.orderId;
        con;
        //update order status to completed
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status: "completed" },
        });
        console.log(order);

        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  })
);
//test prisma update order by id
app.get("/test", async (req, res) => {
  const { orderId } = req.query;
  //6579f1443e461b6a78a06956
  console.log(orderId);

  //print all orders
  const orders = await prisma.order.findMany();
  console.log(orders);

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "completed" },
  });

  res.json(order);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

module.exports = app;

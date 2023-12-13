const express = require("express");
const apiKey = process.env.STRIPE_API_KEY;
const stripe = require("stripe")(apiKey);
const router = express.Router();
const {
  PrismaClient,
  PrismaClientKnownRequestError,
} = require("@prisma/client");
const sanitizeHtml = require("sanitize-html");

const prisma = new PrismaClient();

const asyncMiddleware = (fn) => (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post(
  "/getPaymentLink",
  asyncMiddleware(async (req, res) => {
    const {
      name,
      surname,
      phone,
      email,
      county,
      city,
      address,
      postalCode,
      cash,
      packaged,
      itemsOrdered,
      voucher,
    } = req.body;

    if (!name || !surname || !phone || !email || !county || !city || !address) {
      return res.status(404).json({ error: "Invalid data" });
    }

    if (cash != false) {
      return res.status(404).json({ error: "Invalid data" });
    }

    const voucherCode = voucher.toUpperCase();

    //EXAMPLE ITEMSORDERED [{"id":397,"quantity":1}]
    const products = itemsOrdered;
    var amount = 0;
    for (var i = 0; i < products.length; i++) {
      console.log(products[i].id);
      var product = await prisma.product.findMany({
        where: { id: products[i].id },
      });
      var product = product[0];
      amount = amount + product.new_price * products[i].quantity;
    }

    if (voucherCode == "PRODAN15") {
      amount = amount * 0.85;
    }

    //add 14.99 for shipping
    //if wrapped add 14.99
    if (packaged) {
      amount = amount + 14.99;
    }
    amount = amount + 14.99;
    //turn amount into "bani"
    amount = amount * 100;
    amount = Math.trunc(amount);

    const stripePrice = await stripe.prices.create({
      unit_amount: amount,
      currency: "ron",
      product_data: {
        name: "Coș - Crăciun de Lux",
      },
    });

    const order = await prisma.order.create({
      data: {
        name: name,
        surname: surname,
        phone: phone,
        email: email,
        county: county,
        city: city,
        address: address,
        postalCode: postalCode,
        cash: cash,
        packaged: packaged,
        voucher: voucherCode,
        amountToPay: amount,
        itemsOrdered: itemsOrdered,
        status: "pending",
        transactionId: price.id,
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: {
          url: "https://craciundelux.com/multumim",
        },
      },
      client_reference_id: order.id,
    });

    res.json({ url: paymentLink.url });
  })
);

router.post(
  "/addCashOrder",
  asyncMiddleware(async (req, res) => {
    const {
      name,
      surname,
      phone,
      email,
      county,
      city,
      address,
      postalCode,
      cash,
      packaged,
      itemsOrdered,
      voucher,
    } = req.body;

    if (!name || !surname || !phone || !email || !county || !city || !address) {
      return res.status(404).json({ error: "Invalid data" });
    }

    if (cash != true) {
      return res.status(404).json({ error: "Invalid data" });
    }

    const voucherCode = voucher.toUpperCase();

    //EXAMPLE ITEMSORDERED [{"id":397,"quantity":1}]
    const products = itemsOrdered;
    var amount = 0;
    for (var i = 0; i < products.length; i++) {
      console.log(products[i].id);
      var product = await prisma.product.findMany({
        where: { id: products[i].id },
      });
      var product = product[0];
      amount = amount + product.new_price * products[i].quantity;
    }

    if (voucherCode == "PRODAN15") {
      amount = amount * 0.85;
    }

    //add 14.99 for shipping
    //if wrapped add 14.99
    if (packaged) {
      amount = amount + 14.99;
    }
    amount = amount + 14.99;

    const order = await prisma.order.create({
      data: {
        name: name,
        surname: surname,
        phone: phone,
        email: email,
        county: county,
        city: city,
        address: address,
        postalCode: postalCode,
        cash: cash,
        packaged: packaged,
        voucher: voucherCode,
        amountToPay: amount,
        itemsOrdered: itemsOrdered,
        status: "completed",
      },
    });

    res.json({ message: "success" });
  })
);

module.exports = router;

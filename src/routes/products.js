const express = require("express");
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

router.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
  })
);

// Get a specific product by ID
router.get(
  "/:productId",
  asyncMiddleware(async (req, res) => {
    const productId = parseInt(req.params.productId);
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  })
);

module.exports = router;

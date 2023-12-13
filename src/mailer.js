const nodemailer = require("nodemailer");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const readFileAsync = promisify(fs.readFile);

const sendMailFunc = async (
  subject,
  to,
  template,
  orderId,
  county,
  city,
  address,
  postalCode,
  cash,
  itemsOrdered,
  shippingPrice,
  totalPrice
) => {
  try {
    var htmlContent = await readFileAsync(
      path.resolve(__dirname, template),
      "utf8"
    );

    // |*|order_id|*| X
    // |*|products|*|
    // |*|shipping_price|*|x
    // |*|address|*| X
    // |*|payment_method|*| x
    // |*|total_price|*|x
    htmlContent = htmlContent.replace("|*|order_id|*|", orderId);
    htmlContent = htmlContent.replace(
      "|*|address|*|",
      `${address}, ${city}, ${county}, ${postalCode}`
    );
    htmlContent = htmlContent.replace(
      "|*|payment_method|*|",
      cash ? "Cash" : "Card"
    );
    htmlContent = htmlContent.replace(
      "|*|shipping_price|*|",
      `${shippingPrice} RON`
    );
    htmlContent = htmlContent.replace("|*|total_price|*|", `${totalPrice} RON`);

    var productHtml = "";
    for (var i = 0; i < itemsOrdered.length; i++) {
      var product = itemsOrdered[i];
      productHtml += `
    <tr>
        <td bgcolor="#FFF" width="40" align="left" style="color:#5a5a5a;padding:10px 0 10px 0;font-family: 'Lato', Arial, Helvetica, sans-serif;font-weight:bold;font-size:14px;-webkit-font-smoothing:antialiased;line-height:1.4;">
        </td>
        <td bgcolor="#FFFFFF" align="left" style="color:#5a5a5a;padding:10px 40px 10px 40px;font-family: 'Lato', Arial, Helvetica, sans-serif;font-weight:normal;font-size:14px;-webkit-font-smoothing:antialiased;line-height:1.4;">
            ${product.name} x ${product.quantity}
        </td>
        <td bgcolor="#FFFFFF" align="right" style="color:#5a5a5a;padding:10px 40px 10px 40px;font-family: 'Lato', Arial, Helvetica, sans-serif;font-weight:bold;font-size:14px;-webkit-font-smoothing:antialiased;line-height:1.4;">
            ${product.new_price * product.quantity} RON
        </td>
        <td bgcolor="#FFF" width="40" align="left" style="color:#5a5a5a;padding:10px 0 10px 0;font-family: 'Lato', Arial, Helvetica, sans-serif;font-weight:bold;font-size:14px;-webkit-font-smoothing:antialiased;line-height:1.4;">
        </td>
    </tr>
    `;
    }
    htmlContent = htmlContent.replace("|*|products|*|", productHtml);

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "craciundelux1@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: "craciundelux1@gmail.com",
      to: to,
      bcc: ["bbla04936@gmail.com", "mariodumitriu26@gmail.com"],
      subject: subject,
      html: htmlContent,
      attachments: [
        { filename: "logo.png", path: "./public/logo.png", cid: "logo" },
        { filename: "order.png", path: "./public/order.png", cid: "order" },
      ],
    };

    // Add the logic to send the email using nodemailer
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error(error);
  }
};

module.exports = sendMailFunc;

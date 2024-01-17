const express = require("express");
const adminRouter = express.Router();
const admin = require("../middleweres/admin");
const paystackAuth = require("../middleweres/paystack");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config({ silent: true });
const { Product } = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const firebaseAdmin = require("firebase-admin");
// const serverkey = require('C:/Flutter/Projects/Production/Lifestyle-main/server/config/serverkey.json');


const type = process.env.TYPE;
const universal_domain = process.env.UNIVERSE_DOMAIN;
const cert_url = process.env.CLIENT_CERT_URL;
const auth_providers = process.env.AUTH_PROVIDER;
const token_url = process.env.TOKEN_URL;
const auth_url = process.env.AUTH_URL;
const client_id = process.env.CLIENT_ID;
const client_email = process.env.CLIENT_EMAIL;
const private_key = process.env.PRIVATE_KEY;
const private_Key_id = process.env.PRIVATE_KEY_ID;
const project_id = process.env.PROJECT_ID;

const serverkey = {
  "type": type,
  "project_id": project_id,
  "private_key_id": private_Key_id,
  "private_key": private_key,
  "client_email": client_email,
  "client_id": client_id,
  "auth_uri": auth_url,
  "token_uri": token_url,
  "auth_provider_x509_cert_url": auth_providers,
  "client_x509_cert_url": cert_url,
  "universe_domain": universal_domain
};


firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serverkey),
});


adminRouter.post("/admin/add-new-product", admin, async (req, res) => {
  try {

    const {
      name,
      description,
      inStock,
      inCart,
      price,
      status,
      category,
      images,
      models,
      createdAt,
    } = req.body;



    let product = new Product({
      name: name,
      price: price,
      status: status,
      inCart: inCart,
      images: images,
      inStock: inStock,
      category: category,
      createdAt: createdAt,
      description: description,
      models: models.length ? models : [''],
    });
    product = await product.save();
    res.status(200).json(product);
  } catch (e) {
    res.status(500).json(`Failed to upload product ${e}`);
  }
});

adminRouter.put("/admin/update-product", admin, async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      inStock,
      price,
      category,
      status,
      images,
      models,
    } = req.body;
    console.log(`Passed description: ${description}`);
    let getImages = await getImage(id);
    let getModels = await getModel(id);
    console.log(`Passed images: ` + images);
    console.log(`Fetched images: ` + getImage);



    const update = {
      _id: id,
      name: name,
      description: description,
      inStock: inStock,
      price: price,
      category: category,
      status: status,
      models: models.length ? models : getModels,
      images: images.length ? images : getImages,
    };

    let product = await updateProduct(id, update);
    product = await product.save();
    res.json(product);
  } catch (e) {
    res.status(500).json(`Failed to update product: ${e}`);
    console.log(`An error occured while trying to update product ${e}`);
  }

  async function updateProduct(id, update) {
    const filter = { _id: id };
    const options = { new: true };
    let doc = await Product.findOneAndUpdate(filter, update, options);
    return doc;
  }
  async function getModel(id) {
    let product = await Product.findById(id);
    if (!product) {
      throw new Error(`Product not found`);
    }
    return product.models;
  }
  async function getImage(id) {
    let product = await Product.findById(id);
    if (!product) {
      throw new Error(`Product not found`);
    }
    console.log(product.images)
    return product.images;
  }

});

adminRouter.post("/admin/add/fcmtoken", async (req, res) => {
  try {
    const { fcmToken, email } = req.body;
    const filter = { email: email };
    const update = {
      fcmToken: fcmToken,
    };
    const options = { new: true };

    if (email) {
      let doc = await User.findOneAndUpdate(filter, update, options);
      if (!doc) {
        console.log(`FcmTokenError: doc is empty`)
      }
      doc = await doc.save();
      res.json(doc);
    }

  } catch (error) {
    console.log("FcmTokenError:" + error);
    res.status(404).json(error);
  }
});

adminRouter.post("/admin/change-order-status", admin, async (req, res) => {
  try {
    const { id, status } = req.body;

    console.log(`Passed status`);
    let order = await findOrderById(id);
    order.status = updateOrderStatus(status)

    order = await order.save();
    res.status(201).json(order);

  }
  catch (e) {
    console.log(`Failed to update status: ${e}`);
  }

  async function findOrderById(id) {
    let order = await Order.findById(id);
    if (!order) {
      res.status(404).json('Failed to update status. Order not found in database');
    }
    return order;
  }

  function updateOrderStatus(status) {
    return status
  }
});


adminRouter.get("/admin/get-products", async (req, res) => {
  try {
    const products = await Product.find({});
    return res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

adminRouter.get("/admin/get-users", async (req, res) => {
  try {
    const users = await User.find({});
    // console.log(users);
    return res.json(users);
  } catch (error) {
    console.log("Fetch User Error: " + error);
    res.status(500).json({ error: error.message });
  }
});
//Delete Product
adminRouter.post("/admin/delete-product", admin, async (req, res) => {
  try {
    const { id } = req.body;
    let users = await fetchAllUsers();
    await deleteFromAllCart(users, id);
    let product = await Product.findByIdAndDelete(id);
    res.json(product);
  } catch (e) {
    res
      .status(500)
      .json({ error: console.log("Delete product error" + e.message) });
  }

  async function deleteFromAllCart(users, productId) {
    let promises = users.map(user => {
      let cartIndex = user.cart.findIndex((cart) => cart.product._id.equals(productId));
      if (cartIndex !== -1) {
        user.cart.splice(cartIndex, 1);
        return user.save();
      }
    });
    // the cartIndex function is syuncronous while the user.save() function is asyncronious..
    // because of this we need to Promise All
    await Promise.all(promises);
  }

  async function fetchAllUsers() {
    let users = await User.find({});
    if (!users) {
      throw new Error(`No user found`);
    }
    return users;
  }
});

adminRouter.get("/admin/get-orders", admin, async (req, res) => {
  try {
    const orders = await Order.find({});
    paidOrders = orders.filter(order => order.paid == true);
    res.json(paidOrders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

adminRouter.get("/admin/get-failed-orders", admin, async (req, res) => {
  try {
    const orders = await Order.find({});
    failedOrders = orders.filter(order => order.paid == false);
    failedOrders.forEach(order => {
      Order.findByIdAndDelete(order.id);
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
    console.log(`Failed to delete failed orders ${e}`);
  }
});

adminRouter.get("/admin/analytics", admin, async (req, res) => {
  try {
    const orders = await Order.find({});
    let totalEarnings = 0;
    for (let i = 0; i < orders.length; i++) {
      for (let j = 0; j < orders[i].products.length; j++) {
        totalEarnings +=
          orders[i].products[j].inStock * orders[i].products[j].product.price;
      }
    }
    //  CATEGORYWISE ORDER FETCHING
    let sofasEarnings = (await fetchCategoryWiseProducts("Sofas")) ?? 0;
    let armchairsEarnings = (await fetchCategoryWiseProducts("Armchairs")) ?? 0;
    let tablesEarnings = (await fetchCategoryWiseProducts("Tables")) ?? 0;
    let bedsEarnings = (await fetchCategoryWiseProducts("Beds")) ?? 0;
    let accessoriesEarnings =
      (await fetchCategoryWiseProducts("Accessories")) ?? 0;
    let lightsEarnings = (await fetchCategoryWiseProducts("Lights")) ?? 0;

    let earnings = {
      totalEarnings,
      sofasEarnings,
      armchairsEarnings,
      tablesEarnings,
      bedsEarnings,
      accessoriesEarnings,
      lightsEarnings,
    };

    res.json(earnings);
  } catch (e) {
    res
      .status(500)
      .json({ error: console.log("AdminRouter Error " + e.message) });
  }
});

async function fetchCategoryWiseProducts(category) {
  earnings = 0;
  let categoriesOrder = await Order.find({
    "products.product.category": category,
  });

  for (let i = 0; i < categoriesOrder.length; i++) {
    for (let j = 0; j < categoriesOrder[i].products.length; j++) {
      earnings +=
        categoriesOrder[i].products[j].inStock *
        categoriesOrder[i].products[j].product.price;
    }
    return earnings;
  }
}

adminRouter.get("/admin/get-order-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);
    let orderStatus = order.status;
    await order.save();
    // console.log("Order status is: " + orderStatus);
    // console.log("Passed id: " + id);

    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
//.....................................................................................................................
adminRouter.post("/transaction-initialize", async (req, res) => {
  // const sk_key = process.env.PAYMENT_SECRET_KEY;
  const sk_key = process.env.PAYMENT_TEST_SECRET_KEY;



  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        amount: req.body.amount,
        email: req.body.email,
      },
      {
        headers: {
          Authorization:
            `Bearer ${sk_key}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json(response.data);
  } catch (e) {
    // const result = e.data;
    // res.sendStatus(e.response.status ? 700 : e.response.status);
    res.sendStatus(e.status);

    console.log(e);
  }
});
//.....................................................................................................................

adminRouter.post("/verify-payment", async (req, res) => {
  const { transactionReference, userId } = req.body;
  const sk_key = process.env.PAYMENT_SECRET_KEY;
  let user = await User.findById(userId);

  console.log(transactionReference);

  try {
    const apiResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${transactionReference}`,
      {
        headers: {
          Authorization: `Bearer ${sk_key}`,
        },
      }
    );

    const body = apiResponse.data;
    if (body.status && body.data.status === "success") {
      res.status(200).json({ message: "Payment verified successfully" });
      if (user) {
        user.cart = [];
        user = await user.save();
      } else {
        res.status(404).json('Order has been verified but user was not found')
      }
    } else {
      res.status(400).json({ error: "Payment verification failed." });
    }
  } catch (error) {
    console.log(error);
  }

});



adminRouter.get("/admin/get-order-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let orders = await Order.findById(id);
    let orderStatus = orders.status;
    console.log("Order status is: " + orderStatus);
    console.log("Passed id: " + id);

    res.json(orderStatus);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
//.....................................................................................................................



adminRouter.post("/send-notification", async (req, res) => {

  const { userIds, title, preview, body, read, action, actionData, } = req.body;
  console.log(`Found ${userIds.length} user IDs`);

  try {

    if (!Array.isArray(userIds)) {
      return res.status(400).json('User ID must be an array');
    }

    const tokens = [];

    for (const userId of userIds) {
      const user = await User.findOne({ _id: userId });
      if (user && user.fcmToken != '') {
        tokens.push(user.fcmToken);
      }
    }

    console.log(`${tokens.length} user FCM tokens retrieved`);

    let message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        action: action,
        actionData: actionData,
        preview: preview,
      },
      tokens: tokens,
    };

    await firebaseAdmin.messaging().sendEachForMulticast(message)
      .then((response) => {
        saveNotification(userIds, title, preview, body, read, action, actionData);
        console.log(response.successCount + ' message(s) sent successfully');
        res.status(200).json(response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
      });



  } catch (e) {
    console.log(`Failed to send notification: ${e}`);
    res.status(404).json(`Failed to send notification: ${e}`)
  }

  async function saveNotification(userIds, title, preview, body, read, action, actionData,) {

    for (let i = 0; i < userIds.length; i++) {
      let user = await User.findById(userIds[i]);

      if (!user) {
        return;
      }
      const notification =
      {
        userId: userIds[i],
        title: title,
        preview: preview,
        message: body,
        read: read,
        date: new Date().getTime(),
        action: action,
        actionData: actionData
      };

      user.notifications.push(notification);
      await user.save();
    }

    console.log(`Notification saved`);

  }

});

adminRouter.get('/user/notifications/:userId', async (req, res) => {

  try {
    const { userId } = req.params;

    let user = await findUserById(userId);
    const notifications = await getUserNotification(user);

    res.status(200).json(notifications);
    await user.save();

  } catch (e) {
    console.log(`Failed to get notification: ${e}`);
    res.status(500).json(e);
  }

  async function findUserById(userId) {
    let user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async function getUserNotification(user) {
    let notifications = await user.notifications;
    if (!notifications) {
      throw new Error('Failed to notifications from user object')
    }
    return notifications;
  }
});

module.exports = adminRouter;

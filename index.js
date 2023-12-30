const express = require("express");
const mongoose = require("mongoose");
const socketIo = require('socket.io');
const http = require('http');
const admin = require("./middleweres/admin");
const paustackAuth = require("./middleweres/paystack");
const adminRouter = require("./routes/admin");

//IMPORTS FROM OTHER FILES
const authRouter = require("./routes/auth");
const productRouter = require("./routes/product");
const userRouter = require("./routes/user");
const paystackAuth = require("./middleweres/paystack");
const { env } = require("process");
const User = require("./models/user");
//INIT
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const DB =
  "mongodb+srv://Gemona:GWMongoDB@lifestyle-ar.6mcm1j2.mongodb.net/?retryWrites=true&w=majority"
// "mongodb+srv://Gemona:X.Individu@cluster0.cz0cqgw.mongodb.net/?retryWrites=true&w=majority";
// "mongodb+srv://pass2000:2000Atlas@cluster0.cz0cqgw.mongodb.net/?retryWrites=true&w=majority";


//MiddleWare
app.use(express.json());
app.use(userRouter);
app.use(authRouter);
app.use(adminRouter);
app.use(productRouter);

//Connections
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Ready");
  })
  .catch((e) => {
    console.log("failed because: " + e);
  });

io.on('connection', (socket) => {
  console.log('a user is connected');
});

User.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
  // if (change.updateDescription && change.updateDescription.updatedFields.notifications) {
  let emited = io.emit('notifi_cations', change.fullDocument.notifications);
  console.log(`This was emited:` + emited);
  // }
  console.log('Full Document: ' + change.fullDocument.notifications);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`"Connected at port: ${PORT} period "`);
});



module.exports = admin;
module.exports = paystackAuth;

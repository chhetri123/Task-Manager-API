const express = require("express");
const sharp=require("sharp")
const app = express();
require("./db/mongoose");
const userRouter = require("./routers/userRouter");
const taskRouter = require("./routers/taskRouter");

const port = process.env.PORT;
const router = new express.Router();
app.use(express.json());
sharp.block({ operation: ["VipsForeignLoadWebp"] });
app.use(router);

app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});

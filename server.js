const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay"); // ✅ ADDED

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ✅ ROOT ROUTE */
app.get("/", (req, res) => {
  res.send("Elite Shop Website Live ✅");
});

/* ================= MONGODB ================= */
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
.then(()=>console.log("MongoDB Connected ✅"))
.catch(err=>console.log("Mongo Error:", err));

/* ✅ RAZORPAY INSTANCE (ADDED) */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ================= EMAIL ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourrealemail@gmail.com",
    pass: "abcd efgh ijkl mnop"
  }
});

function sendEmail(to, subject, text){
  if(!to || to === "unknown") return;

  transporter.sendMail({
    from: "yourrealemail@gmail.com",
    to,
    subject,
    text
  }, (err, info)=>{
    if(err) console.log("Email Error:", err);
    else console.log("Email Sent:", info.response);
  });
}

/* ================= USER ================= */
const userSchema = new mongoose.Schema({
  name:String,
  email:String,
  password:String,
  addresses:[
    {
      fullName:String,
      email:String,
      phone:String,
      address1:String,
      address2:String,
      city:String,
      state:String,
      pincode:String,
      instructions:String
    }
  ]
});
const User = mongoose.model("User", userSchema);

/* ================= RETAILER ================= */
const retailerSchema = new mongoose.Schema({
  email:String,
  password:String
});
const Retailer = mongoose.model("Retailer", retailerSchema);

/* ================= REGISTER ================= */
app.post("/register", async (req,res)=>{
  const {email,password} = req.body;

  const exist = await User.findOne({email});
  if(exist) return res.json({success:false,message:"User exists ❌"});

  await new User({email,password}).save();
  res.json({success:true,message:"Registered ✅"});
});

/* ================= LOGIN ================= */
app.post("/login", async(req,res)=>{
  const {email,password} = req.body;

  const user = await User.findOne({email});
  if(!user) return res.json({success:false,message:"User not found"});
  if(user.password !== password) return res.json({success:false,message:"Wrong password"});

  res.json({success:true,userId:user._id});
});

/* ================= PRODUCT ================= */
const productSchema = new mongoose.Schema({
  title:String,
  category:String,
  brand:String,
  price:Number,
  stock:Number,
  discount:Number,
  image:String,
  sku:String,
  description:String,
  addedBy:String,
  status:{type:String,default:"pending"}
});
const Product = mongoose.model("Product", productSchema);

/* ADD PRODUCT */
app.post("/add-product", async (req,res)=>{
  const product = new Product({
    ...req.body,
    price:Number(req.body.price),
    stock:Number(req.body.stock),
    discount:Number(req.body.discount)
  });

  await product.save();
  res.json({msg:"Product sent for approval ✅"});
});

/* ================= ✅ CREATE ORDER (NEW) ================= */
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_" + Date.now()
    };

    const order = await razorpay.orders.create(options);
    res.json(order);

  } catch (err) {
    console.log("Order Error:", err);
    res.status(500).send("Error creating order");
  }
});

/* ================= बाकी code SAME ================= */

/* APPROVE */
app.post("/approve_product", async (req,res)=>{
  const {sku} = req.body;

  const product = await Product.findOne({sku});
  await Product.updateOne({sku},{status:"approved"});

  if(product?.addedBy){
    sendEmail(product.addedBy,"Approved ✅",`Product ${product.title} approved`);
  }

  res.json({msg:"Approved"});
});

/* REJECT */
app.post("/reject_product", async (req,res)=>{
  const {sku} = req.body;

  const product = await Product.findOne({sku});

  if(product?.addedBy){
    sendEmail(product.addedBy,"Rejected ❌",`Product ${product.title} rejected`);
  }

  await Product.deleteOne({sku});
  res.json({msg:"Rejected"});
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server running on ${PORT} 🚀`));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ✅ EMAIL
const nodemailer = require("nodemailer");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= MONGODB ================= */
mongoose.connect("mongodb://127.0.0.1:27017/EliteShopDB")
.then(()=>console.log("MongoDB Connected ✅"))
.catch(err=>console.log(err));

/* ================= EMAIL SETUP ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourrealemail@gmail.com",
    pass: "abcd efgh ijkl mnop"
  }
});

function sendEmail(to, subject, text){
  if(!to || to === "unknown"){
    console.log("❌ Invalid email, not sending");
    return;
  }

  transporter.sendMail({
    from: "yourrealemail@gmail.com",
    to,
    subject,
    text
  }, (err, info)=>{
    if(err){
      console.log("❌ Email Error:", err);
    }else{
      console.log("✅ Email Sent:", info.response);
    }
  });
}

/* ================= USER ================= */
const userSchema = new mongoose.Schema({
  name:String,
  email:String,
  password:String,

  // ✅ DEFAULT ADDRESS (from registration)
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

  try{
    const existingUser = await User.findOne({email});

    if(existingUser){
      return res.json({success:false,message:"User already exists ❌"});
    }

    const newUser = new User({email,password});
    await newUser.save();

    res.json({success:true,message:"Registration successful ✅"});

  }catch(err){
    res.json({success:false,message:"Error ❌"});
  }
});

/* ================= LOGIN ================= */
app.post("/login", async(req,res)=>{
  const {email,password} = req.body;

  try{
    const user = await User.findOne({email});

    if(!user){
      return res.json({success:false,message:"User not found"});
    }

    if(user.password !== password){
      return res.json({success:false,message:"Incorrect password"});
    }

    res.json({success:true,message:"Login successful"});

  }catch(err){
    console.log(err);
    res.status(500).json({success:false,message:"Server error"});
  }
});

/* ================= RETAILER REGISTER ================= */
app.post("/retailer-register", async(req,res)=>{
  const {email,password} = req.body;

  try{
    const exist = await Retailer.findOne({email});
    if(exist){
      return res.json({success:false,msg:"Retailer already exists ❌"});
    }

    const newRetailer = new Retailer({email,password});
    await newRetailer.save();

    res.json({success:true,msg:"Retailer registered ✅"});
  }catch(err){
    res.json({success:false,msg:"Error ❌"});
  }
});

/* ================= RETAILER LOGIN ================= */
app.post("/retailer-login", async(req,res)=>{
  const {email,password} = req.body;

  try{
    const retailer = await Retailer.findOne({email});

    if(!retailer){
      return res.json({success:false,message:"Retailer not found"});
    }

    if(retailer.password !== password){
      return res.json({success:false,message:"Incorrect password"});
    }

    res.json({success:true,email,message:"Login successful"});

  }catch(err){
    console.log(err);
    res.status(500).json({success:false,message:"Server error"});
  }
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

/* ================= ADD PRODUCT ================= */
app.post("/add-product", async (req,res)=>{
  try{
    const product = new Product({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      discount: Number(req.body.discount)
    });

    await product.save();

    res.json({message:"Product sent for approval ✅"});
  }catch(err){
    console.log(err);
    res.status(500).json({message:"Server error"});
  }
});

/* ================= ADMIN - GET PENDING PRODUCTS ================= */
app.get("/pending_products", async (req,res)=>{
  try{
    const products = await Product.find({status:"pending"});
    res.json(products);
  }catch(err){
    res.status(500).json({msg:"Error"});
  }
});

/* ================= ADMIN - APPROVE PRODUCT ================= */
app.post("/approve_product", async (req,res)=>{
  const {sku} = req.body;

  try{
    const product = await Product.findOne({sku});

    await Product.updateOne({sku},{status:"approved"});

    if(product && product.addedBy){
      sendEmail(
        product.addedBy,
        "Product Approved ✅",
        `Your product "${product.title}" is approved`
      );
    }

    res.json({msg:"Product Approved ✅"});
  }catch(err){
    res.status(500).json({msg:"Error"});
  }
});

/* ================= ADMIN - REJECT PRODUCT ================= */
app.post("/reject_product", async (req,res)=>{
  const {sku} = req.body;

  try{
    const product = await Product.findOne({sku});

    if(product && product.addedBy){
      sendEmail(
        product.addedBy,
        "Product Rejected ❌",
        `Your product "${product.title}" is rejected`
      );
    }

    await Product.deleteOne({sku});

    res.json({msg:"Product Rejected ❌"});
  }catch(err){
    res.status(500).json({msg:"Error"});
  }
});

/* ================= CART ================= */
const cartSchema = new mongoose.Schema({
  userId:String,
  products:[
    {
      name:String,
      price:Number,
      qty:{type:Number,default:1}
    }
  ]
});

const Cart = mongoose.model("Cart", cartSchema);

/* ADD TO CART */
app.post("/api/cart/add", async (req,res)=>{
  const {userId,product} = req.body;

  let cart = await Cart.findOne({userId});

  if(!cart){
    cart = new Cart({
      userId,
      products:[{...product,qty:1}]
    });
  }else{
    const existing = cart.products.find(p=>p.name===product.name);

    if(existing){
      existing.qty += 1;
    }else{
      cart.products.push({...product,qty:1});
    }
  }

  await cart.save();

  res.json({msg:"Added"});
});

/* GET CART */
app.get("/api/cart/:userId", async (req,res)=>{
  const userId = req.params.userId;

  const cart = await Cart.findOne({userId});

  if(!cart){
    return res.json({userId,products:[]});
  }

  res.json(cart);
});

/* UPDATE CART */
app.put("/api/cart/:userId", async (req,res)=>{
  const userId = req.params.userId;
  const {products} = req.body;

  let cart = await Cart.findOne({userId});

  if(!cart){
    cart = new Cart({userId,products});
  }else{
    cart.products = products;
  }

  await cart.save();

  res.json({msg:"Updated"});
});

/* ================= ADDRESS (ADDED) ================= */
const addressSchema = new mongoose.Schema({
  userId:String,
  fullName:String,
  email:String,
  phone:String,
  address1:String,
  address2:String,
  city:String,
  state:String,
  pincode:String,
  instructions:String
});

const Address = mongoose.model("Address", addressSchema);

/* SAVE / UPDATE ADDRESS */
app.post("/api/address", async (req,res)=>{
  try{
    const { userId } = req.body;

    let existing = await Address.findOne({userId});

    if(existing){
      await Address.updateOne({userId}, req.body);
      return res.json({msg:"Address Updated ✅"});
    }

    const newAddress = new Address(req.body);
    await newAddress.save();

    res.json({msg:"Address Saved ✅"});

  }catch(err){
    console.log(err);
    res.status(500).json({msg:"Error ❌"});
  }
});

/* GET ADDRESS */
app.get("/api/address/:userId", async (req,res)=>{
  try{
    const data = await Address.findOne({userId: req.params.userId});

    if(!data){
      return res.json({});
    }

    res.json(data);

  }catch(err){
    res.status(500).json({msg:"Error ❌"});
  }
});

/* ================= SERVER ================= */
app.listen(3000,()=>console.log("Server running on 3000 🚀"));
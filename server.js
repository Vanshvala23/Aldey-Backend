import express from "express";
import connectDB from "./config/db.js"
import productRoutes from "./routes/productRoutes.js";
import env from "dotenv";
const app=express();
env.config();
connectDB();
const PORT=process.env.PORT;
app.use("/api/products",productRoutes);

app.get("/",(req,res)=>
{
    res.send('API is running');
});

app.listen(PORT,(req,res)=>
{
    console.log(`server is listened on http://localhost:${PORT}`);
})
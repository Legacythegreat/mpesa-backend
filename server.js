const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your frontend
app.use(cors({
    origin: "https://bingwa-sokoni.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Load environment variables
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const TILL_NUMBER = process.env.MPESA_TILL_NUMBER;
const CALLBACK_URL = process.env.CALLBACK_URL || "https://bingwa-sokoni.onrender.com/mpesa/callback";

console.log("Environment Variables Loaded:", {
    MPESA_CONSUMER_KEY: CONSUMER_KEY ? "Yes" : "No",
    MPESA_CONSUMER_SECRET: CONSUMER_SECRET ? "Yes" : "No",
    TILL_NUMBER: TILL_NUMBER ? "Yes" : "No",
    CALLBACK_URL: CALLBACK_URL ? "Yes" : "No",
});

async function getAccessToken() {
    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        const response = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${auth}` }
        });
        console.log("Access Token Retrieved:", response.data);
        return response.data.access_token;
    } catch (error) {
        console.error("Error fetching access token:", error.response?.data || error.message);
        throw new Error("Failed to get MPesa access token");
    }
}

app.post('/mpesa-payment', async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        console.log("Received Payment Request:", req.body);
        const token = await getAccessToken();
        
        const requestData = {
            ShortCode: TILL_NUMBER,
            CommandID: "CustomerBuyGoodsOnline",
            Amount: amount,
            Msisdn: phoneNumber,
            BillRefNumber: "BundlePurchase"
        };

        console.log("Sending STK Push Request:", requestData);

        const response = await axios.post('https://api.safaricom.co.ke/mpesa/c2b/v1/simulate', requestData, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        });

        console.log("STK Push Response:", response.data);
        res.json({ message: "MPesa payment initiated, check your phone!", data: response.data });
    } catch (error) {
        console.error("MPesa Payment Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Payment failed", error: error.response?.data || error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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

// Load PayHero credentials
const PAYHERO_API_KEY = process.env.PAYHERO_API_KEY;
const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
const TILL_NUMBER = process.env.MPESA_TILL_NUMBER;
const CALLBACK_URL = process.env.CALLBACK_URL || "https://bingwa-sokoni.onrender.com/mpesa/callback";

console.log("Environment Variables Loaded:", {
    PAYHERO_API_KEY: PAYHERO_API_KEY ? "Yes" : "No",
    PAYHERO_CHANNEL_ID: PAYHERO_CHANNEL_ID ? "Yes" : "No",
    TILL_NUMBER: TILL_NUMBER ? "Yes" : "No",
    CALLBACK_URL: CALLBACK_URL ? "Yes" : "No",
});

app.post('/mpesa-payment', async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        console.log("Received Payment Request:", req.body);

        const requestData = {
            api_key: PAYHERO_API_KEY,
            channel_id: PAYHERO_CHANNEL_ID,
            till_number: TILL_NUMBER,
            phone_number: phoneNumber,
            amount: amount,
            callback_url: CALLBACK_URL
        };

        console.log("Sending MPesa STK Push Request:", requestData);

        const response = await axios.post('https://api.payhero.co.ke/v1/stkpush', requestData, {
            headers: { "Content-Type": "application/json" }
        });

        console.log("MPesa STK Push Response:", response.data);
        res.json({ message: "MPesa payment initiated, check your phone!", data: response.data });
    } catch (error) {
        console.error("MPesa Payment Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Payment failed", error: error.response?.data || error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your frontend
app.use(cors({
    origin: "https://kishbingwasokoni.site",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Load PayHero credentials
const PAYHERO_USERNAME = process.env.PAYHERO_USERNAME;
const PAYHERO_PASSWORD = process.env.PAYHERO_PASSWORD;
const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
const CALLBACK_URL = process.env.CALLBACK_URL || "https://bingwa-sokoni.onrender.com/mpesa/callback";
const BUNDLE_BACKEND_URL = process.env.BUNDLE_BACKEND_URL || "https://bundle-kqde.onrender.com";

console.log("Environment Variables Loaded:", {
    PAYHERO_USERNAME: PAYHERO_USERNAME ? "Yes" : "No",
    PAYHERO_PASSWORD: PAYHERO_PASSWORD ? "Yes" : "No",
    PAYHERO_CHANNEL_ID: PAYHERO_CHANNEL_ID ? "Yes" : "No",
    CALLBACK_URL: CALLBACK_URL ? "Yes" : "No",
    BUNDLE_BACKEND_URL: BUNDLE_BACKEND_URL ? "Yes" : "No"
});

app.post('/mpesa-payment', async (req, res) => {
    try {
        const { phoneNumber, amount, bundleId } = req.body;
        console.log("Received Payment Request:", req.body);

        const requestData = {
            amount: amount,
            phone_number: phoneNumber,
            channel_id: parseInt(PAYHERO_CHANNEL_ID, 10),
            provider: 'm-pesa',
            external_reference: 'INV-' + Date.now().toString(),
            callback_url: CALLBACK_URL
        };

        console.log("Sending MPesa STK Push Request:", requestData);

        const response = await axios.post('https://backend.payhero.co.ke/api/v2/payments', requestData, {
            auth: {
                username: PAYHERO_USERNAME,
                password: PAYHERO_PASSWORD
            },
            headers: { "Content-Type": "application/json" }
        });

        console.log("MPesa STK Push Response:", response.data);
        
        // Check if the STK push was successfully initiated
        if (response.data && response.data.success) {
            console.log("STK push initiated successfully");
            res.json({ 
                success: true,
                message: "MPesa payment request sent. Please check your phone to complete the payment.", 
                data: response.data 
            });
        } else {
            console.log("STK push initiation failed");
            res.status(400).json({ 
                success: false,
                message: "Failed to initiate payment. Please try again.", 
                data: response.data 
            });
        }
    } catch (error) {
        console.error("MPesa Payment Error:", error.response?.data || error.message);
        
        // Provide more specific error messages based on the error
        let errorMessage = "Payment initiation failed";
        if (error.response?.status === 401) {
            errorMessage = "Authentication failed. Please check your PayHero credentials.";
        } else if (error.response?.status === 400) {
            errorMessage = "Invalid payment request. Please check the provided details.";
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = "Payment service temporarily unavailable. Please try again later.";
        }
        
        res.status(500).json({ 
            success: false,
            message: errorMessage, 
            error: error.response?.data || error.message 
        });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

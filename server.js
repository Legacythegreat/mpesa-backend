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
        
        // If payment is successful, trigger bundle activation
       if (response.data && response.data.success) {
        console.log("Triggering Bundle Activation...");
        await axios.post(`${BUNDLE_BACKEND_URL}/confirm-payment`, { phoneNumber, bundleId });
        res.json({ message: "MPesa payment initiated, check your phone!", data: response.data });
    } else {
        res.status(400).json({ message: "Unexpected response from MPesa, please try again.", data: response.data });
    }
} catch (error) {
    console.error("MPesa Payment Error:", error.response?.data || error.message);
    res.status(500).json({ 
        message: "Payment failed", 
        error: error.response?.data || error.message 
        });
    }
}); 

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

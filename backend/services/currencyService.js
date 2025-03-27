const axios = require("axios");
require("dotenv").config();

// Get API key from environment variables
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_CURRENCY = "LKR"; // Default currency

// Function to get exchange rate from a given currency to LKR
const getExchangeRate = async (fromCurrency) => {
  try {
    // If currency is already LKR, no conversion needed
    if (fromCurrency === BASE_CURRENCY) {
      return 1;
    }
    
    // Call the ExchangeRate-API to get the latest rates
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/${fromCurrency}`
    );
    
    // Extract the LKR conversion rate
    const exchangeRate = response.data.conversion_rates[BASE_CURRENCY];
    
    if (!exchangeRate) {
      throw new Error(`Exchange rate for ${fromCurrency} to ${BASE_CURRENCY} not found.`);
    }
    
    return exchangeRate;
  } catch (error) {
    console.error("Error fetching exchange rate:", error.message);
    throw new Error("Failed to fetch exchange rate.");
  }
};

module.exports = {
  getExchangeRate
};
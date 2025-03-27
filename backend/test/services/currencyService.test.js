const axios = require("axios");
const { getExchangeRate } = require("../../services/currencyService");

// Mock axios
jest.mock("axios");

describe("Currency Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console.error during tests to clean up test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error.mockRestore();
  });

  test("should return 1 when currency is already LKR", async () => {
    const result = await getExchangeRate("LKR");
    expect(result).toBe(1);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test("should fetch and return correct exchange rate for USD to LKR", async () => {
    // Mock successful API response
    const mockResponse = {
      data: {
        conversion_rates: {
          LKR: 320.5
        }
      }
    };
    
    axios.get.mockResolvedValueOnce(mockResponse);
    
    const result = await getExchangeRate("USD");
    
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/latest/USD"));
    expect(result).toBe(320.5);
  });

  test("should throw error when exchange rate is not found in API response", async () => {
    // Mock API response without LKR rate
    const mockResponse = {
      data: {
        conversion_rates: {
          USD: 0.003,
          EUR: 0.0027
        }
      }
    };
    
    axios.get.mockResolvedValueOnce(mockResponse);
    
    await expect(getExchangeRate("GBP")).rejects.toThrow("Failed to fetch exchange rate.");
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/latest/GBP"));
  });

  test("should throw error when API call fails", async () => {
    // Mock API failure
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    
    await expect(getExchangeRate("EUR")).rejects.toThrow("Failed to fetch exchange rate.");
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/latest/EUR"));
  });
});
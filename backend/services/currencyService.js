const axios = require('axios');

class CurrencyService {
  constructor() {
    this.exchangeRates = {
      USD: 1,
      NGN: 1600, // Approximate rate, should be fetched from API
      EUR: 0.85,
      GBP: 0.75,
      CAD: 1.35,
      AUD: 1.45
    };
    this.lastUpdated = null;
  }

  // Convert amount between currencies
  convertAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = this.exchangeRates[fromCurrency] || 1;
    const toRate = this.exchangeRates[toCurrency] || 1;

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }

  // Format currency for display
  formatCurrency(amount, currency) {
    const symbols = {
      USD: '$',
      NGN: '₦',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$'
    };

    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  }

  // Check if currency is supported by Stripe
  isStripeSupported(currency) {
    const stripeCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'];
    return stripeCurrencies.includes(currency);
  }

  // Get payment method recommendation based on currency
  getPaymentMethodRecommendation(currency, amount) {
    if (currency === 'NGN') {
      return {
        method: 'flutterwave',
        reason: 'Best for Nigerian Naira payments',
        provider: 'Flutterwave',
        currencies: ['NGN', 'USD', 'EUR', 'GBP']
      };
    } else if (this.isStripeSupported(currency)) {
      return {
        method: 'stripe',
        reason: 'Direct payment processing',
        provider: 'Stripe',
        currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
      };
    } else {
      return {
        method: 'stripe',
        reason: 'Default payment processing',
        provider: 'Stripe',
        currencies: ['USD']
      };
    }
  }

  // Convert to Stripe-compatible currency if needed
  convertForStripe(amount, originalCurrency) {
    if (this.isStripeSupported(originalCurrency)) {
      return {
        amount: amount,
        currency: originalCurrency,
        displayAmount: amount,
        displayCurrency: originalCurrency
      };
    } else {
      // Convert to USD for Stripe processing
      const usdAmount = this.convertAmount(amount, originalCurrency, 'USD');
      return {
        amount: usdAmount,
        currency: 'USD',
        displayAmount: amount,
        displayCurrency: originalCurrency
      };
    }
  }

  // Update exchange rates (should be called periodically)
  async updateExchangeRates() {
    try {
      // Use a free exchange rate API
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      const rates = response.data.rates;

      this.exchangeRates = {
        USD: 1,
        NGN: rates.NGN || 1600,
        EUR: rates.EUR || 0.85,
        GBP: rates.GBP || 0.75,
        CAD: rates.CAD || 1.35,
        AUD: rates.AUD || 1.45
      };

      this.lastUpdated = new Date();
      console.log('Exchange rates updated:', this.exchangeRates);
    } catch (error) {
      console.warn('Failed to update exchange rates:', error.message);
    }
  }
}

module.exports = new CurrencyService();

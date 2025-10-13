import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Home,
  TrendingUp,
  Percent,
  Calendar,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PriceCalculator = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Calculator state
  const [propertyPrice, setPropertyPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [interestRate, setInterestRate] = useState('18'); // Nigerian mortgage rates
  const [loanTerm, setLoanTerm] = useState('20'); // Years
  const [propertyTax, setPropertyTax] = useState('2'); // Percentage
  const [insurance, setInsurance] = useState('50000'); // Annual insurance

  // Calculation results
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  // Calculate mortgage payment
  const calculateMortgage = () => {
    if (!propertyPrice || !downPayment || !interestRate || !loanTerm) return;

    const principal = parseFloat(propertyPrice) - parseFloat(downPayment);
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const numPayments = parseFloat(loanTerm) * 12;

    if (monthlyRate === 0) {
      setMonthlyPayment(principal / numPayments);
      setTotalPayment(principal);
      setTotalInterest(0);
      return;
    }

    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - principal;

    setMonthlyPayment(monthlyPayment);
    setTotalPayment(totalPayment);
    setTotalInterest(totalInterest);
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    calculateMortgage();
  }, [propertyPrice, downPayment, interestRate, loanTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Mortgage Calculator</h1>
          <p className="text-gray-600">Calculate your monthly mortgage payments and total loan costs</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-bold text-[#2C3E50] mb-6 flex items-center gap-2">
              <Calculator className="text-[#FF6B35]" />
              Loan Details
            </h2>

            <div className="space-y-6">
              {/* Property Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Price (₦)
                </label>
                <input
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(e.target.value)}
                  placeholder="50,000,000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>

              {/* Down Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Down Payment (₦)
                </label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="10,000,000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (% per year)
                </label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="18"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Typical Nigerian mortgage rates: 15-25%</p>
              </div>

              {/* Loan Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term (years)
                </label>
                <select
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                >
                  <option value="10">10 years</option>
                  <option value="15">15 years</option>
                  <option value="20">20 years</option>
                  <option value="25">25 years</option>
                  <option value="30">30 years</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Monthly Payment */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
                <DollarSign className="text-[#FF6B35]" />
                Monthly Payment
              </h3>
              <div className="text-3xl font-bold text-[#FF6B35] mb-2">
                {formatCurrency(monthlyPayment)}
              </div>
              <p className="text-sm text-gray-600">
                Principal & Interest: {formatCurrency(monthlyPayment * 0.8)}
              </p>
            </div>

            {/* Loan Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
                <TrendingUp className="text-[#FF6B35]" />
                Loan Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Amount:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(propertyPrice || 0) - parseFloat(downPayment || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(totalInterest)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-medium">Total Payment:</span>
                  <span className="font-bold text-[#FF6B35]">{formatCurrency(totalPayment)}</span>
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
                <Calendar className="text-[#FF6B35]" />
                Payment Schedule
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Monthly Payment</p>
                  <p className="font-semibold text-[#2C3E50]">{formatCurrency(monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Loan Term</p>
                  <p className="font-semibold text-[#2C3E50]">{loanTerm} years</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Interest Rate</p>
                  <p className="font-semibold text-[#2C3E50]">{interestRate}%</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total Payments</p>
                  <p className="font-semibold text-[#2C3E50]">{parseFloat(loanTerm) * 12}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Important Notes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• These calculations are estimates and may vary based on your specific lender terms</li>
                <li>• Additional costs like property taxes, insurance, and maintenance are not included</li>
                <li>• Interest rates may vary based on your credit score and lender requirements</li>
                <li>• Consult with a financial advisor or mortgage specialist for accurate quotes</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PriceCalculator;

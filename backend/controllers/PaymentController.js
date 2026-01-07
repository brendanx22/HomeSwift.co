const https = require('https');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const verifyPayment = async (req, res) => {
  try {
    const { reference, bookingId } = req.body;

    if (!reference) {
      return res.status(400).json({ status: 'error', message: 'No reference provided' });
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is missing');
      return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }

    // Verify with Paystack
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    };

    const paystackReq = https.request(options, apiRes => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', async () => {
        try {
          const response = JSON.parse(data);
          
          if (response.status && response.data.status === 'success') {
            // Payment verified successfully
            const amountPaid = response.data.amount / 100; // Convert kobo to naira
            
            // Log verification
            req.log(`Payment verified for reference ${reference}: ${amountPaid} NGN`);

            // Update booking in Supabase
            if (bookingId && req.supabase) {
               const { error: updateError } = await req.supabase
                .from('bookings')
                .update({ 
                  payment_status: 'paid',
                  payment_reference: reference,
                  updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);
                
                if (updateError) {
                  req.errorLog('Failed to update booking status', updateError);
                  // We still return success as the payment WAS validated
                }
            }

            return res.status(200).json({ 
              status: 'success', 
              message: 'Payment verified', 
              data: response.data 
            });
          } else {
            return res.status(400).json({ 
              status: 'error', 
              message: 'Payment verification failed', 
              paystack_message: response.message 
            });
          }
        } catch (err) {
          req.errorLog('Error parsing Paystack response', err);
          return res.status(500).json({ status: 'error', message: 'Verification error' });
        }
      });
    });

    paystackReq.on('error', error => {
      req.errorLog('Paystack API request failed', error);
      res.status(500).json({ status: 'error', message: 'Verification service unreachable' });
    });

    paystackReq.end();

  } catch (error) {
    req.errorLog('Payment verification error', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const createRecipient = async (req, res) => {
  try {
    const { name, account_number, bank_code } = req.body;
    const userId = req.user?.id; // Assumes auth middleware populates this

    if (!name || !account_number || !bank_code) {
      return res.status(400).json({ status: 'error', message: 'Missing bank details' });
    }

    const params = JSON.stringify({
      type: "nuban",
      name: name,
      account_number: account_number,
      bank_code: bank_code,
      currency: "NGN"
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transferrecipient',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const paystackReq = https.request(options, apiRes => {
      let data = '';

      apiRes.on('data', chunk => data += chunk);

      apiRes.on('end', async () => {
        const response = JSON.parse(data);
        
        if (response.status) {
          const recipientCode = response.data.recipient_code;
          
          // Save to Supabase (e.g., in a landlord_payouts table or user_profiles)
          if (userId && req.supabase) {
             // Assuming we store this in user_profiles or a generic settings table
             // For now, let's update a JSONB column or similar
             // Or create a new record in a 'payout_settings' table
             const { error } = await req.supabase
               .from('user_profiles')
               .update({ 
                 payout_recipient_code: recipientCode,
                 bank_details: {
                   bank_name: response.data.details.bank_name,
                   account_number: response.data.details.account_number,
                   account_name: response.data.details.account_name
                 }
               })
               .eq('id', userId);
               
             if (error) req.errorLog('Failed to save payout settings', error);
          }

          res.json({ status: 'success', data: response.data });
        } else {
          res.status(400).json({ status: 'error', message: 'Failed to create recipient', data: response });
        }
      });
    });

    paystackReq.write(params);
    paystackReq.end();

  } catch (error) {
    req.errorLog('Create recipient error', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

const getBanks = async (req, res) => {
   // Proxy to Paystack or return cached list
   const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/bank',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    };

    https.request(options, apiRes => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
           const response = JSON.parse(data);
           res.json(response);
        } catch(e) {
           res.status(500).json({status: 'error'});
        }
      });
    }).end();
};

module.exports = {
  verifyPayment,
  createRecipient,
  getBanks
};

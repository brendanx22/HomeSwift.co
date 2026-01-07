const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

const generateLease = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ status: 'error', message: 'Booking ID required' });
    }

    // Fetch booking details including property and landlord info
    const { data: booking, error: bookingError } = await req.supabase
      .from('bookings')
      .select('*, property:properties(*), tenant:user_profiles(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      req.errorLog('Lease generation failed: Booking not found', bookingError);
      return res.status(404).json({ status: 'error', message: 'Booking not found' });
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // -- PDF CONTENT GENERATION --
    doc.fontSize(20).text('RESIDENTIAL LEASE AGREEMENT', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(12).text(`This Lease Agreement is made on ${new Date().toLocaleDateString()}`, { align: 'left' });
    doc.moveDown();
    
    doc.text(`BETWEEN: ${booking.landlord_name || 'Landlord'} ("Landlord")`);
    doc.text(`AND: ${booking.tenant_name || booking.tenant?.full_name || 'Tenant'} ("Tenant")`);
    doc.moveDown();
    
    doc.text(`1. PROPERTY: The Landlord agrees to rent to the Tenant the property located at:`);
    doc.font('Helvetica-Bold').text(`${booking.property_location}`);
    doc.font('Helvetica');
    doc.moveDown();
    
    doc.text(`2. TERM: The lease term shall be for ${booking.lease_duration} months, commencing on ${booking.move_in_date}.`);
    doc.moveDown();
    
    doc.text(`3. RENT: The Tenant agrees to pay a total rent of NGN ${booking.total_amount?.toLocaleString()}, paid in advance.`);
    doc.moveDown();
    
    doc.text(`4. TERMS AND CONDITIONS:`);
    doc.text(`- The Tenant agrees to use the property for residential purposes only.`);
    doc.text(`- The Tenant shall not sublet the property without written consent.`);
    doc.text(`- The Tenant is responsible for any damage caused during the tenancy.`);
    doc.moveDown(2);
    
    doc.text(`SIGNED:`, { underline: true });
    doc.moveDown(4);
    
    doc.text(`________________________          ________________________`);
    doc.text(`Landlord Signature                Tenant Signature`);
    
    doc.end();

    // -- HANDLE PDF STREAM END --
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      
      // Upload to Supabase Storage
      const fileName = `leases/${bookingId}_${uuidv4()}.pdf`;
      const { data: uploadData, error: uploadError } = await req.supabase
        .storage
        .from('documents') // Ensure this bucket exists
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        req.errorLog('Failed to upload lease PDF', uploadError);
        return res.status(500).json({ status: 'error', message: 'Failed to save lease document' });
      }

      // Get Public URL
      const { data: { publicUrl } } = req.supabase
        .storage
        .from('documents')
        .getPublicUrl(fileName);

      // Update booking with lease URL
      const { error: updateError } = await req.supabase
        .from('bookings')
        .update({ 
          lease_url: publicUrl, 
          status: 'confirmed' // Auto-confirm booking if lease is generated? Or keep as paid?
        })
        .eq('id', bookingId);
        
      if (updateError) {
        req.errorLog('Failed to update booking with lease URL', updateError);
      }

      req.log(`Lease generated for booking ${bookingId}`);
      
      res.json({ 
        status: 'success', 
        message: 'Lease generated successfully', 
        data: { lease_url: publicUrl } 
      });
    });

  } catch (error) {
    req.errorLog('Lease generation error', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = { generateLease };

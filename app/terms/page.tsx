export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Booking Terms</h2>
            <p className="text-muted-foreground mb-4">
              By booking tickets through the MGM Museum website, you agree to these terms and conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Ticket Validity</h2>
            <p className="text-muted-foreground mb-4">
              Tickets are valid only for the date and time slot selected during booking.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cancellation Policy</h2>
            <p className="text-muted-foreground mb-4">
              Cancellations must be made at least 24 hours before the scheduled visit for a full refund.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Payment</h2>
            <p className="text-muted-foreground mb-4">
              All payments are processed securely through Razorpay. We accept all major credit and debit cards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Contact</h2>
            <p className="text-muted-foreground mb-4">
              For any questions or concerns, please contact us at support@mgmmuseum.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import './Support.css';

const Support = () => {
  const faqs = [
    {
      question: "How do I rent an item?",
      answer: "Browse the catalog, click on an item you like, and press the 'Book Now' button. Follow the booking process to complete your rental."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We currently accept credit cards, debit cards, and PayPal for all transactions."
    },
    {
      question: "How long can I rent an item for?",
      answer: "You can rent items for a minimum of 1 day and a maximum of 30 days. Extensions may be possible depending on availability."
    },
    {
      question: "What if the item doesn't fit or I don't like it?",
      answer: "We offer a 24-hour return policy. If you're not satisfied, you can return the item for a full refund minus shipping costs."
    }
  ];

  return (
    <div className="support">
      <div className="support-container">
        <h1>Frequently Asked Questions</h1>
        
        <div className="faq-section">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="contact-section">
          <h2>Need More Help?</h2>
          <p>Contact our support team at:</p>
          <a href="mailto:support@rentclo.com" className="contact-email">
            support@rentclo.com
          </a>
          <p>We typically respond within 24 hours.</p>
        </div>
      </div>
    </div>
  );
};

export default Support;
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import "../styles/faq.css";

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqData = [
    {
      question: "How can I borrow a Book?",
      answer:
        "To borrow a book, navigate to the home page, browse available books, and click on the book you want to borrow. Then click the 'Borrow' button and select your preferred borrow date. Once submitted, an admin will review and approve your request.",
    },
    {
      question: "How can I return a Book?",
      answer:
        "To return a borrowed book, go to 'My Shelf' and view your borrowed books. Click on the book you want to return and select the 'Return' option. Confirm the return date and submit. Make sure to return the book by the due date to avoid late fees.",
    },
    {
      question: "How can I change password?",
      answer:
        "To change your password, go to your Profile page and click on 'Change Password'. Enter your current password and then your new password twice for confirmation. Click 'Update' to save the changes.",
    },
    {
      question: "How do I reserve a book?",
      answer:
        "You can reserve a book that is currently borrowed by someone else. Find the book in the catalog, click on it, and select the 'Reserve' option. Choose your preferred reservation date, and once an admin approves it, you'll be notified when the book becomes available.",
    },
    {
      question: "What is the borrowing period?",
      answer:
        "The standard borrowing period is typically 14 days from the date the book is approved. However, this may vary based on your membership level. Check your loan details in 'My Shelf' for specific due dates.",
    },
    {
      question: "How do I contact support?",
      answer:
        "If you need further assistance, you can use the chat feature available in the app or contact the library administrator through the support section. You can also reach out via email or visit the library in person.",
    },
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about our library app</p>
      </div>

      <div className="faq-content">
        {faqData.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${expandedIndex === index ? "expanded" : ""}`}
          >
            <button
              className="faq-question"
              onClick={() => toggleExpand(index)}
              aria-expanded={expandedIndex === index}
            >
              <span className="question-text">{item.question}</span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="chevron-icon"
              />
            </button>
            <div
              className="faq-answer-wrapper"
              style={{
                maxHeight:
                  expandedIndex === index ? "500px" : "0",
              }}
            >
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;

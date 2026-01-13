// components/ChatPopup.js
import React, { useState, useRef, useEffect } from 'react';
import "../components/App.css";
import API_BASE_URL from '../config/api';

// Enhanced ChatPopup with book search integration
const ChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I\'m Parañaledge AI 📚 I can help you find books, answer questions about the library, or provide recommendations. What are you looking for?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const togglePopup = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    const userMsg = { sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      
      const data = await res.json();
      const reply = data?.reply || data?.error || 'Sorry, I couldn\'t process that request.';
      
      // Add the main reply
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      
      // If books were found, add a suggestion to ask for more details
      if (data?.books && data.books.length > 0) {
        setMessages((prev) => [...prev, { 
          sender: 'bot', 
          text: '💡 Tip: You can ask for more details about any book or search for something else!',
          isHint: true 
        }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        text: '❌ Error contacting AI. Please try again.' 
      }]);
      console.error('Chat error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) sendMessage();
    }
  };

  // Quick suggestion buttons
  const quickSuggestions = [
    'Find me a book about history',
    'Show available books',
    'Book recommendations',
    'How to borrow books?'
  ];

  const handleQuickSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="chat-popup-wrapper">
      {isOpen && (
        <div className="chat-popup">
          <div className="chat-header">
            <span>📚 Parañaledge AI Assistant</span>
            <button className="chat-close" onClick={togglePopup}>✕</button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.sender} ${msg.isHint ? 'hint' : ''}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot loading">
                <span className="typing-animation">●●●</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="chat-suggestions">
              <p>Quick searches:</p>
              {quickSuggestions.map((suggestion, i) => (
                <button 
                  key={i} 
                  className="suggestion-btn"
                  onClick={() => handleQuickSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask about books, genres, availability..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="send-btn"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}
      <button 
        className="chat-toggle" 
        onClick={togglePopup}
        title={isOpen ? 'Close Chat' : 'Open Chat'}
      >
        💬
      </button>
    </div>
  );
};

export default ChatPopup;

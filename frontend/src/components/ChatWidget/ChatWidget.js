import React, { useState, useRef, useEffect } from 'react';
import { chat } from '../../services/api';
import './ChatWidget.css';

const ChatWidget = ({
  endpoint,
  context = '',
  title = 'AI Food Assistant',
  placeholder = 'Ask a question...',
  initialMessage = 'Hello! How can I assist you today with this food analysis?',
  suggestedQuestions = [],
}) => {
  const [messages, setMessages] = useState([
    { role: 'model', content: initialMessage },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      // Map to API format
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chat(endpoint, apiMessages, context);
      const replyText =
        response.reply ||
        response.content ||
        response.response ||
        (typeof response === 'string' ? response : 'I received your request.');

      setMessages((prev) => [...prev, { role: 'model', content: replyText }]);
    } catch (err) {
      setError(err.userMessage || 'Could not connect to AI advisor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-header-title">
          <span className="chat-status-dot"></span>
          <h4>{title}</h4>
        </div>
        <span className="chat-tag">Gemini Powered</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-bubble-wrapper ${
              msg.role === 'user' ? 'user-wrapper' : 'ai-wrapper'
            }`}
          >
            <div className="avatar-icon">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
              <p className="bubble-text">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-bubble-wrapper ai-wrapper">
            <div className="avatar-icon">🤖</div>
            <div className="chat-bubble ai-bubble typing-bubble">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {error && <div className="chat-error-banner">⚠️ {error}</div>}

        <div ref={messagesEndRef} />
      </div>

      {suggestedQuestions.length > 0 && (
        <div className="suggestions-bar">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-chip"
              onClick={() => handleSend(q)}
              disabled={isLoading}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-bar">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="chat-text-input"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isLoading || !inputValue.trim()}
          className="chat-send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;

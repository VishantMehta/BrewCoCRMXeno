import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

function AIChat() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: 'Hi! I am your AI CRM assistant. Ask me to find an audience or draft a campaign message.', intent: 'general' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userText }]);
    setLoading(true);

    try {
      await new Promise(r => setTimeout(r, 600));
      
      const response = await apiClient.chat(userText);
      console.log('AI Response:', response);

      const aiMsgId = Date.now() + 1;
      
      let replyText = response.response;
      
      if (response.intent === 'segment') {
        replyText = response.response || `I've prepared a segment ruleset: "${response.segment_name || 'New Segment'}". You can preview or save it in the Campaigns tab.`;
        
        navigate('/campaigns', { 
          state: { 
            prefillSegment: {
              name: response.segment_name,
              rules_json: response.rules_json
            }
          } 
        });
      } else if (response.intent === 'draft') {
        replyText = `Here's a draft message:\n\n"${response.message_template}"\n\nYou can use this when creating a new campaign.`;
        
        navigate('/campaigns', { 
          state: { 
            prefillDraft: response.message_template
          } 
        });
      }

      setMessages(prev => [...prev, { 
        id: aiMsgId, 
        role: 'ai', 
        text: replyText,
        intent: response.intent,
        data: response
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 2, 
        role: 'ai', 
        text: 'Sorry, I encountered an error connecting to my brain. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Sparkles size={20} color="var(--accent-primary)" />
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>AI Assistant</h3>
      </div>
      
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              {msg.role === 'ai' ? <Bot size={16} color="var(--accent-primary)"/> : <User size={16} color="var(--text-secondary)"/>}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: msg.role === 'ai' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {msg.role === 'ai' ? 'AI Agent' : 'You'}
              </span>
            </div>
            <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles className="loading-spin" size={16} />
            <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSend} className="chat-input-wrapper">
          <input 
            type="text" 
            className="chat-input"
            placeholder="E.g. Find users who spent > 5000..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-submit" disabled={!input.trim() || loading}>
            <Send size={20} />
          </button>
        </form>
      </div>
      
      <style>{`
        .loading-spin { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default AIChat;

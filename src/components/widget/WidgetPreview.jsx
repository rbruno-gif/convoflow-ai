import { useState } from 'react';
import { Send } from 'lucide-react';

export default function WidgetPreview({ config, darkMode }) {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: config.greeting_message || 'Hi! How can we help?',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(m => [
      ...m,
      { type: 'user', text: input },
      { type: 'bot', text: 'Thanks for your message. A team member will respond shortly.' },
    ]);
    setInput('');
  };

  const bgColor = darkMode ? '#1f2937' : '#f3f4f6';
  const cardBg = darkMode ? '#111827' : '#ffffff';
  const textColor = darkMode ? '#f3f4f6' : '#000000';

  return (
    <div className="flex items-end justify-end h-full">
      {/* Mockup Website */}
      <div
        style={{
          background: bgColor,
          color: textColor,
          width: '600px',
          height: '400px',
          borderRadius: '8px',
          padding: '20px',
          marginRight: '60px',
          marginBottom: '60px',
        }}
      >
        <p style={{ opacity: 0.6 }}>Your Website Content</p>
      </div>

      {/* Widget */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '350px',
          height: '500px',
          background: cardBg,
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: textColor,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: config.primary_color,
            padding: '16px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }}
          />
          {config.bot_name}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: cardBg,
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: msg.type === 'user' ? config.primary_color : 'rgba(0,0,0,0.1)',
                  color: msg.type === 'user' ? 'white' : 'inherit',
                  fontSize: '13px',
                  wordWrap: 'break-word',
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px', borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                background: darkMode ? '#1f2937' : '#f9fafb',
                color: textColor,
                fontSize: '13px',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: config.primary_color,
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Send style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
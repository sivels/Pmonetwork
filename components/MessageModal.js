import { useState } from 'react';

export default function MessageModal({ message, onClose }) {
  const [replyText, setReplyText] = useState('');
  const [attachments, setAttachments] = useState([]);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    // API call to send message
    console.log('Sending reply:', replyText);
    setReplyText('');
  };

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="header-info">
              <div className="sender-avatar">{message.avatar}</div>
              <div>
                <h3>{message.sender}</h3>
                <span className="conversation-label">Conversation Thread</span>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            <div className="thread-container">
              {message.fullThread.map((msg, idx) => (
                <div key={idx} className={`thread-message ${msg.isYou ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    <div className="message-sender">
                      {msg.isYou ? 'You' : msg.sender}
                    </div>
                    <p className="message-text">{msg.message}</p>
                    <div className="message-meta">
                      <span className="message-timestamp">{msg.timestamp}</span>
                      {msg.isYou && <span className="read-receipt">✓✓ Seen</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            {attachments.length > 0 && (
              <div className="attachments-preview">
                {attachments.map((file, idx) => (
                  <div key={idx} className="attachment-chip">
                    📎 {file.name}
                    <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="composer">
              <textarea
                className="message-input"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows="3"
              />
              <div className="composer-actions">
                <label className="attach-btn">
                  📎 Attach
                  <input type="file" multiple onChange={handleAttachment} style={{ display: 'none' }} />
                </label>
                <button className="send-btn" onClick={handleSendReply} disabled={!replyText.trim()}>
                  Send Message →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-container {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 700px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 2px solid #f1f5f9;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px 20px 0 0;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sender-avatar {
          font-size: 48px;
        }

        .header-info h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .conversation-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: #fafbfc;
        }

        .thread-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .thread-message {
          display: flex;
        }

        .thread-message.received {
          justify-content: flex-start;
        }

        .thread-message.sent {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 70%;
          padding: 14px 18px;
          border-radius: 16px;
          animation: messageIn 0.3s ease;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .thread-message.received .message-bubble {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px 16px 16px 4px;
        }

        .thread-message.sent .message-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px 16px 4px 16px;
        }

        .message-sender {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
          opacity: 0.8;
        }

        .message-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .message-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          font-size: 11px;
          opacity: 0.7;
        }

        .read-receipt {
          color: #10b981;
          font-weight: 600;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 2px solid #f1f5f9;
          background: white;
          border-radius: 0 0 20px 20px;
        }

        .attachments-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .attachment-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 13px;
          color: #475569;
        }

        .attachment-chip button {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }

        .composer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          transition: all 0.2s;
        }

        .message-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .composer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .attach-btn {
          padding: 8px 16px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .attach-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .send-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .modal-container {
            max-height: 95vh;
            max-width: 100%;
            margin: 10px;
            border-radius: 16px;
          }

          .message-bubble {
            max-width: 85%;
          }
        }
      `}</style>
    </>
  );
}

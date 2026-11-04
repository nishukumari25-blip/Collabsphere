import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  CheckSquare,
  Sparkles,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';
import { useProject } from '../../context/ProjectContext';

export const AICodeReviewPage = () => {
  const location = useLocation();
  const toast = useToast();
  const { currentProject } = useProject();

  const [code, setCode] = useState(
    location.state?.code ||
`// Express auth handler with potential security concerns
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  // Direct concatenation into query
  const user = await db.query("SELECT * FROM users WHERE username = '" + username + "'");
  if (user && user.password === password) {
    const token = jwt.sign({ id: user.id }, 'hardcoded_secret');
    return res.json({ token });
  }
  return res.status(401).send('Invalid');
});`
  );
  const [language, setLanguage] = useState(location.state?.language || 'javascript');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleReview = async () => {
    if (!code.trim()) {
      toast.warning('Please provide code to review');
      return;
    }

    setLoading(true);
    setError('');
    setReview('');

    try {
      const res = await geminiService.reviewCode({
        code,
        language,
        projectId: currentProject?._id || location.state?.projectId
      });
      if (res.success && res.result) {
        setReview(res.result);
        toast.success('Code audit completed by Gemini AI');
      }
    } catch (err) {
      setError(err.message || 'Gemini code review failed');
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!review) return;
    navigator.clipboard.writeText(review);
    setCopied(true);
    toast.success('Review report copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Code Review & Security Audit</h1>
          <p className="page-subtitle">
            Perform rigorous staff-level code reviews, vulnerability checks, and refactoring with Gemini AI.
          </p>
        </div>
      </div>

      <div className="ai-tool-grid">
        {/* Left: Input Code */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Source Code for Review</span>
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="typescript">TypeScript</option>
              <option value="sql">SQL</option>
            </select>
          </div>

          <textarea
            rows={18}
            className="form-textarea"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              backgroundColor: 'var(--bg-code)',
              color: '#e6edf3',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}
            placeholder="// Paste code for audit..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button
            onClick={handleReview}
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <Sparkles size={16} />
            <span>{loading ? 'Gemini Auditing Code Quality...' : 'Review Code with Gemini'}</span>
          </button>
        </div>

        {/* Right: Review Findings */}
        <div className="card" style={{ padding: '1.5rem', minHeight: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Audit Findings & Suggestions</span>
            {review && (
              <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 1.5rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Analyzing security and code quality...
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Screening for injection risks, timing attacks, memory leaks, and performance hazards.
              </p>
            </div>
          ) : review ? (
            <div className="markdown-body" style={{ maxHeight: '650px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <ReactMarkdown>{review}</ReactMarkdown>
            </div>
          ) : !error ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              <CheckSquare size={40} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>
                Submit code to receive automated security audits, vulnerability scores, and refactored snippets.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

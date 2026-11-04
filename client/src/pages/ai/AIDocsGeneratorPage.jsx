import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  FileCode,
  Sparkles,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';
import { useProject } from '../../context/ProjectContext';

export const AIDocsGeneratorPage = () => {
  const location = useLocation();
  const toast = useToast();
  const { currentProject } = useProject();

  const [code, setCode] = useState(
    location.state?.code ||
`/**
 * Verifies JWT token and extracts authorized user claims
 */
export async function authenticateSession(token, secretKey) {
  if (!token) throw new Error('Session token missing');
  const decoded = await jwt.verify(token, secretKey);
  const user = await Database.users.findById(decoded.userId);
  if (!user || user.isSuspended) {
    throw new SecurityException('Unauthorized user state');
  }
  return { user, permissions: user.roles };
}`
  );
  const [language, setLanguage] = useState(location.state?.language || 'javascript');
  const [docs, setDocs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!code.trim()) {
      toast.warning('Please provide code to document');
      return;
    }

    setLoading(true);
    setError('');
    setDocs('');

    try {
      const res = await geminiService.generateDocs({
        code,
        language,
        projectId: currentProject?._id || location.state?.projectId
      });
      if (res.success && res.result) {
        setDocs(res.result);
        toast.success('Technical documentation generated');
      }
    } catch (err) {
      setError(err.message || 'Gemini documentation generator failed');
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!docs) return;
    navigator.clipboard.writeText(docs);
    setCopied(true);
    toast.success('Documentation copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Documentation Generator</h1>
          <p className="page-subtitle">
            Generate enterprise-grade API specifications, parameter explanations, and runnable usage examples.
          </p>
        </div>
      </div>

      <div className="ai-tool-grid">
        {/* Left: Input Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Source Code to Document</span>
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
            placeholder="// Paste function or class..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button
            onClick={handleGenerate}
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <Sparkles size={16} />
            <span>{loading ? 'Gemini Generating Documentation...' : 'Generate Technical Documentation'}</span>
          </button>
        </div>

        {/* Right: Output Documentation */}
        <div className="card" style={{ padding: '1.5rem', minHeight: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Generated Documentation</span>
            {docs && (
              <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
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
                Structuring API specifications...
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Generating parameters, types, error contracts, and usage patterns.
              </p>
            </div>
          ) : docs ? (
            <div className="markdown-body" style={{ maxHeight: '650px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <ReactMarkdown>{docs}</ReactMarkdown>
            </div>
          ) : !error ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              <FileCode size={40} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>
                Submit code to produce JSDoc/Sphinx style parameter charts, return contracts, and architecture guides.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

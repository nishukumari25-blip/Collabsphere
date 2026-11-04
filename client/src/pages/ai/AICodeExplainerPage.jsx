import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Code2,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  FileCode
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';
import { useProject } from '../../context/ProjectContext';

export const AICodeExplainerPage = () => {
  const location = useLocation();
  const toast = useToast();
  const { currentProject } = useProject();

  const [code, setCode] = useState(
    location.state?.code ||
`function calculateFibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = calculateFibonacci(n - 1, memo) + calculateFibonacci(n - 2, memo);
  return memo[n];
}`
  );
  const [language, setLanguage] = useState(location.state?.language || 'javascript');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // If code was passed from file preview, execute analysis automatically
  useEffect(() => {
    if (location.state?.code && !result) {
      handleExplain();
    }
  }, []);

  const handleExplain = async () => {
    if (!code.trim()) {
      toast.warning('Please enter some code to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await geminiService.explainCode({
        code,
        language,
        projectId: currentProject?._id || location.state?.projectId
      });
      if (res.success && res.result) {
        setResult(res.result);
        toast.success('Code analysis completed by Gemini AI');
      }
    } catch (err) {
      setError(err.message || 'Gemini service encountered an error');
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Explanation copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Code Explainer</h1>
          <p className="page-subtitle">
            Deep algorithmic walkthrough, bug detection, and refactoring insights powered by Gemini.
          </p>
        </div>
      </div>

      <div className="ai-tool-grid">
        {/* Left: Input Code Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code2 size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Source Code</span>
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="typescript">TypeScript</option>
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
            placeholder="// Paste code to explain..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button
            onClick={handleExplain}
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <Sparkles size={16} />
            <span>{loading ? 'Gemini Analyzing Code...' : 'Explain Code with Gemini'}</span>
          </button>
        </div>

        {/* Right: Output Explanation Panel */}
        <div className="card" style={{ padding: '1.5rem', minHeight: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#7c3aed" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Explanation & Insights</span>
            </div>

            {result && (
              <button onClick={handleCopyResult} className="btn btn-secondary btn-sm">
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
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
              <div
                className="skeleton"
                style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 1.5rem' }}
              />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Analyzing logic and architecture...
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Streaming response directly from Google GenAI SDK.
              </p>
            </div>
          ) : result ? (
            <div className="markdown-body" style={{ maxHeight: '650px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : !error ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              <Sparkles size={40} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>
                Click <strong>"Explain Code with Gemini"</strong> to receive an in-depth breakdown of functions, logic steps, and edge cases.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Sparkles,
  FileCode,
  CheckSquare,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const DEFAULT_SNIPPETS = {
  javascript: `// Distributed In-Memory Cache with TTL & Eviction
class CacheStore {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.store = new Map();
  }

  set(key, value, ttlMs = 60000) {
    if (this.store.size >= this.capacity) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
}`,
  python: `# Binary Search Tree with In-Order Traversal
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traversal(root):
    result = []
    def traverse(node):
        if not node:
            return
        traverse(node.left)
        result.append(node.val)
        traverse(node.right)
    traverse(root)
    return result`,
  html: `<!-- Modern Developer Collaboration Card -->
<div class="collab-card">
  <div class="header">
    <span class="badge">Gemini 2.5 Active</span>
    <h3>Distributed Pipeline</h3>
  </div>
  <p>Real-time telemetry and state replication stream.</p>
</div>`
};

export const CodeSnippetEditorPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.javascript);
  const [copied, setCopied] = useState(false);

  const handleLanguageChange = (e) => {
    const nextLang = e.target.value;
    setLanguage(nextLang);
    if (DEFAULT_SNIPPETS[nextLang]) {
      setCode(DEFAULT_SNIPPETS[nextLang]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (tool) => {
    if (!code.trim()) {
      toast.warning('Please enter some code first');
      return;
    }

    if (tool === 'explain') {
      navigate('/ai/explain', { state: { code, language } });
    } else if (tool === 'docs') {
      navigate('/ai/docs', { state: { code, language } });
    } else if (tool === 'review') {
      navigate('/ai/review', { state: { code, language } });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Code Snippet Studio</h1>
          <p className="page-subtitle">
            Write or paste source code snippets and pipe them instantly into Gemini AI analysis tools.
          </p>
        </div>

        <div className="page-actions">
          <button onClick={handleCopy} className="btn btn-secondary btn-sm">
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Language:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript / Node.js</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          {/* AI Action Triggers */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleAction('explain')}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--primary-border)' }}
            >
              <Sparkles size={14} color="var(--primary)" />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Explain with Gemini</span>
            </button>

            <button
              onClick={() => handleAction('docs')}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--primary-border)' }}
            >
              <FileCode size={14} color="var(--primary)" />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Generate Docs</span>
            </button>

            <button
              onClick={() => handleAction('review')}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--primary-border)' }}
            >
              <CheckSquare size={14} color="var(--primary)" />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Review Code</span>
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <textarea
          rows={20}
          className="form-textarea"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            backgroundColor: 'var(--bg-code)',
            color: '#e6edf3',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem'
          }}
          placeholder="// Paste or write your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
    </div>
  );
};

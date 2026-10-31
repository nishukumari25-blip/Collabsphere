import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Code2,
  FileText,
  Users,
  ShieldCheck,
  BarChart3,
  Share2,
  ArrowRight,
  Terminal,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ flex: 1 }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '6rem 2rem 5rem',
          textAlign: 'center',
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.75rem',
            border: '1px solid var(--primary-border)'
          }}
        >
          <Sparkles size={16} />
          <span>Next-Generation Intelligent Developer Collaboration</span>
        </div>

        <h1
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.035em',
            color: 'var(--text-main)',
            marginBottom: '1.5rem'
          }}
        >
          Build Faster, Document Smarter, <br />
          <span style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Powered by Google Gemini AI.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.25rem',
            color: 'var(--text-muted)',
            maxWidth: '750px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6
          }}
        >
          CollabSphere unites code snippets, rich Markdown documentation, secure file storage,
          role-based team collaboration, and Gemini 2.5 AI tools into a single developer platform.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <NavLink to="/dashboard" className="btn btn-primary btn-lg">
              <span>Open Dashboard</span>
              <ArrowRight size={18} />
            </NavLink>
          ) : (
            <>
              <NavLink to="/register" className="btn btn-primary btn-lg">
                <span>Start Collaborating Free</span>
                <ArrowRight size={18} />
              </NavLink>
              <NavLink to="/login" className="btn btn-secondary btn-lg">
                Sign In to Account
              </NavLink>
            </>
          )}
        </div>

        {/* Hero Code Preview Window */}
        <div
          style={{
            marginTop: '4rem',
            backgroundColor: 'var(--bg-code)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            textAlign: 'left'
          }}
        >
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#161b22'
            }}
          >
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
            <span style={{ fontSize: '0.8rem', color: '#8b949e', marginLeft: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              collabsphere-core.js — Gemini AI Explainer Active
            </span>
          </div>
          <div style={{ padding: '1.75rem', color: '#c9d1d9', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            <p><span style={{ color: '#ff7b72' }}>import</span> &#123; GoogleGenAI &#125; <span style={{ color: '#ff7b72' }}>from</span> <span style={{ color: '#a5d6ff' }}>'@google/genai'</span>;</p>
            <p><span style={{ color: '#ff7b72' }}>export async function</span> <span style={{ color: '#d2a8ff' }}>analyzeArchitecture</span>(code) &#123;</p>
            <p style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#8b949e' }}>// Gemini 2.5 identifies potential bugs and generates technical documentation</span></p>
            <p style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#ff7b72' }}>const</span> ai = <span style={{ color: '#ff7b72' }}>new</span> <span style={{ color: '#79c0ff' }}>GoogleGenAI</span>(&#123; apiKey: process.env.GEMINI_API_KEY &#125;);</p>
            <p style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#ff7b72' }}>return await</span> ai.models.<span style={{ color: '#d2a8ff' }}>generateContent</span>(&#123; model: <span style={{ color: '#a5d6ff' }}>'gemini-2.5-flash'</span>, contents: code &#125;);</p>
            <p>&#125;</p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ backgroundColor: 'white', padding: '5rem 2rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Everything Modern Engineering Teams Need
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.5rem' }}>
              Designed with the rigor of GitHub and the flexibility of modern developer workspaces.
            </p>
          </div>

          <div className="grid-3">
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Sparkles size={24} />
              </div>
              <h3 className="card-title">Gemini AI Studio</h3>
              <p className="card-subtitle" style={{ lineHeight: 1.6 }}>
                Real backend integration with Google GenAI. Explain code step-by-step, generate technical documentation, audit security vulnerabilities, and craft README.md in seconds.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <FileText size={24} />
              </div>
              <h3 className="card-title">Markdown Knowledge Base</h3>
              <p className="card-subtitle" style={{ lineHeight: 1.6 }}>
                Full CRUD notes with live markdown preview, categories, tags, search indexing, and one-click AI improvement to polish grammar and technical structure.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Users size={24} />
              </div>
              <h3 className="card-title">Role-Based Team Control</h3>
              <p className="card-subtitle" style={{ lineHeight: 1.6 }}>
                Enforce strict OWNER, ADMIN, MEMBER, and VIEWER authorization at the backend level. Invite members by email or username with live activity notifications.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 className="card-title">Secure File Management</h3>
              <p className="card-subtitle" style={{ lineHeight: 1.6 }}>
                Authenticated storage outside public web roots. Preview code, images, and text files safely in-browser with zero path-traversal vulnerabilities.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <BarChart3 size={24} />
              </div>
              <h3 className="card-title">Contribution Analytics</h3>
              <p className="card-subtitle" style={{ lineHeight: 1.6 }}>
                Real database aggregation tracking member contributions, daily activity cadence, storage consumption, and note distributions. No fake stats.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Share2 size={24} />
              </div>
              <h3 className="card-title">Public Read-Only Sharing</h3>
              <p className="card-subtitle" style={{ lineHeight: 1.6 }}>
                Generate unguessable share tokens to showcase project documentation and README to stakeholders without exposing private emails or source files.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

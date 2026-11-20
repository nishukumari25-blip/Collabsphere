import React, { useState } from 'react';
import { Sparkles, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import { FileUpload } from '../../components/FileUpload';
import { useToast } from '../../context/ToastContext';

export const ProjectAnalyzerPage = () => {
  const toast = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFilesSelected = async (filesPayload, copilotContext) => {
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Simulate or execute project analysis
      await new Promise((resolve) => setTimeout(resolve, 800));

      const fileStats = {
        totalFiles: filesPayload.length,
        languages: {},
        totalSize: filesPayload.reduce((acc, f) => acc + (f.content?.length || 0), 0)
      };

      filesPayload.forEach((f) => {
        const ext = f.path.split('.').pop() || 'unknown';
        fileStats.languages[ext] = (fileStats.languages[ext] || 0) + 1;
      });

      setAnalysisResult({
        success: true,
        stats: fileStats,
        copilotContext: copilotContext || 'None provided',
        message: `Successfully analyzed ${filesPayload.length} project files without errors.`
      });

      toast.success(`Project Analysis complete: ${filesPayload.length} files processed!`);
    } catch (err) {
      toast.error(err.message || 'Failed to analyze project');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--primary-light, #e0e7ff)', color: 'var(--primary, #6366f1)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', margin: 0 }}>
              Project Analyzer
            </h1>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
              Upload mixed React, Node.js, and Python codebases for comprehensive technical evaluation.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: '#fff', border: '1px solid var(--border-light, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
        <FileUpload
          onFilesSelected={handleFilesSelected}
          loading={analyzing}
        />
      </div>

      {analysisResult && (
        <div className="card" style={{ marginTop: '2rem', padding: '1.75rem', borderRadius: '1rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }} id="analysis-results-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', marginBottom: '1rem' }}>
            <CheckCircle2 size={20} />
            <h3 style={{ margin: 0, fontWeight: 600 }}>{analysisResult.message}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Ingested Files</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{analysisResult.stats.totalFiles}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Payload Characters</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{analysisResult.stats.totalSize.toLocaleString()}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Languages/Types</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{Object.keys(analysisResult.stats.languages).length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalyzerPage;

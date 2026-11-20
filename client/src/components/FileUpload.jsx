import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  FolderUp,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * Checks if a file or directory should be excluded based on its path.
 * - Ignores common version control, dependency, and system folders.
 * - Ignores build output directories (dist, build, out, .next).
 * - Ignores files and folders starting with a dot ('.').
 * @param {string} path - The full path of the file or directory.
 * @returns {boolean} - True if the path should be excluded.
 */
export const shouldExcludePath = (path) => {
  if (!path) return false;

  const IGNORED_DIRS = new Set([
    ".git",
    "node_modules",
    ".svn",
    "__pycache__",
    ".idea",
    ".vscode",
    "dist",
    "build",
    ".next",
    "out",
    "coverage",
  ]);
  const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
  const ALLOWED_HIDDEN_FILES = new Set([".env", ".gitignore"]);

  const segments = path.split("/");

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i < segments.length - 1) {
      if (IGNORED_DIRS.has(segment) || segment.startsWith(".")) {
        return true;
      }
    } else {
      if (IGNORED_FILES.has(segment)) {
        return true;
      }
      if (segment.startsWith(".") && !ALLOWED_HIDDEN_FILES.has(segment)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Helper to determine if a File object represents a hidden or excluded file.
 * @param {File} file 
 * @returns {boolean}
 */
export const isHiddenFile = (file) => {
  const path = file.webkitRelativePath || file.name;
  return shouldExcludePath(path);
};

export const FileUpload = ({
  onFilesSelected,
  onRubricUpload,
  onFormSubmit,
  selectedPhase,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [skippedFiles, setSkippedFiles] = useState({});
  const [errors, setErrors] = useState([]);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);
  const [copilotContext, setCopilotContext] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // File size limit (5MB)
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // Accepted source and text file types (including Python and SVG)
  const ACCEPTED_FILES = {
    "text/javascript": [".js", ".jsx", ".ts", ".tsx"],
    "text/html": [".html", ".htm"],
    "text/css": [".css"],
    "application/json": [".json"],
    "text/plain": [".txt", ".md", ".env", ".gitignore", ".sql", ".sh", ".yaml", ".yml"],
    "text/x-python": [".py"],
    "image/svg+xml": [".svg"],
  };

  // Binary image formats that should be safely skipped without triggering red errors
  const SKIPPED_BINARY_EXTENSIONS = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".ico",
    ".bmp",
    ".tiff",
  ]);

  // Helper to check if a file type is accepted for text/code analysis
  const isFileTypeAccepted = (file) => {
    const fileType = file.type;
    const fileName = file.name;
    const ext = "." + fileName.split(".").pop().toLowerCase();

    // 1. Direct extension match
    const isExtensionAccepted = Object.values(ACCEPTED_FILES).some((exts) =>
      exts.includes(ext)
    );
    if (isExtensionAccepted) return true;

    // 2. MIME type check
    if (fileType) {
      if (fileType === "image/svg+xml" && ext === ".svg") return true;
      if (fileType.includes("python") && ext === ".py") return true;
      return Object.keys(ACCEPTED_FILES).some((acceptedType) => {
        if (fileType === acceptedType) return true;
        if (acceptedType.endsWith("/*")) {
          return fileType.startsWith(acceptedType.slice(0, -1));
        }
        return false;
      });
    }

    return false;
  };

  // Helper to check if file is an unsupported binary image that should be skipped cleanly
  const isSkippedBinaryFile = (file) => {
    const fileName = file.name;
    const ext = "." + fileName.split(".").pop().toLowerCase();
    if (SKIPPED_BINARY_EXTENSIONS.has(ext)) return true;
    if (file.type && file.type.startsWith("image/") && ext !== ".svg") return true;
    return false;
  };

  /**
   * Processes a list of File or Entry objects with deduplication and safe binary skipping.
   */
  const processFiles = useCallback(async (files) => {
    const newFiles = {};
    const newSkipped = {};
    const newErrors = [];

    // Track paths already processed to prevent duplicate processing
    const seenPaths = new Set(Object.keys(uploadedFiles));

    // Recursive directory reader for drag-and-drop webkit entries
    const readDirectory = async (entry) => {
      const reader = entry.createReader();
      let entries = [];
      let readEntries = await new Promise((resolve) =>
        reader.readEntries(resolve)
      );
      while (readEntries.length > 0) {
        entries = entries.concat(readEntries);
        readEntries = await new Promise((resolve) =>
          reader.readEntries(resolve)
        );
      }
      return entries;
    };

    // Recursive traversal for FileSystemEntry
    const traverseEntry = async (entry) => {
      const path = entry.fullPath.startsWith("/")
        ? entry.fullPath.substring(1)
        : entry.fullPath;

      if (shouldExcludePath(path)) {
        return;
      }

      if (entry.isFile) {
        if (seenPaths.has(path) || newFiles[path] || newSkipped[path]) {
          return; // Duplicate path skipped
        }

        const file = await new Promise((resolve) => entry.file(resolve));

        // 1. Size check
        if (file.size > MAX_SIZE_BYTES) {
          newErrors.push({
            fileName: file.name,
            path,
            errors: `File is larger than ${MAX_SIZE_MB}MB`,
          });
          return;
        }

        // 2. Binary image safe skip (PNG, JPG, WEBP, GIF, ICO)
        if (isSkippedBinaryFile(file)) {
          newSkipped[path] = {
            name: file.name,
            path,
            size: file.size,
            reason: "Binary asset (skipped for code analysis)",
          };
          seenPaths.add(path);
          return;
        }

        // 3. Supported text / code check (JS, JSX, TS, TSX, HTML, CSS, JSON, PY, SVG, MD, etc.)
        if (!isFileTypeAccepted(file)) {
          newErrors.push({
            fileName: file.name,
            path,
            errors: "File type not supported",
          });
          return;
        }

        // 4. Ingest readable source code / text / XML
        try {
          const content = await file.text();
          newFiles[path] = {
            path,
            content,
            size: file.size,
          };
          seenPaths.add(path);
        } catch (readErr) {
          newErrors.push({
            fileName: file.name,
            path,
            errors: `Failed to read file: ${readErr.message}`,
          });
        }
      } else if (entry.isDirectory) {
        const entries = await readDirectory(entry);
        for (const subEntry of entries) {
          await traverseEntry(subEntry);
        }
      }
    };

    // Handle input items (File objects or FileSystemEntries)
    for (const item of files) {
      const entry = item.getAsEntry
        ? item.getAsEntry()
        : item.webkitGetAsEntry
        ? item.webkitGetAsEntry()
        : null;

      if (entry) {
        await traverseEntry(entry);
      } else if (item instanceof File) {
        if (isHiddenFile(item)) {
          continue;
        }

        const path = item.webkitRelativePath || item.name;
        if (seenPaths.has(path) || newFiles[path] || newSkipped[path]) {
          continue; // Duplicate path skipped
        }

        // 1. Size check
        if (item.size > MAX_SIZE_BYTES) {
          newErrors.push({
            fileName: item.name,
            path,
            errors: `File is larger than ${MAX_SIZE_MB}MB`,
          });
          continue;
        }

        // 2. Binary images safe skip
        if (isSkippedBinaryFile(item)) {
          newSkipped[path] = {
            name: item.name,
            path,
            size: item.size,
            reason: "Binary asset (skipped for code analysis)",
          };
          seenPaths.add(path);
          continue;
        }

        // 3. Supported check
        if (!isFileTypeAccepted(item)) {
          newErrors.push({
            fileName: item.name,
            path,
            errors: "File type not supported",
          });
          continue;
        }

        // 4. Ingest readable content
        try {
          const content = await item.text();
          newFiles[path] = {
            path,
            content,
            size: item.size,
          };
          seenPaths.add(path);
        } catch (readErr) {
          newErrors.push({
            fileName: item.name,
            path,
            errors: `Failed to read file: ${readErr.message}`,
          });
        }
      }
    }

    // Deduplicate errors by path/fileName
    setErrors((prev) => {
      const existingKeys = new Set(prev.map((e) => e.path || e.fileName));
      const filteredNew = newErrors.filter(
        (e) => !existingKeys.has(e.path || e.fileName)
      );
      return [...prev, ...filteredNew];
    });

    setSkippedFiles((prev) => ({ ...prev, ...newSkipped }));
    setUploadedFiles((prev) => ({ ...prev, ...newFiles }));
  }, [uploadedFiles]);

  // Native HTML5 Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      processFiles(Array.from(e.dataTransfer.items));
    } else if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target && e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
      e.target.value = null;
    }
  };

  const handleFolderSelect = (e) => {
    if (e.target && e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
      e.target.value = null;
    }
  };

  const removeFile = (filePath) => {
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[filePath];
      return updated;
    });
  };

  const handleAnalyze = () => {
    const hasFiles = Object.keys(uploadedFiles).length > 0;
    const hasContext = copilotContext.trim().length > 0;

    if (hasFiles || hasContext) {
      const filesPayload = Object.values(uploadedFiles).map(
        ({ path, content }) => ({
          path,
          content,
        })
      );
      if (typeof onFilesSelected === "function") {
        onFilesSelected(filesPayload, copilotContext.trim() || null);
      }
    }
  };

  const canAnalyze = () => {
    return (
      Object.keys(uploadedFiles).length > 0 || copilotContext.trim().length > 0
    );
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "py":
        return "🐍";
      case "svg":
        return "🎨";
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return "🟨";
      case "html":
      case "htm":
        return "🟧";
      case "css":
        return "🟦";
      case "json":
        return "🟫";
      case "md":
        return "📝";
      default:
        return "📄";
    }
  };

  const totalAnalyzed = Object.keys(uploadedFiles).length;
  const totalSkipped = Object.keys(skippedFiles).length;

  return (
    <div className="space-y-6 project-analyzer-uploader" id="project-analyzer-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)', display: 'flex', gap: '2rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          disabled={loading}
          style={{
            padding: '0.75rem 0.25rem',
            borderBottom: activeTab === "upload" ? '2px solid var(--primary, #6366f1)' : '2px solid transparent',
            color: activeTab === "upload" ? 'var(--primary, #6366f1)' : 'var(--text-muted, #64748b)',
            fontWeight: activeTab === "upload" ? 600 : 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
          id="tab-upload-project"
        >
          <Upload size={16} />
          <span>Upload Project</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("paste")}
          disabled={loading}
          style={{
            padding: '0.75rem 0.25rem',
            borderBottom: activeTab === "paste" ? '2px solid var(--primary, #6366f1)' : '2px solid transparent',
            color: activeTab === "paste" ? 'var(--primary, #6366f1)' : 'var(--text-muted, #64748b)',
            fontWeight: activeTab === "paste" ? 600 : 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
          id="tab-paste-context"
        >
          <FileText size={16} />
          <span>Paste Context</span>
        </button>
      </div>

      {/* Tab 1: Upload */}
      {activeTab === "upload" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              position: 'relative',
              border: isDragActive ? '2px dashed var(--primary, #6366f1)' : '2px dashed var(--border-medium, #cbd5e1)',
              backgroundColor: isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--card-bg, #ffffff)',
              borderRadius: '0.75rem',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.5 : 1,
              pointerEvents: loading ? 'none' : 'auto'
            }}
            id="analyzer-dropzone"
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-input-files"
            />
            <input
              type="file"
              webkitdirectory=""
              ref={folderInputRef}
              onChange={handleFolderSelect}
              style={{ display: 'none' }}
              id="file-input-folder"
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FolderUp size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                  {isDragActive ? "Drop project folder or files here" : "Drag & Drop Files and Folders"}
                </h3>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                  Supports JavaScript, TypeScript, React, Python, HTML/CSS, JSON, Markdown, and SVG.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="btn btn-secondary"
                    id="btn-select-files"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-medium, #cbd5e1)',
                      backgroundColor: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={16} />
                    <span>Select Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={loading}
                    className="btn btn-secondary"
                    id="btn-select-folder"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-medium, #cbd5e1)',
                      backgroundColor: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    <FolderUp size={16} />
                    <span>Select Folder</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Ingestion Summary Bar (Analyzed vs Skipped) */}
          {(totalAnalyzed > 0 || totalSkipped > 0) && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-light, #e2e8f0)',
                borderRadius: '0.75rem',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
              id="analyzer-summary-bar"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#065f46',
                    backgroundColor: '#ecfdf5',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #a7f3d0'
                  }}
                  id="summary-analyzed-badge"
                >
                  <CheckCircle size={16} color="#059669" />
                  <span>{totalAnalyzed} code files analyzed</span>
                </div>

                {totalSkipped > 0 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#475569',
                      backgroundColor: '#ffffff',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #cbd5e1'
                    }}
                    id="summary-skipped-badge"
                  >
                    <Info size={16} color="#64748b" />
                    <span>{totalSkipped} binary assets skipped</span>
                  </div>
                )}
              </div>

              {totalSkipped > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSkippedDetails((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary, #6366f1)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: 0
                  }}
                  id="toggle-skipped-details"
                >
                  <span>{showSkippedDetails ? "Hide skipped details" : "View skipped details"}</span>
                  {showSkippedDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          )}

          {/* Skipped Details Collapsible */}
          {showSkippedDetails && totalSkipped > 0 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light, #e2e8f0)',
                borderRadius: '0.75rem',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
              id="skipped-files-container"
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skipped Binary Assets (Non-Code Files Safely Ignored):
              </p>
              <div style={{ maxHeight: '12rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {Object.values(skippedFiles).map((item) => (
                  <div
                    key={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.6rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.375rem',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#334155' }} title={item.path}>
                      {item.path}
                    </span>
                    <span style={{ color: '#94a3b8', flexShrink: 0, marginLeft: '0.5rem' }}>
                      {(item.size / 1024).toFixed(1)} KB (skipped)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Files List */}
          {totalAnalyzed > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} id="uploaded-files-container">
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                Analyzed Files ({totalAnalyzed})
              </h4>
              <div style={{ maxHeight: '16rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} id="uploaded-files-list">
                {Object.values(uploadedFiles).map((file) => (
                  <div
                    key={file.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#fff',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                        {getFileIcon(file.path)}
                      </span>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main, #0f172a)', margin: 0 }} title={file.path}>
                          {file.path}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', margin: '0.15rem 0 0 0' }}>
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.path)}
                      disabled={loading}
                      title="Remove file"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted, #94a3b8)',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Paste Copilot Context */}
      {activeTab === "paste" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main, #0f172a)' }}>
              Copilot Generated Context
            </label>
            <textarea
              value={copilotContext}
              onChange={(e) => setCopilotContext(e.target.value)}
              placeholder="Paste copilot-generated context here..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-medium, #cbd5e1)',
                borderRadius: '0.5rem',
                resize: 'vertical',
                minHeight: '260px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem'
              }}
              disabled={loading}
              id="copilot-context-textarea"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              Paste any context generated by GitHub Copilot to enhance project analysis.
            </p>
          </div>
        </div>
      )}

      {/* Real Blocking Errors (Only show genuine errors, NOT skipped binary assets) */}
      {errors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} id="errors-container">
          {errors.map((error, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #fecaca',
                fontSize: '0.875rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>
                <strong>{error.fileName}:</strong> {error.errors}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Submission Action Button */}
      {canAnalyze() && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '0.5rem',
              color: '#ffffff',
              backgroundColor: 'var(--primary, #6366f1)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))'
            }}
            id="btn-analyze-project-submit"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Analyzing Project...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Analyze Project</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

import { useEffect, useMemo, useRef, useState } from "react";
import { documents, subjects } from "./data.js";

const Icon = ({ name, size = 20 }) => {
  const icons = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.3M8.7 13.3l6.6 4.3" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

function App() {
  const [activePage, setActivePage] = useState("Library");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [saved, setSaved] = useState([]);
  const [comments, setComments] = useState({
    1: [{ id: 1, author: "Rachel A.", text: "Very clear examples. This helped me prepare for my practical.", time: "2 hours ago" }]
  });
  const [commentText, setCommentText] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [toast, setToast] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const handleKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSelectedDocument(null);
        setShowLogin(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesSubject = subject === "All Subjects" || document.subject === subject;
      const matchesQuery = !normalized || [document.title, document.course, document.subject, document.author, document.type].join(" ").toLowerCase().includes(normalized);
      return matchesSubject && matchesQuery;
    });
  }, [query, subject]);

  const toggleSaved = (id) => {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const addComment = (event) => {
    event.preventDefault();
    if (!loggedIn) {
      setShowLogin(true);
      return;
    }
    const text = commentText.trim();
    if (!text || !selectedDocument) return;
    setComments((current) => ({
      ...current,
      [selectedDocument.id]: [...(current[selectedDocument.id] || []), { id: Date.now(), author: "You", text, time: "Just now" }]
    }));
    setCommentText("");
  };

  const shareDocument = async (document) => {
    const url = `${window.location.origin}/document/${document.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied");
    } catch {
      setShareMessage(url);
    }
  };

  const downloadDocument = (document) => setToast(`${document.title} download started`);
  const visibleDocuments = activePage === "Saved" ? filteredDocuments.filter((document) => saved.includes(document.id)) : filteredDocuments;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActivePage("Library")} aria-label="Go to library">
          <span className="brand-mark"><span>Z</span></span><span className="brand-name">Zmotto</span>
        </button>
        <nav className={`nav ${mobileMenu ? "nav-open" : ""}`}>
          {["Library", "Saved", "Upload"].map((item) => (
            <button key={item} className={activePage === item ? "nav-item active" : "nav-item"} onClick={() => { setActivePage(item); setMobileMenu(false); }}>{item}</button>
          ))}
        </nav>
        <div className="topbar-actions">
          <button className="icon-button" aria-label="Notifications"><Icon name="bell" size={19} /><span className="notification-dot" /></button>
          {loggedIn ? <button className="avatar" title="Sign out" onClick={() => setLoggedIn(false)} aria-label="Sign out">MO</button> : <button className="login-button" onClick={() => setShowLogin(true)}>Sign in</button>}
          <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileMenu((value) => !value)}><Icon name="menu" /></button>
        </div>
      </header>

      {activePage === "Upload" ? (
        <main className="page-content"><UploadPage onUploaded={() => { setActivePage("Library"); setToast("Document uploaded successfully"); }} /></main>
      ) : (
        <main className="page-content">
          <section className="hero">
            <div><p className="eyebrow">UNIVERSITY DIGITAL LIBRARY</p><h1>What would you like<br />to learn today?</h1></div>
            <div className="search-panel">
              <div className="search-box"><Icon name="search" size={21} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books, notes, courses..." aria-label="Search library" /><kbd>⌘ K</kbd></div>
              <div className="filters">
                <label><span>Subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Format</span><select defaultValue="All formats"><option>All formats</option><option>PDF</option><option>DOC</option><option>DOCX</option></select></label>
              </div>
            </div>
          </section>
          <section className="library-section">
            <div className="section-heading"><div><p className="section-kicker">{activePage === "Saved" ? "YOUR COLLECTION" : "EXPLORE"}</p><h2>{activePage === "Saved" ? "Saved materials" : "Recommended for you"}</h2></div><span className="result-count">{visibleDocuments.length} {visibleDocuments.length === 1 ? "material" : "materials"}</span></div>
            {visibleDocuments.length ? (
              <div className="document-grid">
                {visibleDocuments.map((document) => (
                  <article className="document-card" key={document.id}>
                    <button className="document-cover" style={{ "--cover": document.color }} onClick={() => setSelectedDocument(document)} aria-label={`Open ${document.title}`}>
                      <span className="cover-type">{document.type}</span><div className="cover-content"><span className="cover-university">UNIVERSITY LIBRARY</span><strong>{document.title}</strong><span className="cover-author">{document.author}</span></div><span className="cover-mark">Z</span>
                    </button>
                    <div className="document-info"><div><p className="document-course">{document.course}</p><button className="document-title" onClick={() => setSelectedDocument(document)}>{document.title}</button><p className="document-author">by {document.author}</p></div><button className={saved.includes(document.id) ? "save-button saved" : "save-button"} onClick={() => toggleSaved(document.id)} aria-label={saved.includes(document.id) ? "Remove from saved" : "Save document"}><Icon name="bookmark" size={18} /></button></div>
                    <div className="document-meta"><span>{document.type}</span><span>{document.size}</span><span>{document.pages} pages</span></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon"><Icon name="bookmark" size={28} /></div><h3>{activePage === "Saved" ? "No saved materials yet" : "No materials found"}</h3><p>{activePage === "Saved" ? "Save documents to build your personal reading list." : "Try changing your search or subject filter."}</p>{activePage === "Saved" && <button className="primary-button" onClick={() => setActivePage("Library")}>Explore library</button>}</div>
            )}
          </section>
        </main>
      )}

      {selectedDocument && <DocumentModal document={selectedDocument} comments={comments[selectedDocument.id] || []} commentText={commentText} setCommentText={setCommentText} onClose={() => { setSelectedDocument(null); setShareMessage(""); }} onComment={addComment} onShare={() => shareDocument(selectedDocument)} onDownload={() => downloadDocument(selectedDocument)} shareMessage={shareMessage} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={() => { setLoggedIn(true); setShowLogin(false); setToast("Welcome to Zmotto"); }} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function DocumentModal({ document, comments, commentText, setCommentText, onClose, onComment, onShare, onDownload, shareMessage }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="document-modal" role="dialog" aria-modal="true" aria-label={document.title} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="modal-preview"><div className="preview-cover" style={{ "--cover": document.color }}><span className="preview-type">{document.type}</span><div className="preview-text"><span>UNIVERSITY LIBRARY</span><strong>{document.title}</strong><small>{document.author}</small></div></div></div>
        <div className="modal-details">
          <p className="document-course">{document.course}</p><h2>{document.title}</h2><p className="modal-author">by {document.author}</p><p className="modal-description">{document.description}</p>
          <div className="modal-meta-grid"><div><span>FORMAT</span><strong>{document.type}</strong></div><div><span>SIZE</span><strong>{document.size}</strong></div><div><span>UPLOADED</span><strong>{document.date}</strong></div></div>
          <div className="modal-actions"><button className="primary-button" onClick={onDownload}><Icon name="download" size={18} />Download</button><button className="secondary-button" onClick={onShare}><Icon name="share" size={18} />{shareMessage || "Share"}</button></div>
          <div className="comments"><h3>Discussion <span>{comments.length}</span></h3>
            {comments.map((comment) => <div className="comment" key={comment.id}><div className="comment-avatar">{comment.author.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><div className="comment-header"><strong>{comment.author}</strong><span>{comment.time}</span></div><p>{comment.text}</p></div></div>)}
            <form className="comment-form" onSubmit={onComment}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add to the discussion..." aria-label="Comment" /><button type="submit">Post</button></form>
          </div>
        </div>
      </section>
    </div>
  );
}

function LoginModal({ onClose, onLogin }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="login-modal" role="dialog" aria-modal="true" aria-label="Sign in" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="login-brand"><span className="brand-mark"><span>Z</span></span></div><p className="eyebrow">ZMOTTO DIGITAL LIBRARY</p><h2>Welcome back</h2><p className="login-subtitle">Sign in with your university student account.</p>
        <form onSubmit={(event) => { event.preventDefault(); onLogin(); }} className="login-form">
          <label>Student ID<input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="e.g. CS/2025/012" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
          <button className="primary-button" type="submit">Sign in</button>
        </form>
        <p className="demo-note">Demo mode: any student ID and password will sign you in.</p>
      </section>
    </div>
  );
}

function UploadPage({ onUploaded }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Computer Science");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const selectFile = (file) => { if (file) setFileName(file.name); };
  const submit = (event) => { event.preventDefault(); if (!title || !course || !fileName) return; onUploaded(); };
  return (
    <section className="upload-page">
      <div className="upload-heading"><p className="section-kicker">LIBRARY ADMINISTRATION</p><h1>Upload a document</h1><p>Add learning materials to the Zmotto library.</p></div>
      <form className="upload-layout" onSubmit={submit}>
        <div className={dragging ? "dropzone dragging" : "dropzone"} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}>
          <div className="dropzone-icon"><Icon name="upload" size={28} /></div>{fileName ? <><h3>{fileName}</h3><p>File ready to upload</p></> : <><h3>Drop a document here</h3><p>PDF, DOC, DOCX or PPT up to 25 MB</p></>}
          <label className="secondary-button file-button">Choose file<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(event) => selectFile(event.target.files[0])} /></label>
        </div>
        <div className="upload-form">
          <label>Document title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Introduction to Networks" required /></label>
          <div className="form-row"><label>Subject<select value={subject} onChange={(event) => setSubject(event.target.value)}>{subjects.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>Course code<input value={course} onChange={(event) => setCourse(event.target.value)} placeholder="e.g. CS 220" required /></label></div>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Briefly describe this document..." rows="5" /></label>
          <button className="primary-button" type="submit"><Icon name="upload" size={18} />Upload document</button>
        </div>
      </form>
    </section>
  );
}

export default App;

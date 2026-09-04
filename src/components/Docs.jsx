import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { docsRegistry } from '../docs/index.js';
import * as LucideIcons from 'lucide-react';
import '../style/Docs.css';

// A helper to safely render a dynamic icon from lucide-react
const DynamicIcon = ({ name, size = 18 }) => {
  const IconComponent = LucideIcons[name];
  return IconComponent ? <IconComponent size={size} /> : <LucideIcons.FileText size={size} />;
};

function Docs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docId = searchParams.get('doc') || 'getting-started';
  
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => {
    const doc = docsRegistry.find(d => d.id === docId);
    if (doc) {
      setActiveDoc(doc);
    } else {
      setActiveDoc(docsRegistry[0]);
    }
  }, [docId]);

  const handleNavClick = (id) => {
    navigate(`/docs?doc=${id}`);
  };

  return (
    <div className="docs-layout">
      {/* Sidebar Navigation */}
      <aside className="docs-sidebar">
        <div className="docs-sidebar-header">
          <h2>SYSTEM DOCS</h2>
          <p>OPERATOR MANUAL</p>
        </div>
        <nav className="docs-nav-list">
          {docsRegistry.map((doc) => (
            <button
              key={doc.id}
              className={`docs-nav-btn ${activeDoc?.id === doc.id ? 'active' : ''}`}
              onClick={() => handleNavClick(doc.id)}
            >
              <DynamicIcon name={doc.icon} />
              <span>{doc.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Markdown Content */}
      <main className="docs-main-content">
        {activeDoc ? (
          <div className="markdown-body">
            <Markdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw]}
              components={{
                blockquote({ node, children, ...props }) {
                  let alertType = null;
                  
                  const processChildren = (nodes) => {
                    return React.Children.map(nodes, child => {
                      if (typeof child === 'string') {
                        if (!alertType) {
                          const match = child.match(/^\s*\[!(TIP|WARNING|IMPORTANT|NOTE|CAUTION)\]/i);
                          if (match) {
                            alertType = match[1].toLowerCase();
                            return child.replace(match[0], '').replace(/^\s*<br\s*\/?>\s*/i, '').trimStart();
                          }
                        }
                        return child;
                      }
                      if (React.isValidElement(child)) {
                        return React.cloneElement(child, {}, processChildren(child.props.children));
                      }
                      return child;
                    });
                  };

                  const processedChildren = processChildren(children);

                  if (alertType) {
                     let icon = <LucideIcons.Info size={18} />;
                     let alertClass = "docs-alert-important";
                     
                     if (alertType === 'tip') {
                        icon = <LucideIcons.Lightbulb size={18} />;
                        alertClass = "docs-alert-tip";
                     } else if (alertType === 'warning' || alertType === 'caution') {
                        icon = <LucideIcons.AlertTriangle size={18} />;
                        alertClass = "docs-alert-warning";
                     }
                     
                     return (
                        <div className={`docs-alert ${alertClass}`}>
                           <div className="docs-alert-icon">{icon}</div>
                           <div className="docs-alert-content">{processedChildren}</div>
                        </div>
                     );
                  }
                  
                  return <blockquote {...props}>{children}</blockquote>;
                },
                code({node, inline, className, children, ...props}) {
                  return (
                    <code className={`${className} docs-code-block`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {activeDoc.content}
            </Markdown>
          </div>
        ) : (
          <div className="docs-loading">Loading documentation...</div>
        )}
      </main>
    </div>
  );
}

export default Docs;
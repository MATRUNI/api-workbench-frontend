import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { docsRegistry } from '../docs/index.js';
import { X, Menu, Info, Lightbulb, AlertCircle } from 'lucide-react';
import { DynamicIcon } from './utility_Components/DynamicIcon';
import '../style/Docs.css';

function Docs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docId = searchParams.get('doc') || 'getting-started';
  
  const [activeDoc, setActiveDoc] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="docs-layout">
      {/* Mobile Top Bar Toggle */}
      <div className="docs-mobile-header">
        <div className="docs-mobile-current">
          {activeDoc && <DynamicIcon name={activeDoc.icon} />}
          <span>{activeDoc ? activeDoc.title : 'Select Documentation'}</span>
        </div>
        <button 
          className="docs-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`docs-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeRaw, rehypeKatex]}
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
                     let icon = <Info size={18} />;
                     let alertClass = "docs-alert-important";
                     
                     if (alertType === 'tip') {
                        icon = <Lightbulb size={18} />;
                        alertClass = "docs-alert-tip";
                     } else if (alertType === 'warning') {
                        icon = <AlertCircle size={18} />;
                        alertClass = "docs-alert-warning";
                     } else if (alertType === 'caution') {
                        icon = <AlertCircle size={18} />;
                        alertClass = "docs-alert-caution";
                     }

                     const filterEmptyChildren = (nodes) => {
                       return React.Children.toArray(nodes).filter(child => {
                         if (typeof child === 'string') return child.trim().length > 0;
                         if (React.isValidElement(child) && child.type === 'p') {
                           const pChildren = React.Children.toArray(child.props.children);
                           if (pChildren.length === 0) return false;
                           if (pChildren.every(c => typeof c === 'string' && c.trim().length === 0)) return false;
                         }
                         return true;
                       });
                     };
                     
                     return (
                        <div className={`docs-alert ${alertClass}`}>
                           <div className="docs-alert-icon">{icon}</div>
                           <div className="docs-alert-content">{filterEmptyChildren(processedChildren)}</div>
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
                },
                table({node, children, ...props}) {
                  return (
                    <div className="docs-table-container">
                      <table {...props}>{children}</table>
                    </div>
                  );
                },
                a({node, href, children, ...props}) {
                  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
                  return (
                    <a 
                      href={href} 
                      target={isExternal ? '_blank' : undefined} 
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="docs-external-link"
                      {...props}
                    >
                      {children}
                    </a>
                  );
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
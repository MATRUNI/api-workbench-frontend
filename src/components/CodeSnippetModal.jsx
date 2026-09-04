import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code2, Copy, Check, Terminal } from 'lucide-react';
import { CustomDropdown } from './utility_Components/CustomDropdown';
import '../style/CodeSnippetModal.css';

const LANGUAGES = [
  { id: 'curl', name: 'cURL', monochrome: true, logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg' },
  { id: 'js-fetch', name: 'JavaScript (Fetch)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { id: 'python-requests', name: 'Python (Requests)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { id: 'go', name: 'Go (net/http)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg' },
  { id: 'java-okhttp', name: 'Java (OkHttp)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg' },
  { id: 'rust-reqwest', name: 'Rust (Reqwest)', monochrome: true, logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg' },
  { id: 'php-curl', name: 'PHP (cURL)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg' }
];

export default function CodeSnippetModal({ isOpen, onClose, requestData }) {
  const [activeLang, setActiveLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isOpen]);

  if (!isOpen) return null;

  const { url = '', method = 'GET', headers = [], query = [], body = '' } = requestData;

  // Process query params to construct full URL
  const validQueries = query.filter(q => q.key && q.key.trim() !== '');
  let fullUrl = url;
  if (validQueries.length > 0 && url) {
    try {
      const urlObj = new URL(url);
      validQueries.forEach(q => {
        urlObj.searchParams.append(q.key, q.value);
      });
      fullUrl = urlObj.toString();
    } catch (e) {
      // Fallback if URL is invalid
      const qs = validQueries.map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`).join('&');
      fullUrl = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
    }
  }

  const validHeaders = headers.filter(h => h.key && h.key.trim() !== '');

  const generators = {
    'curl': () => {
      let snippet = `curl -X ${method} "${fullUrl}" \\\n`;
      validHeaders.forEach(h => {
        snippet += `  -H "${h.key}: ${h.value}" \\\n`;
      });
      if (method !== 'GET' && body) {
        // Escape single quotes for bash
        const escapedBody = body.replace(/'/g, "'\\''");
        snippet += `  -d '${escapedBody}'`;
      }
      return snippet.trim().replace(/\\\n$/, '');
    },
    
    'js-fetch': () => {
      let snippet = `const headers = new Headers();\n`;
      validHeaders.forEach(h => {
        snippet += `headers.append("${h.key}", "${h.value}");\n`;
      });
      snippet += `\nconst requestOptions = {\n  method: '${method}',\n  headers: headers,\n`;
      if (method !== 'GET' && body) {
        snippet += `  body: JSON.stringify(${body.trim() || '""'}),\n`;
      }
      snippet += `  redirect: 'follow'\n};\n\n`;
      snippet += `fetch("${fullUrl}", requestOptions)\n  .then(response => response.text())\n  .then(result => console.log(result))\n  .catch(error => console.log('error', error));`;
      return snippet;
    },

    'python-requests': () => {
      let snippet = `import requests\nimport json\n\n`;
      snippet += `url = "${fullUrl}"\n\n`;
      if (method !== 'GET' && body) {
        snippet += `payload = json.dumps(${body.trim() || '""'})\n`;
      } else {
        snippet += `payload = {}\n`;
      }
      snippet += `headers = {\n`;
      validHeaders.forEach((h, i) => {
        const comma = i === validHeaders.length - 1 ? '' : ',';
        snippet += `  '${h.key}': '${h.value}'${comma}\n`;
      });
      snippet += `}\n\n`;
      snippet += `response = requests.request("${method}", url, headers=headers, data=payload)\n\nprint(response.text)`;
      return snippet;
    },

    'go': () => {
      let snippet = `package main\n\nimport (\n\t"fmt"\n\t"strings"\n\t"net/http"\n\t"io/ioutil"\n)\n\nfunc main() {\n\n`;
      snippet += `\turl := "${fullUrl}"\n\tmethod := "${method}"\n\n`;
      
      if (method !== 'GET' && body) {
        snippet += `\tpayload := strings.NewReader(\`${body.trim()}\`)\n\n`;
        snippet += `\tclient := &http.Client {}\n\treq, err := http.NewRequest(method, url, payload)\n`;
      } else {
        snippet += `\tclient := &http.Client {}\n\treq, err := http.NewRequest(method, url, nil)\n`;
      }
      
      snippet += `\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n`;
      validHeaders.forEach(h => {
        snippet += `\treq.Header.Add("${h.key}", "${h.value}")\n`;
      });
      snippet += `\n\tres, err := client.Do(req)\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n\tdefer res.Body.Close()\n\n\tbody, err := ioutil.ReadAll(res.Body)\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n\tfmt.Println(string(body))\n}`;
      return snippet;
    },

    'java-okhttp': () => {
      let snippet = `OkHttpClient client = new OkHttpClient().newBuilder()\n  .build();\n`;
      if (method !== 'GET' && body) {
        const contentType = validHeaders.find(h => h.key.toLowerCase() === 'content-type')?.value || 'application/json';
        const escapedBody = body.replace(/"/g, '\\"').replace(/\n/g, '');
        snippet += `MediaType mediaType = MediaType.parse("${contentType}");\n`;
        snippet += `RequestBody body = RequestBody.create(mediaType, "${escapedBody}");\n`;
      }
      snippet += `Request request = new Request.Builder()\n  .url("${fullUrl}")\n  .method("${method}", ${method !== 'GET' && body ? 'body' : 'null'})\n`;
      validHeaders.forEach(h => {
        snippet += `  .addHeader("${h.key}", "${h.value}")\n`;
      });
      snippet += `  .build();\nResponse response = client.newCall(request).execute();`;
      return snippet;
    },

    'rust-reqwest': () => {
      let snippet = `extern crate reqwest;\n\nfn main() -> Result<(), reqwest::Error> {\n\n`;
      snippet += `  let client = reqwest::Client::new();\n`;
      snippet += `  let mut builder = client.request(reqwest::Method::${method}, "${fullUrl}");\n\n`;
      validHeaders.forEach(h => {
        snippet += `  builder = builder.header("${h.key}", "${h.value}");\n`;
      });
      if (method !== 'GET' && body) {
        snippet += `\n  let body = r#"\n${body}\n"#;\n  builder = builder.body(body);\n`;
      }
      snippet += `\n  let mut res = builder.send()?;\n  println!("{}", res.text()?);\n\n  Ok(())\n}`;
      return snippet;
    },

    'php-curl': () => {
      let snippet = `<?php\n\n$curl = curl_init();\n\ncurl_setopt_array($curl, array(\n  CURLOPT_URL => '${fullUrl}',\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_ENCODING => '',\n  CURLOPT_MAXREDIRS => 10,\n  CURLOPT_TIMEOUT => 0,\n  CURLOPT_FOLLOWLOCATION => true,\n  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n  CURLOPT_CUSTOMREQUEST => '${method}',\n`;
      
      if (method !== 'GET' && body) {
        const escapedBody = body.replace(/'/g, "\\'");
        snippet += `  CURLOPT_POSTFIELDS =>'${escapedBody}',\n`;
      }
      
      if (validHeaders.length > 0) {
        snippet += `  CURLOPT_HTTPHEADER => array(\n`;
        validHeaders.forEach((h, i) => {
          const comma = i === validHeaders.length - 1 ? '' : ',';
          snippet += `    '${h.key}: ${h.value}'${comma}\n`;
        });
        snippet += `  ),\n`;
      }
      
      snippet += `));\n\n$response = curl_exec($curl);\n\ncurl_close($curl);\necho $response;`;
      return snippet;
    }
  };

  const currentSnippet = generators[activeLang] ? generators[activeLang]() : 'Snippet generator not implemented yet.';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div 
          className="snippet-modal-surface" 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="snippet-header">
            <div className="snippet-title">
              <Code2 size={20} className="text-blue-400" />
              <span>Generate Code Snippet</span>
            </div>
            <button 
              className="snippet-close-btn" 
              onClick={onClose} 
              title="Close (ESC)"
            >
              <X size={16} />
              <span>ESC</span>
            </button>
          </div>
          
          <div className="snippet-body">
            <div className="snippet-toolbar">
              <CustomDropdown 
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value)}
                options={LANGUAGES.map(lang => ({ value: lang.id, label: lang.name }))}
              />
              <button 
                className={`copy-btn ${copied ? 'copied' : ''}`} 
                onClick={handleCopy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className="code-container">
              {LANGUAGES.find(l => l.id === activeLang)?.logo && (
                LANGUAGES.find(l => l.id === activeLang).monochrome ? (
                  <div 
                    className="code-watermark monochrome-watermark" 
                    style={{ 
                      WebkitMaskImage: `url(${LANGUAGES.find(l => l.id === activeLang).logo})`,
                      maskImage: `url(${LANGUAGES.find(l => l.id === activeLang).logo})`
                    }} 
                  />
                ) : (
                  <img 
                    src={LANGUAGES.find(l => l.id === activeLang).logo} 
                    alt="Language Logo" 
                    className="code-watermark color-watermark" 
                  />
                )
              )}
              <pre className="code-block">
                <code>{currentSnippet}</code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

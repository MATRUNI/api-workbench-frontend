import { useEffect, useState } from "react";
import '../style/responsePreview.css';

function ResponsePreview({ data, type, category }) {
    const [url, setUrl] = useState(null);
    const [csvRows, setCsvRows] = useState([]);

    useEffect(() => {
        // 1. Handle CSV parsing (whether data is a string or a Blob)
        if (type === "CSV") {
            setCsvRows([]); // Reset while loading
            if (typeof data === "string") {
                parseCSV(data);
            } else if (data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = (e) => parseCSV(e.target.result);
                reader.readAsText(data);
            }
            return;
        }

        // 2. Handle standard Blob URL creation for media/documents
        if (!(data instanceof Blob)) {
            setUrl(null);
            return;
        }

        const ObjectUrl = URL.createObjectURL(data);
        setUrl(ObjectUrl);
        return () => {
            URL.revokeObjectURL(ObjectUrl);
        };
    }, [data, type]);

    const parseCSV = (text) => {
        const rows = text.trim().split('\n').map(row => {
            return row.split(',').map(val => val.trim().replace(/^["'](.*)["']$/, '$1'));
        });
        setCsvRows(rows);
    };

    if (type === "SVG" && typeof data === "string") {
        return <div dangerouslySetInnerHTML={{ __html: data }} className="preview-container svg-preview" />;
    }

    if (type === "HTML") {
        return <iframe title="HTML Preview" srcDoc={data} className="preview-iframe" />;
    }

    if (type === "CSV") {
        return (
            <div className="preview-container csv-preview-wrapper">
                {csvRows.length > 0 ? (
                    <table className="csv-table">
                        <thead>
                            <tr>
                                {csvRows[0].map((header, index) => (
                                    <th key={index}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {csvRows.slice(1).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <pre className="preview-container text-preview">{typeof data === "string" ? data : "Loading CSV..."}</pre>
                )}
            </div>
        );
    }

    // Category-driven rendering
    switch (category) {
        case "IMAGE":
            return url ? (
                <div className="preview-container image-preview-wrapper">
                    <img src={url} alt="Preview" className="preview-image" />
                </div>
            ) : null;

        case "DOCUMENT":
            return url ? (
                <iframe title="Document Preview" src={url} className="preview-iframe" />
            ) : null;

        case "AUDIO":
            return url ? (
                <div className="preview-container audio-preview-wrapper">
                    <audio key={url} controls src={url} className="preview-audio" />
                </div>
            ) : null;

        case "VIDEO":
            return url ? (
                <div className="preview-container video-preview-wrapper">
                    <video key={url} controls src={url} className="preview-video" />
                </div>
            ) : null;
            
        case "ARCHIVE":
        default:
            if (typeof data === "string") {
                return <pre className="preview-container text-preview">{data}</pre>;
            }
            return (
                <div className="preview-container unsupported-preview">
                    <h1>Preview not supported for this format.</h1>
                </div>
            );
    }
}

export default ResponsePreview;
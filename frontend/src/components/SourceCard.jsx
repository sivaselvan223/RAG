export default function SourceCard({ sources }) {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="sources-container">
            <div className="sources-label">📚 Sources</div>
            <div className="sources-list">
                {sources.map((source, index) => (
                    <div key={index} className="source-card">
                        <div className="source-filename">
                            📄 {source.filename}
                        </div>
                        {source.chunkText && (
                            <div className="source-preview">{source.chunkText}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

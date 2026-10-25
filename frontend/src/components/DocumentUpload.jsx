import { useRef } from "react";
import { FileText, LoaderCircle, Upload } from "lucide-react";

function DocumentUpload({ onUpload, uploading }) {
    const inputRef = useRef(null);

    function handleFileChange(event) {
        const file = event.target.files?.[0];

        if (file) {
            onUpload(file);
        }

        event.target.value = "";
    }

    return (
        <div className="document-uploader">
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                disabled={uploading}
                hidden
            />

            <button
                type="button"
                className="upload-button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? (
                    <LoaderCircle size={16} className="upload-spinner" />
                ) : (
                    <Upload size={16} />
                )}

                <span>
                    {uploading ? "Processing document..." : "Upload document"}
                </span>
            </button>

            <div className="upload-supported">
                <FileText size={13} />
                <span>PDF, TXT · Max 20 MB</span>
            </div>
        </div>
    );
}

export default DocumentUpload;
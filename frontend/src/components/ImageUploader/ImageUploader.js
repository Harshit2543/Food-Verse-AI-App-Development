import React, { useState, useRef } from 'react';
import './ImageUploader.css';

const ImageUploader = ({
  onImageSelected,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  maxSizeMB = 10,
  label = 'Drag and drop an image here',
  sublabel = 'Supports JPG, PNG, WEBP up to 10MB',
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid format: ${file.name}. Only JPG, PNG, and WEBP are accepted.`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large: ${file.name}. Maximum size allowed is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFiles = (files) => {
    setError('');
    const fileList = Array.from(files);
    if (!fileList.length) return;

    for (const f of fileList) {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
    }

    if (multiple) {
      const urls = fileList.map((f) => URL.createObjectURL(f));
      setPreviewUrls(urls);
      onImageSelected(fileList);
    } else {
      const singleFile = fileList[0];
      const url = URL.createObjectURL(singleFile);
      setPreviewUrls([url]);
      onImageSelected(singleFile);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelected(multiple ? [] : null);
  };

  return (
    <div className="uploader-container">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${
          previewUrls.length > 0 ? 'has-preview' : ''
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={onFileInputChange}
          className="hidden-file-input"
        />

        {previewUrls.length > 0 ? (
          <div className="preview-container">
            <div className="preview-grid">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="preview-card">
                  <img src={url} alt={`Preview ${idx + 1}`} className="preview-image" />
                </div>
              ))}
            </div>
            <div className="preview-actions">
              <span className="preview-count">
                {previewUrls.length} {previewUrls.length === 1 ? 'image' : 'images'} selected
              </span>
              <button
                type="button"
                className="remove-btn"
                onClick={handleRemove}
                title="Remove image"
              >
                ✕ Change Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="drop-prompt">
            <div className="upload-icon-wrapper">
              <span className="upload-icon">📸</span>
            </div>
            <p className="upload-main-text">{label}</p>
            <p className="upload-sub-text">{sublabel}</p>
            <button type="button" className="browse-btn">
              Browse Files
            </button>
          </div>
        )}
      </div>

      {error && <div className="uploader-error">⚠️ {error}</div>}
    </div>
  );
};

export default ImageUploader;

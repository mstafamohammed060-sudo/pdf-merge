"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Merge, Download, FileText, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize dark mode on component mount
  useEffect(() => {
    // Always apply dark mode
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the actual drop zone
    const relatedTarget = e.relatedTarget as Node;
    const dropZone = e.currentTarget;
    if (!dropZone.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );

    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    } else {
      alert("Please drop only PDF files");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setMergedUrl(null);
    }
  };

  // Move file up (swap with previous file)
  const moveFileUp = (index: number) => {
    if (index <= 0 || index >= files.length) return;
    
    const newFiles = [...files];
    // Swap current file with the one above it
    [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
    setFiles(newFiles);
    setMergedUrl(null); // Reset merged URL since order changed
  };

  // Move file down (swap with next file)
  const moveFileDown = (index: number) => {
    if (index < 0 || index >= files.length - 1) return;
    
    const newFiles = [...files];
    // Swap current file with the one below it
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
    setMergedUrl(null); // Reset merged URL since order changed
  };

  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOverItem = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeaveItem = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDropItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;
    
    const newFiles = [...files];
    const [draggedFile] = newFiles.splice(dragIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);
    
    setFiles(newFiles);
    setMergedUrl(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
    // Remove drag-over class from all items
    document.querySelectorAll('.pdf-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  };

  const handleMerge = async () => {
    if (files.length === 0) {
      alert("Please upload at least 1 PDF file");
      return;
    }

    setIsMerging(true);
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));

      const res = await fetch("/api/merge", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Failed to merge PDFs");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
    } catch (error) {
      alert("An error occurred while merging PDFs. Please try again.");
      console.error(error);
    } finally {
      setIsMerging(false);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setMergedUrl(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              PDF Merger Pro
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              Drag, drop, reorder and merge your PDFs
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-gray-300">Dark Mode</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & File List */}
          <div className="lg:col-span-2 space-y-8">
            {/* Drag & Drop Area */}
            <div
              className={`relative border-4 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-400 bg-blue-900/20 scale-[1.02]' 
                  : 'border-gray-700 hover:border-blue-500'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-blue-400/10 rounded-2xl flex items-center justify-center z-10">
                  <div className="text-2xl font-bold text-blue-400 animate-pulse">
                    Drop your PDFs here!
                  </div>
                </div>
              )}
              
              <Upload className={`w-20 h-20 mx-auto mb-6 transition-transform ${
                isDragging ? 'scale-110 animate-bounce' : ''
              } ${
                isDragging ? 'text-blue-400' : 'text-gray-600'
              }`} />
              
              <p className="text-xl text-gray-300 mb-4">
                {isDragging ? "Release to upload" : "Drag & drop PDF files here"}
              </p>
              
              <p className="text-gray-400 mb-6">
                or
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Upload className="w-6 h-6 mr-3" />
                Browse Files
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              
              <p className="text-sm text-gray-400 mt-6">
                Supports multiple PDF files
              </p>
            </div>

            {/* File List with Reordering */}
            {files.length > 0 && (
              <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      PDF Files ({files.length})
                    </h2>
                    <p className="text-gray-400">
                      Drag files to reorder or use arrow buttons to swap positions
                    </p>
                  </div>
                  <button
                    onClick={clearAllFiles}
                    className="flex items-center px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Clear All
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="pdf-item p-4 rounded-xl border-2 border-gray-700 hover:border-blue-700 bg-gray-800 transition-all duration-200"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOverItem}
                      onDragLeave={handleDragLeaveItem}
                      onDrop={(e) => handleDropItem(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          {/* Drag Handle */}
                          <div
                            className="mr-3 cursor-move p-2 hover:bg-gray-700 rounded"
                            title="Drag to reorder"
                          >
                            <div className="flex flex-col space-y-1">
                              <div className="w-4 h-1 bg-gray-500 rounded-full"></div>
                              <div className="w-4 h-1 bg-gray-500 rounded-full"></div>
                              <div className="w-4 h-1 bg-gray-500 rounded-full"></div>
                            </div>
                          </div>
                          
                          {/* File Icon & Info */}
                          <FileText className="w-8 h-8 text-red-500 mr-4 flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className="text-sm font-semibold bg-blue-900 text-blue-400 px-2 py-0.5 rounded mr-3">
                                #{index + 1}
                              </span>
                              <span className="text-gray-200 truncate font-medium">
                                {file.name}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <span className="mx-2 text-gray-600">•</span>
                              <span className="text-sm text-gray-400">
                                Last modified: {new Date(file.lastModified).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => moveFileUp(index)}
                              disabled={index === 0}
                              className={`p-2 rounded ${
                                index === 0
                                  ? 'text-gray-600 cursor-not-allowed opacity-50'
                                  : 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/20'
                              }`}
                              aria-label={`Move ${file.name} up`}
                              title="Move up (swap with file above)"
                            >
                              <ChevronUp className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => moveFileDown(index)}
                              disabled={index === files.length - 1}
                              className={`p-2 rounded ${
                                index === files.length - 1
                                  ? 'text-gray-600 cursor-not-allowed opacity-50'
                                  : 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/20'
                              }`}
                              aria-label={`Move ${file.name} down`}
                              title="Move down (swap with file below)"
                            >
                              <ChevronDown className="w-5 h-5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                            aria-label={`Remove ${file.name}`}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center">
                      <div className="flex flex-col space-y-1 mr-2">
                        <div className="w-4 h-1 bg-gray-500 rounded-full"></div>
                        <div className="w-4 h-1 bg-gray-500 rounded-full"></div>
                        <div className="w-4 h-1 bg-gray-500 rounded-full"></div>
                      </div>
                      <span>Drag files to reorder</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <ChevronUp className="w-4 h-4 mr-1" />
                        <span>Move up (swap)</span>
                      </div>
                      <div className="flex items-center">
                        <ChevronDown className="w-4 h-4 mr-1" />
                        <span>Move down (swap)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Controls & Preview */}
          <div className="space-y-8">
            {/* Merge Controls */}
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6">
                Merge Controls
              </h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-700/50 rounded-xl">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {files.length}
                    </div>
                    <div className="text-gray-300">
                      PDF{files.length !== 1 ? 's' : ''} Ready
                    </div>
                    {files.length > 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        Merged in current order
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleMerge}
                  disabled={files.length === 0 || isMerging}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center shadow-lg hover:shadow-xl disabled:hover:shadow-lg ${
                    files.length === 0 || isMerging
                      ? "bg-gray-700 cursor-not-allowed text-gray-500"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  }`}
                >
                  {isMerging ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="w-6 h-6 mr-3" />
                      Merge Now
                    </>
                  )}
                </button>

                {mergedUrl && (
                  <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-800">
                      <div className="text-center">
                        <Download className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <h4 className="font-bold text-white mb-2">
                          Ready to Download!
                        </h4>
                        <a
                          href={mergedUrl}
                          download="merged.pdf"
                          className="inline-flex items-center justify-center w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors mt-4"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download Merged PDF
                        </a>
                        <p className="text-sm text-gray-400 mt-3">
                          Files merged in current order
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
           

            {/* Dark Mode Indicator */}
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Interface Theme
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-medium text-white">Dark Mode</div>
                    <div className="text-sm text-gray-400">Always enabled</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-600">
                  🌙
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800 text-center">
          
          <p className="text-sm text-gray-500 mt-2">
            ~ Alex .D Mekhail ~
          </p>
        </footer>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

interface SimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SimulationModal({ isOpen, onClose }: SimulationModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSubmit = () => {
        if (!selectedFile) return;
        // Logic to handle the file upload/simulation start would go here
        console.log("Submitting file:", selectedFile.name);
        onClose();
        // Maybe show a success toast or notification?
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                }`}
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl transition-all duration-300 scale-100">
                <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
                    <h2 className="text-xl font-semibold text-zinc-100">Data Simulation</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {!selectedFile ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-600 bg-zinc-800/20 py-12 transition-colors">
                            <label htmlFor="psf-upload" className="cursor-pointer flex flex-col items-center">
                                <svg className="h-12 w-12 mb-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="text-sm font-medium text-zinc-300">
                                    Click to upload .psf file
                                </span>
                                <span className="mt-1 text-xs text-zinc-500">
                                    or drag and drop
                                </span>
                                <input
                                    id="psf-upload"
                                    type="file"
                                    accept=".psf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-900/30 p-2 text-amber-500">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-200">{selectedFile.name}</p>
                                    <p className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className="border-t border-zinc-700 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedFile}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * ==================================
 * CmsCodeEditor — Éditeur de code Monaco
 * ==================================
 * Onglet "Code" dans l'éditeur de page CMS.
 * Permet l'édition HTML/CSS pour HtmlCustomSection.
 */

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface CmsCodeEditorProps {
    value: string;
    language?: 'html' | 'css' | 'javascript';
    onChange?: (value: string) => void;
    height?: string | number;
    readOnly?: boolean;
}

export function CmsCodeEditor({
    value,
    language = 'html',
    onChange,
    height = 400,
    readOnly = false,
}: CmsCodeEditorProps) {
    const editorRef = useRef<any>(null);

    const handleMount: OnMount = useCallback((editor) => {
        editorRef.current = editor;
    }, []);

    const handleChange = useCallback((val: string | undefined) => {
        if (onChange && val !== undefined) {
            onChange(val);
        }
    }, [onChange]);

    return (
        <div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
                padding: '6px 12px',
                background: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                    {language === 'html' ? 'HTML' : language === 'css' ? 'CSS' : 'JavaScript'}
                </span>
                <span style={{ fontSize: 11, color: '#6c757d' }}>
                    {readOnly ? 'Lecture seule' : 'Édition'}
                </span>
            </div>
            <Editor
                height={height}
                language={language}
                value={value}
                onChange={handleChange}
                onMount={handleMount}
                theme="vs-light"
                options={{
                    readOnly,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 2,
                    automaticLayout: true,
                    padding: { top: 8, bottom: 8 },
                    suggest: {
                        showWords: false,
                    },
                }}
            />
        </div>
    );
}

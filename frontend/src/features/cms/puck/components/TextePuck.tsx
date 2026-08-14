import type { ComponentConfig } from '@puckeditor/core';
import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style'],
};

export type TexteProps = { html: string };

export const TextePuck: ComponentConfig<TexteProps> = {
    fields: {
        html: { type: 'textarea' },
    },
    defaultProps: { html: '<p>Votre texte ici...</p>' },
    render({ html }) {
        return (
            <div
                className="prose prose-lg max-w-none"
                style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)', lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || '', PURIFY_CONFIG) }}
            />
        );
    },
};

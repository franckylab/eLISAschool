import type { ComponentConfig } from '@puckeditor/core';
import DOMPurify from 'dompurify';
import { SectionWrapper } from '../section-wrapper';

const PURIFY_CONFIG = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style'],
};

export type TexteProps = { html: string; styleConfig?: any };

export const TextePuck: ComponentConfig<TexteProps> = {
    fields: {
        html: { type: 'textarea' },
    },
    defaultProps: { html: '<p>Votre texte ici...</p>' },
    render({ html, styleConfig }) {
        return (
            <SectionWrapper
                styleConfig={styleConfig}
                style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)', lineHeight: 1.8 }}
            >
                <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || '', PURIFY_CONFIG) }}
                />
            </SectionWrapper>
        );
    },
};

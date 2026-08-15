import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';
import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'span', 'div', 'style', 'section', 'header', 'footer', 'nav', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'figure', 'figcaption'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style', 'id', 'width', 'height'],
};

export type HtmlCustomProps = { html: string; styleConfig?: any };

export const HtmlCustomPuck: ComponentConfig<HtmlCustomProps> = {
    fields: { html: { type: 'code' } as any },
    defaultProps: { html: '<div>HTML personnalisé</div>' },
    render({ html, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className="cms-custom-html" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || '', PURIFY_CONFIG) }} />
            </SectionWrapper>
        );
    },
};

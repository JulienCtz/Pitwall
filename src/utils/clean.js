import sanitizeHtml from 'sanitize-html';

const clean = (input) => sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });

export default clean;
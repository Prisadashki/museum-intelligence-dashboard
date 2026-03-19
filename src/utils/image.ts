/**
 * Default placeholder for artworks with no image.
 * Uses a data URI of a simple gray placeholder with a museum icon.
 */
export const PLACEHOLDER_IMAGE =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
            '<rect width="400" height="300" fill="#f3f4f6"/>' +
            '<text x="200" y="150" text-anchor="middle" dominant-baseline="middle" font-family="system-ui" font-size="14" fill="#9ca3af">No Image Available</text>' +
            '</svg>',
    );

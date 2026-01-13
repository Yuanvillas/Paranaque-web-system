// Image utilities for handling book images
// Provides fallbacks and error handling

const SUPABASE_BASE_URL = 'https://rqseuhdpktquhlqojoqg.supabase.co/storage/v1/object/public/book_bucket';

/**
 * Validates if an image URL is accessible
 * @param {string} imageUrl - The image URL to validate
 * @returns {Promise<boolean>}
 */
export async function validateImageUrl(imageUrl) {
  if (!imageUrl) return false;
  
  try {
    const response = await fetch(imageUrl, { method: 'HEAD', mode: 'no-cors' });
    return response.ok || response.status === 0; // 0 for no-cors
  } catch {
    return false;
  }
}

/**
 * Get a safe image URL with fallback
 * @param {string} imageUrl - Original image URL
 * @returns {string} Safe image URL
 */
export function getSafeImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // Already a valid URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Base64 image
  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }
  
  // Construct Supabase URL for relative paths
  const cleanPath = imageUrl.replace(/\.jpgi$/i, '.jpg');
  
  if (cleanPath.includes('/')) {
    return `${SUPABASE_BASE_URL}/${cleanPath}`;
  }
  
  return `${SUPABASE_BASE_URL}/profile/${cleanPath}`;
}

/**
 * Get image with retry logic
 * @param {string} imageUrl - The image URL
 * @param {number} retries - Number of retries
 * @returns {Promise<string>} The image URL that works
 */
export async function getImageWithRetry(imageUrl, retries = 3) {
  if (!imageUrl) return null;
  
  const safeUrl = getSafeImageUrl(imageUrl);
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(safeUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Image URL valid: ${safeUrl.substring(0, 60)}...`);
        return safeUrl;
      }
    } catch (err) {
      console.warn(`⚠️  Retry ${i + 1}/${retries} failed for image`);
    }
  }
  
  console.error(`❌ Image URL failed all retries: ${safeUrl.substring(0, 60)}...`);
  return null;
}

/**
 * Create an optimized image element with error handling
 * @param {Object} options
 * @returns {Object} Image element props
 */
export function createImageProps(options = {}) {
  const {
    src,
    alt = 'Book image',
    onError = null,
    onLoad = null,
    className = '',
    style = {}
  } = options;
  
  return {
    src: getSafeImageUrl(src),
    alt,
    className,
    style,
    onLoad: (e) => {
      console.log(`✅ Image loaded: ${alt}`);
      onLoad?.(e);
    },
    onError: (e) => {
      console.error(`❌ Failed to load image: ${alt}`);
      console.error('URL attempted:', e.target.src);
      
      // Hide broken image
      if (e.target.style) {
        e.target.style.display = 'none';
      }
      
      onError?.(e);
    }
  };
}

/**
 * Placeholder image component
 */
export function ImagePlaceholder({ title = 'Book', size = '200px' }) {
  return (
    <div 
      style={{ 
        width: size,
        height: size,
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3em',
        color: '#ccc',
        flexShrink: 0
      }}
      title={`No image for ${title}`}
    >
      📖
    </div>
  );
}

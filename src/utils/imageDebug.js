// Frontend image diagnostic helper
// Add this to pages where images are displayed for debugging

export const debugImageUrl = (book, componentName = 'Unknown') => {
  console.group(`📸 Image Debug: ${componentName} - "${book.title}"`);
  console.log('Book ID:', book._id);
  console.log('Image field:', book.image);
  
  if (!book.image) {
    console.warn('⚠️  No image URL in book object');
  } else if (book.image.startsWith('http')) {
    console.log('✅ Valid URL');
    console.log('Domain:', new URL(book.image).hostname);
  } else if (book.image.startsWith('data:image/')) {
    console.log('✅ Base64 image data');
  } else {
    console.error('❌ Invalid image format:', book.image.substring(0, 50));
  }
  console.groupEnd();
};

export const handleImageError = (event, book) => {
  console.error(`❌ Failed to load image for "${book.title}"`);
  console.log('Failed URL:', event.target.src);
  console.log('Book ID:', book._id);
  
  // Show placeholder
  if (event.target.style) {
    event.target.style.display = 'none';
  }
};

export const handleImageLoad = (event, book) => {
  console.log(`✅ Successfully loaded image for "${book.title}"`);
};

// Usage in React components:
/*
import { debugImageUrl, handleImageError, handleImageLoad } from '../utils/imageDebug';

In your component:
<img 
  src={book.image} 
  alt={book.title}
  onLoad={(e) => handleImageLoad(e, book)}
  onError={(e) => {
    handleImageError(e, book);
    // Show placeholder
  }}
/>

Before rendering:
useEffect(() => {
  if (book) debugImageUrl(book, 'BookModal');
}, [book]);
*/

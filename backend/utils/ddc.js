// utils/ddc.js
// Dewey Decimal Classification (DDC) utility for generating call numbers

/**
 * DDC Classification Mapping
 * Maps common book categories to their corresponding Dewey Decimal ranges
 */
const DDC_MAPPING = {
  'Science': '500',          // Natural Sciences & Mathematics (500-599)
  'Math': '510',             // Mathematics (510-519)
  'Filipino': '820',         // Literature - Tagalog/Filipino (820-899)
  'English': '820',          // Literature - English (820-899)
  'Fiction': '800',          // Literature - General (800-899)
  'History': '900',          // History & Geography (900-999)
  'Biography': '920',        // Biography (920-929)
  'Technology': '600',       // Technology (600-699)
  'Medicine': '610',         // Medicine & Health (610-619)
  'Philosophy': '100',       // Philosophy & Psychology (100-199)
  'Psychology': '150',       // Psychology (150-159)
  'Social Sciences': '300',  // Social Sciences (300-399)
  'Religion': '200',         // Religion (200-299)
  'Art': '700',              // Arts & Recreation (700-799)
  'Music': '780',            // Music (780-789)
  'Sports': '790',           // Sports & Recreation (790-799)
  'Default': '000'           // General Knowledge (000-099)
};

/**
 * Get DDC code for a category
 * @param {string} category - The book category
 * @returns {string} - The DDC code (e.g., '500', '510', etc.)
 */
const getDDCCode = (category) => {
  if (!category) return DDC_MAPPING.Default;
  
  const trimmedCategory = category.trim();
  
  // Check for exact match first
  if (DDC_MAPPING[trimmedCategory]) {
    return DDC_MAPPING[trimmedCategory];
  }
  
  // Check for partial match (case-insensitive)
  const lowerCategory = trimmedCategory.toLowerCase();
  for (const [key, code] of Object.entries(DDC_MAPPING)) {
    if (key.toLowerCase().includes(lowerCategory) || lowerCategory.includes(key.toLowerCase())) {
      return code;
    }
  }
  
  return DDC_MAPPING.Default;
};

/**
 * Get author initials from author name
 * @param {string} author - The author name
 * @returns {string} - Initials (e.g., 'JK' for 'John King')
 */
const getAuthorInitials = (author) => {
  if (!author) return 'XX';
  
  const names = author.trim().split(/\s+/);
  if (names.length === 0) return 'XX';
  
  // Get first initial of first name and first initial of last name
  const firstInitial = names[0].charAt(0).toUpperCase();
  const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
};

/**
 * Generate a DDC-formatted call number
 * Format: DDD-AAA-NNNN
 * - DDD: Dewey Decimal Classification code (e.g., 500 for Science)
 * - AAA: Author initials (e.g., JKR for J.K. Rowling)
 * - NNNN: Unique sequence number to avoid duplicates
 * 
 * @param {string} category - The book category
 * @param {string} author - The author name
 * @param {number} sequenceNumber - A unique sequence number (optional)
 * @returns {string} - The generated call number (e.g., '500-JKR-0001')
 */
const generateCallNumber = (category, author, sequenceNumber = 1) => {
  const ddcCode = getDDCCode(category);
  const authorInitials = getAuthorInitials(author);
  const sequence = String(sequenceNumber).padStart(4, '0');
  
  return `${ddcCode}-${authorInitials}-${sequence}`;
};

/**
 * Generate a simplified DDC call number
 * Format: DDD-AAAA
 * - DDD: Dewey Decimal Classification code
 * - AAAA: First 4 letters of author's last name (or first name if last not available)
 * 
 * Simpler version if you prefer shorter call numbers
 * @param {string} category - The book category
 * @param {string} author - The author name
 * @returns {string} - The generated call number (e.g., '500-ROWL')
 */
const generateSimplifiedCallNumber = (category, author) => {
  const ddcCode = getDDCCode(category);
  
  if (!author) {
    return `${ddcCode}-ANON`;
  }
  
  const names = author.trim().split(/\s+/);
  const lastNameOrFirst = names[names.length - 1];
  const lastNameCode = lastNameOrFirst.substring(0, 4).toUpperCase();
  
  return `${ddcCode}-${lastNameCode}`;
};

module.exports = {
  DDC_MAPPING,
  getDDCCode,
  getAuthorInitials,
  generateCallNumber,
  generateSimplifiedCallNumber
};

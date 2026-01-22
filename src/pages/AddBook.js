import React, { useState, useEffect } from "react";
import logo from "../imgs/liblogo.png";

// DDC Classification Utility (mirrored from backend)
const generateCallNumber = (category, author, sequenceNumber = 1) => {
  const DDC_MAPPING = {
    'Science': '500', 'Math': '510', 'Filipino': '820', 'English': '820',
    'Fiction': '800', 'History': '900', 'Biography': '920', 'Technology': '600',
    'Medicine': '610', 'Philosophy': '100', 'Psychology': '150',
    'Social Sciences': '300', 'Religion': '200', 'Art': '700', 'Music': '780',
    'Sports': '790'
  };
  
  const ddcCode = DDC_MAPPING[category] || '000';
  
  if (!author) {
    return `${ddcCode}-ANON-${String(sequenceNumber).padStart(4, '0')}`;
  }
  
  const names = author.trim().split(/\s+/);
  const firstInitial = names[0].charAt(0).toUpperCase();
  const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
  const authorInitials = `${firstInitial}${lastInitial}`;
  const sequence = String(sequenceNumber).padStart(4, '0');
  
  return `${ddcCode}-${authorInitials}-${sequence}`;
};

const AddBook = ({ onBookAdded }) => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState(["Science", "Math", "Filipino", "English", "Fiction"]);
  const [nextAccessionNumber, setNextAccessionNumber] = useState("Calculating...");
  const [nextCallNumber, setNextCallNumber] = useState("Will be auto-generated...");

  const [book, setBook] = useState({
    title: "",
    year: "",
    genre: "",
    category: "",
    subject: "",
    stock: "1",
    collectionType: "Circulation",
    sourceOfFunds: "",
    location: {
      shelf: "",
      level: ""
    },
    author: "",
    publisher: "",
    accessionNumber: "",
    callNumber: "",
    image: null
  });

  const [preview, setPreview] = useState(null);
  const [base64Image, setBase64Image] = useState("");

  // Fetch the next accession number when component mounts
  useEffect(() => {
    const fetchNextAccessionNumber = async () => {
      try {
        console.log("📚 Fetching next accession number...");
        
        // Get all books to find the highest accession number
        const response = await fetch("https://paranaque-web-system.onrender.com/api/books/?limit=9999");
        const data = await response.json();
        
        const currentYear = new Date().getFullYear();
        let highestNumber = 0;
        let highestBook = null;
        
        if (data.books && data.books.length > 0) {
          // Loop through ALL books to find the actual highest numeric accession number
          for (const book of data.books) {
            const accession = book.accessionNumber || "";
            if (accession.startsWith(`${currentYear}-`)) {
              const parts = accession.split('-');
              if (parts.length === 2) {
                const sequenceNum = parseInt(parts[1]);
                if (sequenceNum > highestNumber) {
                  highestNumber = sequenceNum;
                  highestBook = accession;
                }
              }
            }
          }
          
          console.log("📚 Highest accession number found:", highestBook || "None");
          
          const nextSequence = highestNumber + 1;
          const nextAccession = `${currentYear}-${String(nextSequence).padStart(4, '0')}`;
          console.log("📚 Next accession number will be:", nextAccession);
          setNextAccessionNumber(nextAccession);
        } else {
          // No books exist yet
          setNextAccessionNumber(`${currentYear}-0001`);
        }
      } catch (err) {
        console.error("❌ Error fetching accession number:", err);
        setNextAccessionNumber("Auto-generated");
      }
    };

    fetchNextAccessionNumber();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0];
      
      // Validate file type
      if (file && !file.type.startsWith('image/')) {
        alert("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file && file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      setBook({ ...book, image: file });
      setPreview(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          console.log("✅ Image converted to base64, size:", reader.result.length);
          setBase64Image(reader.result);
        }
      };
      reader.onerror = () => {
        console.error("❌ Error reading image file");
        alert("Error reading image file. Please try again.");
      };
      if (file) reader.readAsDataURL(file);

      return;
    }

    const updatedBook = { ...book, [name]: value };
    setBook(updatedBook);
    
    // Auto-update call number preview when category or author changes
    if (name === "category" || name === "author") {
      const previewCallNumber = generateCallNumber(updatedBook.category, updatedBook.author, 1);
      setNextCallNumber(previewCallNumber);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      if (!categories.includes(newCategory.trim())) {
        setCategories([...categories, newCategory.trim()]);
        setBook({ ...book, category: newCategory.trim() });
        setNewCategory("");
        setShowCategoryModal(false);
      } else {
        alert("Category already exists!");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("📝 Form submitted with data:", {
      title: book.title,
      author: book.author,
      year: book.year,
      category: book.category,
      stock: book.stock,
      shelf: book.location.shelf,
      level: book.location.level
    });
    
    // Validate required fields
    if (!book.title || !book.title.trim()) {
      alert("Book title is required");
      return;
    }
    
    if (!book.author || !book.author.trim()) {
      alert("Author is required");
      return;
    }
    
    if (!book.year || isNaN(book.year) || book.year < 1000 || book.year > new Date().getFullYear() + 10) {
      alert("Please enter a valid year (between 1000 and " + (new Date().getFullYear() + 10) + ")");
      return;
    }
    
    if (!book.subject) {
      alert("Please select a subject");
      return;
    }
    
    if (!book.collectionType) {
      alert("Please select a collection type");
      return;
    }
    
    if (!book.stock || isNaN(book.stock) || book.stock < 1) {
      alert("Please enter a valid stock number (minimum 1)");
      return;
    }
    
    if (book.location.shelf === '' || isNaN(book.location.shelf)) {
      alert("Please enter a shelf number");
      return;
    }
    
    if (book.location.level === '' || isNaN(book.location.level)) {
      alert("Please enter a shelf level");
      return;
    }

    setLoading(true);
    console.log("🔄 Starting book submission...");

    const payload = {
      title: book.title,
      year: parseInt(book.year),
      author: book.author,
      publisher: book.publisher || "Unknown",
      category: book.category,
      subject: book.subject,
      collectionType: book.collectionType,
      sourceOfFunds: book.sourceOfFunds || null,
      stock: parseInt(book.stock) || 1,
      callNumber: book.callNumber,
      location: {
        genreCode: book.subject.slice(0, 3).toUpperCase(),
        shelf: parseInt(book.location.shelf),
        level: parseInt(book.location.level)
      },
      image: base64Image,
      userEmail: localStorage.getItem('userEmail') || 'admin'
    };

    console.log("📤 Submitting book with image:", {
      title: payload.title,
      hasImage: !!payload.image,
      imageSize: payload.image ? payload.image.length : 0
    });

    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        console.log("✅ Book added successfully! Image URL:", data.book?.image);
        setShowSuccessModal(true);
        setBook({
          title: "",
          year: "",
          genre: "",
          category: book.category,  // Keep the selected category
          stock: "1",
          location: { shelf: "", level: "" },
          author: "",
          publisher: "",
          accessionNumber: "",
          callNumber: "",
          image: null
        });
        setPreview(null);
        setBase64Image("");

        if (onBookAdded) onBookAdded();
      } else {
        console.error("❌ Failed to add book:", data.error);
        alert("Failed to add book: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Error adding book:", err);
      alert("Error adding book: " + (err.message || "Network error"));
    }
  };

  return (
    <div className="add-book-container" style={styles.container}>
      {console.log("📝 AddBook component rendering")}
      <img src={logo} alt="Library Logo" style={styles.logo} />

      <h2 style={styles.title}>Add a Book</h2>

      <form onSubmit={handleSubmit} style={styles.form} aria-label="Add Book Form">

        <div style={styles.inputGroup}>
          <label style={styles.label}>Call Number (Auto-Generated - DDC Format)</label>
          <input 
            type="text" 
            value={nextCallNumber} 
            disabled 
            style={{...styles.input, backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed'}}
            aria-label="Auto-generated call number"
          />
          <small style={{color: '#999', marginTop: '5px', display: 'block'}}>Based on category and author name (Format: DDD-II-SSSS)</small>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Accession Number (Auto-Generated)</label>
          <input 
            type="text" 
            value={nextAccessionNumber} 
            disabled 
            style={{...styles.input, backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed'}}
            aria-label="Auto-generated accession number"
          />
          <small style={{color: '#999', marginTop: '5px', display: 'block'}}>This book will automatically get this accession number</small>
        </div>

        <Input label="Book Title" name="title" value={book.title} onChange={handleChange} required />

        <Input label="Author" name="author" value={book.author} onChange={handleChange} required />

        <Input label="Publisher (Optional)" name="publisher" value={book.publisher} onChange={handleChange} />

        <Input label="Year Published" type="number" name="year" value={book.year} onChange={handleChange} required />

        <Input label="Number of Copies" type="number" name="stock" min="1" value={book.stock} onChange={(e) => {
          const value = e.target.value;
          if (value === '' || parseInt(value) > 0) {
            setBook({ ...book, stock: value });
          }
        }} required />

        <Select label="Subject" name="subject" value={book.subject} onChange={handleChange} options={categories} required />

        <button type="button" onClick={() => setShowCategoryModal(true)} style={styles.addCategoryBtn}>
          + Add New Subject
        </button>

        <Select 
          label="Collection Type" 
          name="collectionType" 
          value={book.collectionType} 
          onChange={handleChange} 
          options={['Filipiniana', 'Reference', 'Circulation']} 
          required 
        />

        <Select 
          label="Source of Funds" 
          name="sourceOfFunds" 
          value={book.sourceOfFunds} 
          onChange={handleChange} 
          options={['', 'Donation', 'Locally funded', 'National Library of the Philippines']}
        />

        <div style={styles.row}>
          <Input small label="Shelf Number" name="shelf" type="number" min="0" value={book.location.shelf} onChange={(e) => {
            const value = e.target.value;
            if (value === '' || parseInt(value) >= 0) {
              setBook({ ...book, location: { ...book.location, shelf: value } });
            }
          }} required />
          <Input small label="Shelf Level" name="level" type="number" min="0" value={book.location.level} onChange={(e) => {
            const value = e.target.value;
            if (value === '' || parseInt(value) >= 0) {
              setBook({ ...book, location: { ...book.location, level: value } });
            }
          }} required />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Book Image</label>
          <input type="file" name="image" accept="image/*" onChange={handleChange} aria-label="Upload Book Image" />
          {preview && <img src={preview} alt="Preview" style={styles.preview} />}
        </div>

        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? "Adding Book..." : "Add Book"}
        </button>
      </form>

      {showCategoryModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Add New Subject</h3>
            <input
              type="text"
              placeholder="Enter category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={styles.input}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button onClick={handleAddCategory} style={styles.submitBtn}>
                Add Category
              </button>
              <button onClick={() => { setShowCategoryModal(false); setNewCategory(""); }} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Book Added Successfully!</h3>
            <button onClick={() => setShowSuccessModal(false)} style={styles.closeModalBtn}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text", required = false, disabled = false, small = false, min = undefined }) => (
  <div style={{ marginBottom: "15px", width: small ? "48%" : "100%" }}>
    <label style={styles.label}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      aria-label={label}
      style={styles.input}
      min={min}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options, required = false }) => (
  <div style={styles.inputGroup}>
    <label style={styles.label}>{label}</label>
    <select name={name} value={value} onChange={onChange} required={required} style={styles.input} aria-label={label}>
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const styles = {
  container: { display: "flex", flexDirection: "column", alignItems: "center", padding: "30px", minHeight: "100%", width: "100%", visibility: "visible", opacity: 1 },
  logo: { width: "100px", marginBottom: "15px" },
  title: { fontWeight: "700", marginBottom: "20px" },
  form: { width: "100%", maxWidth: "450px" },
  row: { display: "flex", justifyContent: "space-between", gap: "10px" },
  inputGroup: { marginBottom: "15px", width: "104%" },
  label: { display: "block", marginBottom: "6px", fontWeight: "600" },
  input: { width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc", visibility: "visible" },
  preview: { width: "100%", marginTop: "10px", borderRadius: "5px" },
  submitBtn: { width: "100%", padding: "12px", backgroundColor: "#1dbf73", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", pointerEvents: "auto", visibility: "visible" },
  addCategoryBtn: { width: "104%", padding: "10px", backgroundColor: "#17a2b8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", marginTop: "-10px", marginBottom: "15px", pointerEvents: "auto", visibility: "visible" },
  cancelBtn: { flex: 1, padding: "12px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", pointerEvents: "auto", visibility: "visible" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, visibility: "visible" },
  modal: { background: "#fff", padding: "30px", borderRadius: "8px", textAlign: "center", width: "300px", zIndex: 2001, maxHeight: "90vh", overflowY: "auto", visibility: "visible" },
  closeModalBtn: { marginTop: "15px", padding: "8px 15px", background: "#1dbf73", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", pointerEvents: "auto", visibility: "visible" }
};

export default AddBook;

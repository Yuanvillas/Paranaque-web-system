require("dotenv").config();

async function uploadBase64ToSupabase(base64Data, bucket, path) {
  if (!base64Data) return "";

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials");
    return "";
  }

  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Clean, "base64");

  try {
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
        "Content-Type": "image/jpeg",
        "Content-Length": buffer.length.toString(),
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`Upload error (${uploadResponse.status}):`, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    console.log(`✅ Image uploaded successfully to: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("❌ Supabase upload error:", err.message);
    throw err;
  }
}

// Helper function to build full image URLs
function getFullImageUrl(imageField) {
  if (!imageField) return null;
  
  // If already a full URL, return as-is
  if (imageField.startsWith('http://') || imageField.startsWith('https://')) {
    return imageField;
  }
  
  // If base64 data, return as-is
  if (imageField.startsWith('data:image/')) {
    return imageField;
  }
  
  // Fix corrupted file extensions (.jpgi -> .jpg)
  let cleanPath = imageField.replace(/\.jpgi$/i, '.jpg');
  
  // If just a filename/path, construct Supabase URL
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rqseuhdpktquhlqojoqg.supabase.co';
  
  // Check if path includes directory (profile/, book/, etc)
  if (cleanPath.includes('/')) {
    return `${supabaseUrl}/storage/v1/object/public/book_bucket/${cleanPath}`;
  } else {
    // If just filename, assume it's in profile directory
    return `${supabaseUrl}/storage/v1/object/public/book_bucket/profile/${cleanPath}`;
  }
}

module.exports = { uploadBase64ToSupabase, getFullImageUrl };

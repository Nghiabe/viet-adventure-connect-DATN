export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Client-side file validation
export const validateImageFile = (file: File): ValidationResult => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Chỉ được phép upload file ảnh (JPG, PNG, GIF, WebP)'
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File quá lớn. Kích thước tối đa là 10MB'
    };
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, WebP'
    };
  }

  return { isValid: true };
};

/**
 * Upload an image file to our self-hosted server
 * @param file - The image file to upload
 * @returns Promise with the public URL string
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    console.log(`[UPLOAD SERVICE] Preparing to upload file: ${file.name} (${file.size} bytes)`);
    
    const formData = new FormData();
    
    // --- THE DEFINITIVE FIX & DIAGNOSTIC ---
    // Rationale: The key used here, "file", MUST EXACTLY MATCH
    // the key the backend is looking for (files.file).
    const key = 'file';
    formData.append(key, file);

    // Log to console to prove we are sending the correct key.
    console.log(`[UPLOAD SERVICE] Appending file to FormData with key: "${key}"`);
    console.log(`[UPLOAD SERVICE] FormData entries:`);
    for (const [formKey, formValue] of formData.entries()) {
      console.log(`[UPLOAD SERVICE] - Key: "${formKey}", Value:`, formValue);
    }
    // --- END FIX & DIAGNOSTIC ---

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
      // IMPORTANT: Do not manually set the 'Content-Type' header when using FormData.
      // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[UPLOAD SERVICE] Upload error response from server:', result);
      // Throw the specific error message from the server
      throw new Error(result.error || 'Image upload failed due to a server error.');
    }

    console.log('[UPLOAD SERVICE] Upload successful. Public URL:', result.data.url);
    return result.data.url;

  } catch (error: any) {
    console.error('[UPLOAD SERVICE] A critical error occurred during upload:', error);
    // Re-throw the error so the calling component's onError can catch it.
    throw error;
  }
};
/**
 * Generates a filename for variant audio files
 * Format: speaker-{id}-{originalName}-{timestamp}.{extension}
 * 
 * @param speakerId - The ID of the speaker
 * @param originalFile - The original file being uploaded
 * @returns Generated filename
 */
export const generateVariantFileName = (speakerId: number, originalFile: File): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' + 
                   new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  
  // Extract name and extension from original file
  const originalName = originalFile.name.split('.')[0];
  const extension = originalFile.name.split('.').pop() || 'mp3';
  
  // Clean the original name (remove special characters that might cause issues)
  const cleanName = originalName.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  return `speaker-${speakerId}-${cleanName}-${timestamp}.${extension}`;
};

/**
 * Updates the filename of a File object
 * 
 * @param file - The original file
 * @param newName - The new filename
 * @returns New File object with updated name
 */
export const updateFileName = (file: File, newName: string): File => {
  return new File([file], newName, { type: file.type });
};




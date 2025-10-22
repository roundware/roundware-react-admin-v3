import { Add, Delete } from "@mui/icons-material";
import {
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Typography
} from "@mui/material";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import useFieldValue from "hooks/useFieldValue";
import React from "react";
import { useRecordContext } from "react-admin";
import VariantAudioPlayer from "./VariantAudioPlayer";

const VariantAudioControls = (): JSX.Element => {
  const [varianturis, setVarianturis] = useFieldValue<string[]>(`varianturis`, []);
  const record = useRecordContext();
  const [uploading, setUploading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteBinary, setDeleteBinary] = React.useState(false);
  const [variantToDelete, setVariantToDelete] = React.useState<number | null>(null);
  const dataProvider = useRoundwareDataProvider();
  
  const speakerId = record?.id || 'new';
  
  // Debug logging
  console.log('VariantAudioControls render - varianturis:', varianturis);

  const handleAddVariant = async (file: File) => {
    console.log('Adding variant file:', file.name);
    setUploading(true);
    
    try {
      // Upload the file using the data provider
      const formData = new FormData();
      formData.append('file', file);
      formData.append('audio_compression', 'false'); // Optional: can be made configurable
      
      console.log('Uploading variant file using data provider...');
      
      // Use the data provider's httpClient to make the request
      const result = await dataProvider.httpClient(
        `${dataProvider.apiUrl}/speakers/${speakerId}/upload-variant/`,
        {
          method: 'POST',
          body: formData,
          headers: new Headers({}), // Let the data provider handle auth headers
        }
      );
      
      console.log('Upload successful, updated speaker:', result.json);
      
      // Update the varianturis array with the new URI
      const newUris = [...varianturis, ...result.json.varianturis.filter((uri: string) => !varianturis.includes(uri))];
      setVarianturis(newUris);
      console.log('Updated varianturis:', newUris);
    } catch (error) {
      console.error('Error uploading variant file:', error);
      // TODO: Show error notification to user
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveExistingVariant = (index: number) => {
    setVariantToDelete(index);
    setDeleteBinary(false); // Default to false
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (variantToDelete === null) return;
    
    const uriToRemove = varianturis[variantToDelete];
    console.log('Removing variant URI:', uriToRemove, 'delete-binary:', deleteBinary);
    
    try {
      // Use the data provider's httpClient to make the request
      const result = await dataProvider.httpClient(
        `${dataProvider.apiUrl}/speakers/${speakerId}/remove-variant-uri/`,
        {
          method: 'POST',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            uri: uriToRemove,
            'delete-binary': deleteBinary
          })
        }
      );
      
      console.log('Remove successful, updated speaker:', result.json);
      
      // Update the varianturis array
      setVarianturis(result.json.varianturis);
      console.log('Updated varianturis after removal:', result.json.varianturis);
    } catch (error) {
      console.error('Error removing variant URI:', error);
      // TODO: Show error notification to user
    } finally {
      setDeleteDialogOpen(false);
      setVariantToDelete(null);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Audio Variants
      </Typography>
      
      {/* Upload new variant */}
      <Box sx={{ mb: 2 }}>
        <input
          type="file"
          accept=".mp3,.wav,.m4a"
          style={{ display: 'none' }}
          id="variant-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleAddVariant(file);
              // Reset the input so the same file can be selected again
              e.target.value = '';
            }
          }}
        />
        <Button
          variant="outlined"
          startIcon={<Add />}
          disabled={uploading}
          onClick={() => {
            document.getElementById('variant-file-input')?.click();
          }}
          sx={{ mb: 1 }}
        >
          {uploading ? 'Uploading...' : 'Add Variant'}
        </Button>
      </Box>

      {/* Display existing variants from database */}
      {varianturis && varianturis.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Existing Variants:
          </Typography>
          {varianturis.map((uri, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Chip label={uri.split('/').pop() || `Variant ${index + 1}`} size="small" />
              <VariantAudioPlayer src={uri} />
              <Button
                size="small"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleRemoveExistingVariant(index)}
              >
                Delete
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-variant-dialog"
      >
        <DialogTitle id="delete-variant-dialog">
          Delete Speaker Variant
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this speaker variant?
          </DialogContentText>
          <FormControlLabel
            control={
              <Checkbox
                checked={deleteBinary}
                onChange={(e) => setDeleteBinary(e.target.checked)}
              />
            }
            label="Delete Binary"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default VariantAudioControls;

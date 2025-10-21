import { Close, ColorLens } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Slider,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useInput } from 'react-admin';

interface ColorPickerProps {
  source: string;
  label: string;
  fullWidth?: boolean;
  helperText?: string;
  defaultValue?: string;
  validate?: (value: any) => string | undefined;
}

const ColorPicker = ({
  source,
  label,
  fullWidth = false,
  helperText,
  defaultValue = '#000000',
  validate,
}: ColorPickerProps) => {
  const {
    field,
    fieldState: { error },
  } = useInput({ source, defaultValue, validate });
  
  const [open, setOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [value, setValue] = useState(100);
  const [alpha, setAlpha] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const colorFieldRef = useRef<HTMLDivElement>(null);

  // Convert hex to HSV
  function hexToHsv(hex: string): { h: number; s: number; v: number; a: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : diff / max;
    const v = max;

    return { h, s: s * 100, v: v * 100, a };
  }

  // Convert HSV to hex
  function hsvToHex(h: number, s: number, v: number, a: number): string {
    const hNorm = h / 360;
    const sNorm = s / 100;
    const vNorm = v / 100;

    const c = vNorm * sNorm;
    const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
    const m = vNorm - c;

    let r = 0, g = 0, b = 0;

    if (hNorm < 1/6) { r = c; g = x; b = 0; }
    else if (hNorm < 2/6) { r = x; g = c; b = 0; }
    else if (hNorm < 3/6) { r = 0; g = c; b = x; }
    else if (hNorm < 4/6) { r = 0; g = x; b = c; }
    else if (hNorm < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    const aHex = a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : '';

    return `#${rHex}${gHex}${bHex}${aHex}`;
  }

  // Initialize HSV values from field value only when field value changes externally
  useEffect(() => {
    const fieldValue = field.value || defaultValue;
    const hsv = hexToHsv(fieldValue);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
    setAlpha(hsv.a);
    setHexInput(fieldValue);
  }, [field.value, defaultValue]);

  const currentHex = hsvToHex(hue, saturation, value, alpha);

  const handleColorFieldClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!colorFieldRef.current) return;
    
    const rect = colorFieldRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;
    
    const newSaturation = Math.max(0, Math.min(100, s));
    const newValue = Math.max(0, Math.min(100, v));
    
    setSaturation(newSaturation);
    setValue(newValue);
    
    const newHex = hsvToHex(hue, newSaturation, newValue, alpha);
    setHexInput(newHex);
    field.onChange(newHex);
  };

  const handleHueChange = (event: Event, newValue: number | number[]) => {
    const newHue = newValue as number;
    setHue(newHue);
    
    const newHex = hsvToHex(newHue, saturation, value, alpha);
    setHexInput(newHex);
    field.onChange(newHex);
  };

  const handleAlphaChange = (event: Event, newValue: number | number[]) => {
    const newAlpha = (newValue as number) / 100;
    setAlpha(newAlpha);
    
    const newHex = hsvToHex(hue, saturation, value, newAlpha);
    setHexInput(newHex);
    field.onChange(newHex);
  };

  const handleHexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setHexInput(value);
    
    const formatted = formatHex(value);
    if (isValidHex(formatted)) {
      const hsv = hexToHsv(formatted);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setAlpha(hsv.a);
      field.onChange(formatted);
    } else if (value.length > 0) {
      // Only show error if there's actually content to validate
      field.onChange(value); // This will trigger validation
    }
  };

  const isValidHex = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(hex);
  };

  const formatHex = (hex: string) => {
    if (hex.startsWith('#')) return hex;
    return `#${hex}`;
  };

  return (
    <Box>
      <TextField
        label={label}
        fullWidth={fullWidth}
        helperText={helperText}
        error={!!error}
        value={hexInput}
        onChange={handleHexChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: currentHex,
                  border: '1px solid #ccc',
                  borderRadius: 1,
                }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setOpen(true)}
                edge="end"
                size="small"
              >
                <ColorLens />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Choose Color</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Color Picker
            </Typography>
            
            {/* Color Preview */}
            <Box mb={3} display="flex" alignItems="center" gap={2}>
              <Typography variant="body2">Preview:</Typography>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  backgroundColor: currentHex,
                  border: '1px solid #ccc',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" fontFamily="monospace">
                {currentHex}
              </Typography>
            </Box>

            {/* 2D Color Field */}
            <Box mb={3}>
              <Typography gutterBottom>Color</Typography>
              <Box
                ref={colorFieldRef}
                onClick={handleColorFieldClick}
                sx={{
                  width: '100%',
                  height: 200,
                  background: `linear-gradient(to right, 
                    hsl(${hue}, 0%, 50%), 
                    hsl(${hue}, 100%, 50%)
                  ), linear-gradient(to bottom, 
                    transparent, 
                    black
                  )`,
                  backgroundBlendMode: 'multiply',
                  cursor: 'crosshair',
                  position: 'relative',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                }}
              >
                {/* Color selector circle */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${saturation}%`,
                    top: `${100 - value}%`,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid white',
                    backgroundColor: currentHex,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                  }}
                />
              </Box>
            </Box>

            {/* Hue Slider */}
            <Box mb={3}>
              <Typography gutterBottom>Hue</Typography>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 8,
                    transform: 'translateY(-50%)',
                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                    borderRadius: 4,
                    zIndex: 1,
                  }}
                />
                <Slider
                  value={hue}
                  onChange={handleHueChange}
                  min={0}
                  max={360}
                  step={1}
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    '& .MuiSlider-track': {
                      display: 'none',
                    },
                    '& .MuiSlider-rail': {
                      display: 'none',
                    },
                    '& .MuiSlider-thumb': {
                      width: 20,
                      height: 20,
                      backgroundColor: `hsl(${hue}, 100%, 50%)`,
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Alpha Slider */}
            <Box mb={3}>
              <Typography gutterBottom>Alpha (Transparency)</Typography>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 8,
                    transform: 'translateY(-50%)',
                    background: `linear-gradient(to right, 
                      transparent, 
                      ${hsvToHex(hue, saturation, value, 1)}
                    )`,
                    borderRadius: 4,
                    zIndex: 1,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'repeating-conic-gradient(#ccc 0deg 90deg, #fff 90deg 180deg)',
                      borderRadius: 4,
                      zIndex: -1,
                    },
                  }}
                />
                <Slider
                  value={alpha * 100}
                  onChange={handleAlphaChange}
                  min={0}
                  max={100}
                  step={1}
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    '& .MuiSlider-track': {
                      display: 'none',
                    },
                    '& .MuiSlider-rail': {
                      display: 'none',
                    },
                    '& .MuiSlider-thumb': {
                      width: 20,
                      height: 20,
                      backgroundColor: currentHex,
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Hex Input */}
            <Box mt={3}>
              <TextField
                fullWidth
                label="Hex Color"
                value={hexInput}
                onChange={handleHexChange}
                placeholder="#000000 or #00000080"
                helperText="Enter 6 or 8 character hex color (with or without #)"
                error={!!(hexInput && !isValidHex(formatHex(hexInput)))}
                inputProps={{
                  style: { fontFamily: 'monospace' }
                }}
              />
            </Box>
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => setOpen(false)}
            >
              Apply
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ColorPicker;

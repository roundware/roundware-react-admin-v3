// ---------------------------------------------------------------------------
// Reusable instructional text block shown at the top of each wizard step
// ---------------------------------------------------------------------------
import React from "react";
import { Alert, AlertTitle, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface StepInstructionProps {
  title: string;
  children: React.ReactNode;
}

const StepInstruction: React.FC<StepInstructionProps> = ({ title, children }) => (
  <Alert
    severity="info"
    icon={<InfoOutlinedIcon />}
    sx={{ mb: 3 }}
  >
    <AlertTitle>{title}</AlertTitle>
    <Typography variant="body2" component="div">
      {children}
    </Typography>
  </Alert>
);

export default StepInstruction;

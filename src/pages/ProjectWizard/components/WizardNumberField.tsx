import { TextField, TextFieldProps } from "@mui/material";
import React, { useEffect, useState } from "react";

type Props = Omit<TextFieldProps, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (value: number) => void;
  /** Whole numbers only. */
  integer?: boolean;
};

const parse = (text: string, integer?: boolean) => (integer ? parseInt(text, 10) : parseFloat(text));

/**
 * A number input that edits like text.
 *
 * The wizard's number fields were `value={n}` with `parseX(text) || 0`, so a
 * field could never be empty — clearing it put the 0 straight back — and
 * typing after that 0 left it in place: 100 showed as "0100". This keeps the
 * text as typed, reports each number it parses to, selects the contents on
 * focus so typing replaces them, drops a leading zero typed ahead of other
 * digits, and on leaving an empty field shows the value again.
 */
const WizardNumberField: React.FC<Props> = ({ value, onChange, integer, onFocus, onBlur, ...props }) => {
  const [text, setText] = useState(String(value));

  // Follow changes made elsewhere (e.g. a location picked on the map).
  useEffect(() => {
    if (parse(text, integer) !== value) setText(String(value));
  }, [value]);

  return (
    <TextField
      {...props}
      type="number"
      value={text}
      onFocus={(e) => {
        e.target.select();
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/^(-?)0+(?=\d)/, "$1");
        setText(raw);
        const n = parse(raw, integer);
        if (!Number.isNaN(n)) onChange(n);
      }}
      onBlur={(e) => {
        if (Number.isNaN(parse(text, integer))) setText(String(value));
        onBlur?.(e);
      }}
    />
  );
};

export default WizardNumberField;

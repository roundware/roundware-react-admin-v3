// Re-export React Router's built-in useBlocker.
// The old custom implementation used `navigator.block()` from the `history`
// library, which was removed in React Router v6.4+.
export { useBlocker } from "react-router-dom";

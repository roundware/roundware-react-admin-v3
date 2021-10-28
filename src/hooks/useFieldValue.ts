import { useField } from 'react-final-form';

const useFieldValue = (fieldName: string) => {
    const { input: { value, onChange: setValue}} = useField(fieldName);
    return [value, setValue];
}

export default useFieldValue;
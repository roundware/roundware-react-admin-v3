import { useField } from 'react-final-form';

const useFieldValue = <T>(fieldName: string): [T, (newValue: T) => void] => {
    const { input: { value, onChange: setValue}} = useField(fieldName);
    return [value, setValue];
}

export default useFieldValue;
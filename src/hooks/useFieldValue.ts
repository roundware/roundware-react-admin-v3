import { useField } from 'react-final-form';

const useFieldValue = <T>(fieldName: string, defaultValue?: T): [T, (newValue: T) => void] => {
    const { input: { value, onChange: setValue } } = useField(fieldName, {
        defaultValue,
        
    });
    return [value, setValue];
}

export default useFieldValue;
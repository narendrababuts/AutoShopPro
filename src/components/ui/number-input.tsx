import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface NumberInputProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  id?: string;
  placeholder?: string;
  allowDecimals?: boolean;
  disabled?: boolean;
}

const NumberInput = ({ 
  value, 
  onValueChange, 
  min, 
  max, 
  step = 1,
  className = '',
  id,
  placeholder = '',
  allowDecimals = false,
  disabled = false
}: NumberInputProps) => {
  const [displayValue, setDisplayValue] = useState<string>('');

  // Initialize display value
  useEffect(() => {
    setDisplayValue(value === 0 ? '' : value.toString());
  }, [value]);

  // FIXED: Remove leading zeros while preserving decimal cases
  const removeLeadingZeros = (inputValue: string): string => {
    // If empty, return as is
    if (inputValue === '') {
      return inputValue;
    }
    
    // For decimal numbers starting with 0 (like 0.5), keep the zero
    if (inputValue.startsWith('0.') && allowDecimals) {
      return inputValue;
    }
    
    // Remove ALL leading zeros and prevent 0600 -> 600
    const cleanValue = inputValue.replace(/^0+/, '');
    
    // If we removed all characters (was all zeros), return single zero
    if (cleanValue === '') {
      return '0';
    }
    
    return cleanValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Handle empty input
    if (inputValue === '') {
      setDisplayValue('');
      onValueChange(0);
      return;
    }
    
    // FIXED: Immediately remove leading zeros to prevent 0600 display
    inputValue = removeLeadingZeros(inputValue);
    
    // Store the display value for UX purposes
    setDisplayValue(inputValue);
    
    // If we don't allow decimals and the input contains a decimal point, return
    if (!allowDecimals && inputValue.includes('.')) {
      return;
    }
    
    // Parse the number, handling edge cases properly
    const parsedValue = allowDecimals ? parseFloat(inputValue) : parseInt(inputValue, 10);
    
    if (!isNaN(parsedValue)) {
      if (min !== undefined && parsedValue < min) {
        onValueChange(min);
        setDisplayValue(min.toString());
      } else if (max !== undefined && parsedValue > max) {
        onValueChange(max);
        setDisplayValue(max.toString());
      } else {
        onValueChange(parsedValue);
      }
    }
  };

  // FIXED: Handle blur to clean up display value and remove any lingering zeros
  const handleBlur = () => {
    if (displayValue === '' || displayValue === '0') {
      setDisplayValue('');
      onValueChange(0);
    } else if (!isNaN(Number(displayValue))) {
      // Clean up any remaining formatting issues on blur
      const cleanValue = allowDecimals ? parseFloat(displayValue) : parseInt(displayValue, 10);
      const normalizedValue = cleanValue.toString();
      setDisplayValue(normalizedValue);
      onValueChange(cleanValue);
    }
  };

  // FIXED: Handle input event to prevent leading zeros in real-time
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    let inputValue = target.value;
    
    // Prevent leading zeros in real-time
    if (inputValue.length > 1 && inputValue.startsWith('0') && !inputValue.startsWith('0.')) {
      inputValue = removeLeadingZeros(inputValue);
      target.value = inputValue;
      setDisplayValue(inputValue);
    }
  };

  return (
    <Input
      id={id}
      type="number"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onInput={handleInput}
      min={min}
      max={max}
      step={step}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default NumberInput;

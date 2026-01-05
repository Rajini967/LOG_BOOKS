import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LogbookField } from '@/types/logbook-config';
import { cn } from '@/lib/utils';

interface FieldWithValidationProps {
  field: LogbookField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldWithValidation({ 
  field, 
  value, 
  onChange, 
  error,
  disabled = false 
}: FieldWithValidationProps) {
  const isOutOfLimit = () => {
    if (!field.metadata?.limit || value === null || value === undefined || value === '') {
      return false;
    }

    const limit = field.metadata.limit;
    const numValue = parseFloat(value);

    if (isNaN(numValue)) return false;

    switch (limit.type) {
      case 'max':
        return numValue > limit.value;
      case 'min':
        return numValue < limit.value;
      default:
        return false;
    }
  };

  const outOfLimit = isOutOfLimit();
  const limitInfo = field.metadata?.limit;
  const columnSpan = field.display?.columnSpan || 1;

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            className={cn(
              outOfLimit && 'border-destructive bg-destructive/5 text-destructive font-semibold'
            )}
          />
        );

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            step="0.01"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            required={field.required}
            disabled={disabled}
            className={cn(
              outOfLimit && 'border-destructive bg-destructive/5 text-destructive font-semibold'
            )}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(
              outOfLimit && 'border-destructive bg-destructive/5'
            )}>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        );

      case 'datetime':
        return (
          <Input
            id={field.id}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            <Label htmlFor={field.id} className="font-normal cursor-pointer">
              {field.placeholder || 'Yes'}
            </Label>
          </div>
        );

      case 'calculated':
        return (
          <div className="p-2 bg-muted rounded-md font-mono text-foreground">
            {value !== null && value !== undefined ? value : '—'}
          </div>
        );

      default:
        return (
          <Input
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={cn(
      'space-y-2',
      columnSpan === 2 && 'col-span-2',
      columnSpan === 3 && 'col-span-3',
      columnSpan === 4 && 'col-span-4'
    )}>
      <Label htmlFor={field.id} className="flex items-center justify-between">
        <span>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </span>
        {limitInfo && (
          <span className="text-xs text-muted-foreground font-normal">
            {limitInfo.condition} {limitInfo.value} {limitInfo.unit}
          </span>
        )}
      </Label>
      {renderField()}
      {outOfLimit && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span>⚠️</span>
          <span>Value exceeds limit: {limitInfo?.condition} {limitInfo?.value} {limitInfo?.unit}</span>
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {field.validation?.customMessage && !outOfLimit && (
        <p className="text-xs text-muted-foreground">{field.validation.customMessage}</p>
      )}
    </div>
  );
}


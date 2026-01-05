/**
 * Simple formula calculator for logbook calculated fields
 * Supports basic arithmetic operations: +, -, *, /, ()
 * 
 * Example formulas:
 * - "(v1 + v2 + v3) / 3" - Average
 * - "field1 * field2" - Multiplication
 * - "(total_air_flow * 60) / room_volume" - ACH calculation
 */

export function calculateFormula(
  formula: string,
  fieldValues: Record<string, any>,
  fieldNames: Record<string, string> = {}
): number | string | null {
  try {
    // Handle conditional expressions (e.g., ternary operators)
    if (formula.includes('?') && formula.includes(':')) {
      return calculateConditional(formula, fieldValues, fieldNames);
    }

    // Replace field IDs/names with their values
    let expression = formula;
    
    // Replace field references with actual values
    Object.entries(fieldNames).forEach(([fieldId, fieldName]) => {
      const value = fieldValues[fieldId];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          // Replace both field ID and field name in formula
          expression = expression.replace(new RegExp(fieldId, 'g'), numValue.toString());
          expression = expression.replace(new RegExp(fieldName, 'g'), numValue.toString());
        }
      }
    });

    // Also try to replace any remaining field IDs directly (use word boundaries)
    Object.keys(fieldValues).forEach(fieldId => {
      const value = fieldValues[fieldId];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          // Use word boundaries to avoid partial matches
          expression = expression.replace(new RegExp(`\\b${fieldId}\\b`, 'g'), numValue.toString());
        }
      }
    });

    // Evaluate the expression safely
    // Note: In production, use a proper expression parser library
    const result = Function(`"use strict"; return (${expression})`)();
    
    if (typeof result === 'string') {
      return result;
    }
    
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch (error) {
    console.error('Formula calculation error:', error, { formula, fieldValues });
    return null;
  }
}

function calculateConditional(
  formula: string,
  fieldValues: Record<string, any>,
  fieldNames: Record<string, string>
): string | null {
  try {
    // Parse ternary: condition ? "valueIfTrue" : "valueIfFalse"
    // Example: downstream_leakage <= acceptable_limit ? "PASS" : "FAIL"
    const match = formula.match(/^(.+?)\s*\?\s*"(.+?)"\s*:\s*"(.+?)"$/);
    if (!match) return null;

    const [, condition, trueValue, falseValue] = match;
    
    // Replace field references in condition with actual values
    let conditionExpr = condition;
    
    // First try field names mapping
    Object.entries(fieldNames).forEach(([fieldId, fieldName]) => {
      const value = fieldValues[fieldId];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          conditionExpr = conditionExpr.replace(new RegExp(`\\b${fieldId}\\b`, 'g'), numValue.toString());
          conditionExpr = conditionExpr.replace(new RegExp(`\\b${fieldName}\\b`, 'g'), numValue.toString());
        }
      }
    });
    
    // Then try direct field IDs
    Object.keys(fieldValues).forEach(fieldId => {
      const value = fieldValues[fieldId];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          conditionExpr = conditionExpr.replace(new RegExp(`\\b${fieldId}\\b`, 'g'), numValue.toString());
        }
      }
    });

    // Evaluate condition
    const conditionResult = Function(`"use strict"; return (${conditionExpr})`)();
    
    return conditionResult ? trueValue : falseValue;
  } catch (error) {
    console.error('Conditional calculation error:', error);
    return null;
  }
}

/**
 * Format calculated value based on field metadata
 */
export function formatCalculatedValue(
  value: number | null,
  decimalPlaces?: number
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  if (decimalPlaces !== undefined) {
    return value.toFixed(decimalPlaces);
  }

  // Auto-detect decimal places (max 4)
  const rounded = Math.round(value * 10000) / 10000;
  return rounded.toString();
}


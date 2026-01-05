import { LogbookSchema } from '@/types/logbook-config';
import { allSchemas } from '@/data/logbook-schemas';

const STORAGE_KEY = 'logbook_schemas';

/**
 * Get all schemas (default + custom)
 */
export function getAllSchemas(): LogbookSchema[] {
  // Get default schemas
  const defaultSchemas = allSchemas;
  
  // Get custom schemas from localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const customSchemas: LogbookSchema[] = JSON.parse(stored);
      // Convert date strings back to Date objects
      customSchemas.forEach(schema => {
        if (schema.createdAt) schema.createdAt = new Date(schema.createdAt);
        if (schema.updatedAt) schema.updatedAt = new Date(schema.updatedAt);
      });
      return [...defaultSchemas, ...customSchemas];
    }
  } catch (error) {
    console.error('Error loading custom schemas:', error);
  }
  
  return defaultSchemas;
}

/**
 * Save a custom schema
 */
export function saveSchema(schema: LogbookSchema): void {
  try {
    const existing = getAllSchemas();
    const customSchemas = existing.filter(s => s.id.startsWith('custom-'));
    
    // Check if updating existing or adding new
    const existingIndex = customSchemas.findIndex(s => s.id === schema.id);
    if (existingIndex >= 0) {
      customSchemas[existingIndex] = schema;
    } else {
      customSchemas.push(schema);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customSchemas));
  } catch (error) {
    console.error('Error saving schema:', error);
    throw error;
  }
}

/**
 * Delete a custom schema
 */
export function deleteSchema(schemaId: string): void {
  try {
    const existing = getAllSchemas();
    const customSchemas = existing.filter(s => s.id.startsWith('custom-') && s.id !== schemaId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customSchemas));
  } catch (error) {
    console.error('Error deleting schema:', error);
    throw error;
  }
}

/**
 * Get schema by ID
 */
export function getSchemaById(id: string): LogbookSchema | undefined {
  return getAllSchemas().find(s => s.id === id);
}


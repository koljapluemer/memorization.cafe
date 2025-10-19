import Papa from 'papaparse';

export type EntityType = 'flashcard' | 'concept' | 'list' | 'cloze';

export interface FlashcardCsvRow {
  front: string;
  back: string;
  practiceAsFlashcard: string;
  practiceAsPrompt: string;
}

export interface ConceptCsvRow {
  name: string;
  description: string;
}

export interface ListCsvRow {
  name: string;
  items: string;
  isOrderedList: string;
  note: string;
}

export interface ClozeCsvRow {
  content: string;
  clozeStrategy: string;
  indices: string;
  preExercise: string;
  postExercise: string;
}

/**
 * Generates example CSV content for a given entity type
 */
export function generateExampleCsv(type: EntityType): string {
  switch (type) {
    case 'flashcard':
      return `front,back,practiceAsFlashcard,practiceAsPrompt
"What is the capital of France?","Paris",true,false
"Translate 'hello' to Spanish","hola",true,true
"2 + 2 = ?","4",false,true`;

    case 'concept':
      return `name,description
"Photosynthesis","The process by which plants convert sunlight into energy"
"Mitosis","Cell division resulting in two identical daughter cells"
"Democracy","A system of government by the whole population through elected representatives"`;

    case 'list':
      return `name,items,isOrderedList,note
"Planets","Mercury|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune",true,"In order from the sun"
"Primary Colors","Red|Blue|Yellow",false,"Mix these to create other colors"
"Steps to Brew Coffee","Grind beans|Heat water|Add grounds|Pour water|Wait|Pour",true,""`;

    case 'cloze':
      return `content,clozeStrategy,indices,preExercise,postExercise
"The quick brown fox jumps over the lazy dog",atSpace,"[2,4,8]","Fill in the blanks:",""
"photosynthesis",atEveryCharacter,"[0,1,2,3,4]","Complete the word:","This process occurs in plants"
"H2O is the chemical formula for water",atSpace,"[0,6]","","What do these represent?"`;

    default:
      return '';
  }
}

/**
 * Triggers a browser download of CSV content
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Parses CSV text into an array of objects
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    if (firstError) {
      throw new Error(`CSV parse error at row ${firstError.row}: ${firstError.message}`);
    }
  }

  if (result.data.length === 0) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  return result.data;
}

/**
 * Validates CSV data for a specific entity type
 */
export function validateCsvData(type: EntityType, data: Record<string, string>[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('CSV file contains no data rows');
    return { valid: false, errors };
  }

  switch (type) {
    case 'flashcard':
      data.forEach((row, index) => {
        if (!row.front?.trim()) {
          errors.push(`Row ${index + 2}: 'front' is required`);
        }
        if (!row.back?.trim()) {
          errors.push(`Row ${index + 2}: 'back' is required`);
        }
        if (row.practiceAsFlashcard && !['true', 'false', ''].includes(row.practiceAsFlashcard.toLowerCase())) {
          errors.push(`Row ${index + 2}: 'practiceAsFlashcard' must be 'true' or 'false'`);
        }
        if (row.practiceAsPrompt && !['true', 'false', ''].includes(row.practiceAsPrompt.toLowerCase())) {
          errors.push(`Row ${index + 2}: 'practiceAsPrompt' must be 'true' or 'false'`);
        }
      });
      break;

    case 'concept':
      data.forEach((row, index) => {
        if (!row.name?.trim()) {
          errors.push(`Row ${index + 2}: 'name' is required`);
        }
      });
      break;

    case 'list':
      data.forEach((row, index) => {
        if (!row.name?.trim()) {
          errors.push(`Row ${index + 2}: 'name' is required`);
        }
        if (!row.items?.trim()) {
          errors.push(`Row ${index + 2}: 'items' is required`);
        }
        if (row.isOrderedList && !['true', 'false', ''].includes(row.isOrderedList.toLowerCase())) {
          errors.push(`Row ${index + 2}: 'isOrderedList' must be 'true' or 'false'`);
        }
      });
      break;

    case 'cloze':
      data.forEach((row, index) => {
        if (!row.content?.trim()) {
          errors.push(`Row ${index + 2}: 'content' is required`);
        }
        if (!row.clozeStrategy?.trim()) {
          errors.push(`Row ${index + 2}: 'clozeStrategy' is required`);
        } else if (!['atSpace', 'atEveryCharacter', 'split'].includes(row.clozeStrategy)) {
          errors.push(`Row ${index + 2}: 'clozeStrategy' must be 'atSpace', 'atEveryCharacter', or 'split'`);
        }
        if (!row.indices?.trim()) {
          errors.push(`Row ${index + 2}: 'indices' is required`);
        } else {
          try {
            const parsed = JSON.parse(row.indices);
            if (!Array.isArray(parsed) || !parsed.every(i => typeof i === 'number')) {
              errors.push(`Row ${index + 2}: 'indices' must be a JSON array of numbers`);
            }
          } catch {
            errors.push(`Row ${index + 2}: 'indices' must be valid JSON array`);
          }
        }
      });
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Reads a File object and returns its text content
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        resolve(text);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

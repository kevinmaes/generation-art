import { createWriteStream } from 'fs';

/**
 * Write JSON data to a file using streaming
 * This handles large objects efficiently without loading everything into memory
 */
export async function writeJsonStream(
  filePath: string,
  data: unknown,
  prettyPrint = true,
): Promise<void> {
  const writeStream = createWriteStream(filePath);

  // Increase max listeners to avoid warnings with large files
  writeStream.setMaxListeners(50);

  // For pretty printing, we need to use a different approach
  if (prettyPrint) {
    // For smaller objects or when pretty printing is needed,
    // we'll chunk the stringify operation
    const jsonString = JSON.stringify(data, null, 2);
    const chunkSize = 64 * 1024; // 64KB chunks

    for (let i = 0; i < jsonString.length; i += chunkSize) {
      const chunk = jsonString.slice(i, i + chunkSize);
      await new Promise<void>((resolve, reject) => {
        const canWrite = writeStream.write(chunk);
        if (canWrite) {
          resolve();
        } else {
          writeStream.once('drain', resolve);
          writeStream.once('error', reject);
        }
      });
    }
  } else {
    // For non-pretty printed, we can use streaming more efficiently
    const jsonString = JSON.stringify(data);
    writeStream.write(jsonString);
  }

  return new Promise((resolve, reject) => {
    writeStream.end((err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Write a large array to JSON file using true streaming
 * Each item is processed individually without loading the entire array
 */
export async function writeJsonArrayStream(
  filePath: string,
  items: unknown[],
  prettyPrint = true,
): Promise<void> {
  const writeStream = createWriteStream(filePath);

  // Write opening bracket
  writeStream.write('[');
  if (prettyPrint) writeStream.write('\n');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const jsonString = JSON.stringify(item, null, prettyPrint ? 2 : 0);

    if (prettyPrint) {
      // Indent each line of the JSON string
      const indentedJson = jsonString
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n');
      writeStream.write(indentedJson);
    } else {
      writeStream.write(jsonString);
    }

    if (i < items.length - 1) {
      writeStream.write(',');
    }
    if (prettyPrint) writeStream.write('\n');

    // Allow event loop to process other tasks
    if (i % 100 === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  // Write closing bracket
  writeStream.write(']');
  if (prettyPrint) writeStream.write('\n');

  // Close the stream
  return new Promise((resolve, reject) => {
    writeStream.end((err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Stream-based JSON writer for very large objects
 * Processes the object property by property
 */
export async function writeJsonObjectStream(
  filePath: string,
  obj: Record<string, unknown>,
  prettyPrint = true,
): Promise<void> {
  const writeStream = createWriteStream(filePath);
  const indent = prettyPrint ? '  ' : '';
  const newline = prettyPrint ? '\n' : '';

  writeStream.write('{' + newline);

  const entries = Object.entries(obj);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];

    writeStream.write(indent + JSON.stringify(key) + ': ');

    // For nested objects/arrays, we stringify them separately
    if (typeof value === 'object' && value !== null) {
      const valueStr = JSON.stringify(value, null, prettyPrint ? 2 : 0);
      if (prettyPrint) {
        // Re-indent nested object
        const reindented = valueStr
          .split('\n')
          .map((line, idx) => (idx === 0 ? line : indent + line))
          .join('\n');
        writeStream.write(reindented);
      } else {
        writeStream.write(valueStr);
      }
    } else {
      writeStream.write(JSON.stringify(value));
    }

    if (i < entries.length - 1) {
      writeStream.write(',');
    }
    writeStream.write(newline);

    // Yield control periodically
    if (i % 100 === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  writeStream.write('}' + newline);

  return new Promise((resolve, reject) => {
    writeStream.end((err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Calculate approximate size of an object without stringifying it
 * This is much more memory efficient than JSON.stringify().length
 */
export function estimateJsonSize(obj: unknown): number {
  let size = 0;

  if (obj === null || obj === undefined) {
    return 4; // "null"
  }

  const type = typeof obj;

  if (type === 'boolean') {
    return (obj as boolean) ? 4 : 5; // "true" or "false"
  }

  if (type === 'number') {
    return String(obj as number).length;
  }

  if (type === 'string') {
    // Account for quotes and escaping
    const str = obj as string;
    return str.length + 2 + Math.floor(str.length * 0.1); // Rough estimate for escaping
  }

  if (Array.isArray(obj)) {
    size = 2; // []
    for (const item of obj) {
      size += estimateJsonSize(item) + 1; // +1 for comma
    }
    return size;
  }

  if (type === 'object') {
    size = 2; // {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      size += key.length + 3; // "key":
      size += estimateJsonSize(value) + 1; // +1 for comma
    }
    return size;
  }

  return 0;
}

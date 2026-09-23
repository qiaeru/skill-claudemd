export function detectDelimiter(firstLine) {
  return firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
}

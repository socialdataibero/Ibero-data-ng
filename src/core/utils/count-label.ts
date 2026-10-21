/** "1 fuente", "3 fuentes": a count with its Spanish noun, for cards that would print English. */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

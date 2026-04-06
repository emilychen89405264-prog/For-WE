export interface Question {
  id: number;
  num1: number;
  num2: number;
  answer: number;
}

export type Grade = 1 | 2 | 3 | 4;

export const generateQuestions = (grade: Grade): Question[] => {
  const questions: Question[] = [];
  const used = new Set<string>();

  let count = 0;
  let attempts = 0;
  const maxAttempts = 2000;

  while (count < 50 && attempts < maxAttempts) {
    attempts++;
    let n1 = 0;
    let n2 = 0;

    if (grade === 1) {
      // 一年級：兩位數 (10-30) 乘以 一位數 (2-9) -> 足夠產生 50 題
      n1 = Math.floor(Math.random() * 21) + 10;
      n2 = Math.floor(Math.random() * 8) + 2;
    } else if (grade === 2) {
      // 二年級：兩位數 (10-99) 乘以 一位數 (2-9)
      n1 = Math.floor(Math.random() * 90) + 10;
      n2 = Math.floor(Math.random() * 8) + 2;
    } else if (grade === 3) {
      // 三年級：兩位數 (10-99) 乘以 兩位數 (10-99)
      n1 = Math.floor(Math.random() * 90) + 10;
      n2 = Math.floor(Math.random() * 90) + 10;
    } else if (grade === 4) {
      // 四年級：三位數 (100-999) 乘以 兩位數 (10-99)
      n1 = Math.floor(Math.random() * 900) + 100;
      n2 = Math.floor(Math.random() * 90) + 10;
    }

    const key = `${n1}x${n2}`;
    if (!used.has(key)) {
      used.add(key);
      questions.push({
        id: count + 1,
        num1: n1,
        num2: n2,
        answer: n1 * n2,
      });
      count++;
    }
  }
  return questions;
};

export const calculateGradeWithSettings = (grades, settings) => {
  const { categoryWeights } = settings;
  
  // Group grades by category
  const gradesByCategory = {};
  grades.forEach(grade => {
    if (!gradesByCategory[grade.category]) {
      gradesByCategory[grade.category] = [];
    }
    gradesByCategory[grade.category].push(grade);
  });
  
  // Calculate weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  
  Object.entries(categoryWeights).forEach(([category, weight]) => {
    if (gradesByCategory[category] && gradesByCategory[category].length > 0) {
      const categoryAverage = calculateCategoryAverage(gradesByCategory[category]);
      weightedSum += categoryAverage * weight;
      totalWeight += weight;
    }
  });
  
  // If no weights are applied, return simple average
  if (totalWeight === 0) {
    return calculateSimpleAverage(grades);
  }
  
  return weightedSum / totalWeight;
};

const calculateCategoryAverage = (grades) => {
  if (grades.length === 0) return 0;
  
  const total = grades.reduce((sum, grade) => {
    return sum + (grade.score / grade.max_score * 100);
  }, 0);
  
  return total / grades.length;
};

const calculateSimpleAverage = (grades) => {
  if (grades.length === 0) return 0;
  
  const total = grades.reduce((sum, grade) => {
    return sum + (grade.score / grade.max_score * 100);
  }, 0);
  
  return total / grades.length;
};

export const getLetterGrade = (percentage, gradingScale) => {
  if (percentage >= gradingScale.A) return 'A';
  if (percentage >= gradingScale.B) return 'B';
  if (percentage >= gradingScale.C) return 'C';
  if (percentage >= gradingScale.D) return 'D';
  return 'F';
};

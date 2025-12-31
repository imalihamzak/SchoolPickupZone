import type { Family, FilterValues } from './types';

export const filterFamilies = (families: Family[], filters: FilterValues) => {
  return families.filter(family => {
    const matchesStatus = !filters.status || family.status.toLowerCase() === filters.status.toLowerCase();
    
    const matchesGrade = !filters.grade || family.children.some(
      child => child.grade === filters.grade
    );
    
    const totalMembers = 1 + family.guardians.length + family.children.length;
    const matchesSize = !filters.membersCount || (
      (filters.membersCount === 'small' && totalMembers <= 3) ||
      (filters.membersCount === 'medium' && totalMembers > 3 && totalMembers <= 5) ||
      (filters.membersCount === 'large' && totalMembers > 5)
    );

    return matchesStatus && matchesGrade && matchesSize;
  });
};

export const searchFamilies = (families: Family[], searchTerm: string) => {
  const term = searchTerm.toLowerCase();
  return families.filter(family => {
    return (
      family.familyName.toLowerCase().includes(term) ||
      family.parent.name.toLowerCase().includes(term) ||
      family.parent.email.toLowerCase().includes(term) ||
      family.children.some(child => child.name.toLowerCase().includes(term)) ||
      family.guardians.some(guardian => guardian.name.toLowerCase().includes(term))
    );
  });
};

export const validateFamily = (family: Family): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!family.parent.name) errors.push('Parent name is required');
  if (!family.parent.email) errors.push('Parent email is required');
  if (!family.parent.phone) errors.push('Parent phone is required');
  
  if (family.guardians.length === 0) {
    errors.push('At least one guardian is required');
  }
  
  if (family.children.length === 0) {
    errors.push('At least one child is required');
  }

  family.guardians.forEach((guardian, index) => {
    if (!guardian.name) errors.push(`Guardian ${index + 1} name is required`);
    if (!guardian.phone) errors.push(`Guardian ${index + 1} phone is required`);
    if (!guardian.relation) errors.push(`Guardian ${index + 1} relation is required`);
  });

  family.children.forEach((child, index) => {
    if (!child.name) errors.push(`Child ${index + 1} name is required`);
    if (!child.grade) errors.push(`Child ${index + 1} grade is required`);
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
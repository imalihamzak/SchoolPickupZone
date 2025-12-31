// pages/admin/profiles/utils.ts
import type { Family, FilterValues } from './types';

export const filterFamilies = (families: Family[], filters: FilterValues) => {
  return families.filter(family => {
    const matchesStatus = !filters.status || family.status.toLowerCase() === filters.status.toLowerCase();
    
    const matchesGrade = !filters.grade || family.children.some(
      (child: any) => child.grade === filters.grade
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
      family.children.some((child: any) => child.name.toLowerCase().includes(term)) ||
      family.guardians.some((guardian: any) => guardian.name.toLowerCase().includes(term))
    );
  });
};
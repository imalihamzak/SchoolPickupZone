import { Family as BaseFamily } from '../../../../components/admin/profiles/types';

export interface Family extends BaseFamily {
  submittedAt?: string;
  parent: {
    name: string;
    email: string;
  };
}

export interface FilterValues {
  status?: string;
  grade?: string;
  membersCount?: 'small' | 'medium' | 'large';
}

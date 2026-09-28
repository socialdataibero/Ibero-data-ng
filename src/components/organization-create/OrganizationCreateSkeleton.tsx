import { FormSkeleton } from '../shared/skeleton/FormSkeleton';

export function OrganizationCreateSkeleton() {
  return <FormSkeleton columns={[[{ fields: ['input', 'input', 'textarea'] }]]} />;
}

import { FormSkeleton } from '../shared/skeleton/FormSkeleton';

export function DatasetCreateSkeleton() {
  return (
    <FormSkeleton
      columns={[
        [{ fields: ['input', 'input', 'textarea'] }, { fields: ['input', 'input', 'input'] }],
        [{ fields: ['input', 'input', 'input', 'input'] }, { fields: ['input'] }],
      ]}
    />
  );
}

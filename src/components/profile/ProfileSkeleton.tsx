import { FormSkeleton } from '../shared/skeleton/FormSkeleton';

export function ProfileSkeleton() {
  return (
    <FormSkeleton
      headerAction={false}
      columns={[
        [{ fields: ['input', 'input', 'input', 'input'] }],
        [{ fields: ['input', 'input', 'input'] }],
      ]}
    />
  );
}

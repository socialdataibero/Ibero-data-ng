import { FormSkeleton } from '../../shared/skeleton/FormSkeleton';

export function HarmonizerUploadSkeleton() {
  return (
    <FormSkeleton
      narrow
      actions={1}
      columns={[[{ fields: ['input', 'input', 'input', 'input'] }]]}
    />
  );
}

import { FormSkeleton } from '../../shared/skeleton/FormSkeleton';

export function HarmonizerNewSurveySkeleton() {
  return <FormSkeleton narrow actions={1} columns={[[{ fields: ['input', 'input'] }]]} />;
}

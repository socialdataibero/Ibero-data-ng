import { PageHeaderSkeleton } from '../page-header/PageHeaderSkeleton';
import { Skeleton } from './Skeleton';
import './skeleton.css';

export type FormSkeletonField = 'input' | 'textarea';

export interface FormSkeletonSection {
  fields: FormSkeletonField[];
}

export interface FormSkeletonProps {
  columns: FormSkeletonSection[][];
  actions?: number;
  narrow?: boolean;
  headerAction?: boolean;
}

export function FormSkeleton({
  columns,
  actions = 2,
  narrow = false,
  headerAction = true,
}: FormSkeletonProps) {
  return (
    <div className="form-skeleton" role="status" aria-busy="true">
      <span className="a11y-sr-only">Cargando formulario…</span>

      <PageHeaderSkeleton action={headerAction} />

      <div className="container width-fixed form-skeleton__body">
        <div
          className={['form-skeleton__form', narrow ? 'form-skeleton__form--narrow' : '']
            .filter(Boolean)
            .join(' ')}
        >
          <div className="form-skeleton__columns">
            {columns.map((sections, columnIndex) => (
              <div key={columnIndex} className="form-skeleton__column">
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="form-skeleton__section">
                    <Skeleton width="40%" height="1.5rem" />
                    {section.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="form-skeleton__field">
                        <Skeleton width="30%" height="1rem" />
                        <Skeleton
                          height={field === 'textarea' ? '7.5rem' : '2.5rem'}
                          className="form-skeleton__control"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="form-skeleton__footer">
            {Array.from({ length: actions }, (_, index) => (
              <Skeleton
                key={index}
                width="9rem"
                height="2.5rem"
                className="form-skeleton__control"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

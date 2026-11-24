import { useId, type ReactNode } from 'react';

/** A checkbox or radio as Sisdai draws it: the input, then its label. */
export function Choice(props: {
  type: 'checkbox' | 'radio';
  name?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="c-analysis-template__choice">
      <input
        id={id}
        type={props.type}
        name={props.name}
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      {/* One span: Sisdai's label is a flex row, which would split the text into columns. */}
      <label htmlFor={id}>
        <span>{props.children}</span>
      </label>
    </div>
  );
}

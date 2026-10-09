import { useState } from 'react';
import Icon from './Icon';
import './FormField.css';

/**
 * Text input with the shared validation look: errors appear once the field
 * has been touched (on blur), valid fields get a green border and a check,
 * invalid ones a red border and the message.
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  hint,
  disabled,
  readOnly,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  children,
  className = '',
  showValid = true,
}) {
  const [reveal, setReveal] = useState(false);
  const showError = touched && error;
  const showOk = showValid && touched && !error && !disabled && !readOnly && String(value ?? '').length > 0;
  const isPassword = type === 'password';
  const id = `f-${name}`;

  return (
    <div className={`field ${showError ? 'is-invalid' : ''} ${showOk ? 'is-valid' : ''} ${className}`}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="field-control">
        {children || (
          <input
            id={id}
            name={name}
            type={isPassword && reveal ? 'text' : type}
            value={value ?? ''}
            onChange={(e) => onChange?.(name, e.target.value)}
            onBlur={() => onBlur?.(name)}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            autoComplete={autoComplete}
            inputMode={inputMode}
            maxLength={maxLength}
            aria-invalid={showError ? 'true' : undefined}
            aria-describedby={showError ? `${id}-err` : hint ? `${id}-hint` : undefined}
          />
        )}
        <span className="field-adornments">
          {isPassword && (
            <button
              type="button"
              className="field-reveal"
              onClick={() => setReveal((r) => !r)}
              aria-label={reveal ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <Icon name={reveal ? 'eyeOff' : 'eye'} size={15} />
            </button>
          )}
          {showOk && <Icon name="check" size={15} className="field-ok" />}
          {showError && <Icon name="alert" size={15} className="field-bad" />}
        </span>
      </div>
      {showError ? (
        <p className="field-error" id={`${id}-err`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

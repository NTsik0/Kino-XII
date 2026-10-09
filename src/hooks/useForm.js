import { useCallback, useMemo, useState } from 'react';

/**
 * Small form helper: values, touched-on-blur, client validation and
 * server (422) errors. A server error for a field is cleared as soon as
 * the user edits that field.
 */
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});

  const clientErrors = useMemo(() => validate(values) || {}, [values, validate]);
  const errors = useMemo(() => ({ ...clientErrors, ...serverErrors }), [clientErrors, serverErrors]);
  const isValid = Object.keys(clientErrors).length === 0;

  const setField = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setServerErrors((e) => {
      if (!e[name]) return e;
      const { [name]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  const touch = useCallback((name) => setTouched((t) => ({ ...t, [name]: true })), []);

  const touchAll = useCallback(() => {
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
  }, [values]);

  const applyServerErrors = useCallback((fieldErrors, aliases = {}) => {
    const mapped = {};
    Object.entries(fieldErrors || {}).forEach(([key, msg]) => {
      mapped[aliases[key] || key] = msg;
    });
    setServerErrors(mapped);
    setTouched((t) => ({ ...t, ...Object.fromEntries(Object.keys(mapped).map((k) => [k, true])) }));
  }, []);

  const reset = useCallback((next) => {
    setValues(next);
    setTouched({});
    setServerErrors({});
  }, []);

  return { values, setValues, setField, touched, touch, touchAll, errors, isValid, applyServerErrors, reset };
}

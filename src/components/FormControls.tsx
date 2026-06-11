'use client';

import { forwardRef, useEffect, useState } from 'react';
import ReactSelect from 'react-select';

/* ─── Input ──────────────────────────────────────────── */

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`input transition-all duration-200 focus:ring-2 focus:ring-kong/40 focus:border-kong dark:focus:ring-kong/40 dark:focus:border-kong ${className}`}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/* ─── Textarea ────────────────────────────────────────── */

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`input transition-all duration-200 focus:ring-2 focus:ring-kong/40 focus:border-kong dark:focus:ring-kong/40 dark:focus:border-kong ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

/* ─── Checkbox ────────────────────────────────────────── */

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accent?: 'dal' | 'chinar' | 'saffron' | 'emerald';
  id?: string;
};

export function Checkbox({ label, checked, onChange, accent = 'dal', id }: CheckboxProps) {
  const accentMap: Record<string, string> = {
    dal: 'accent-kong',
    chinar: 'accent-chinar',
    saffron: 'accent-saffron',
    emerald: 'accent-emerald',
  };
  const uid = id ?? `cb-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <label htmlFor={uid} className="flex items-center gap-3 cursor-pointer group">
      <input
        id={uid}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`${accentMap[accent] ?? 'accent-kong'} w-4 h-4 transition-all duration-200 focus:ring-2 focus:ring-kong/40 focus:outline-none`}
      />
      <span className="text-sm font-medium text-ink-2 dark:text-dark-text-2 group-hover:text-kong dark:group-hover:text-kong transition-colors duration-200">{label}</span>
    </label>
  );
}

/* ─── react-select theme config ───────────────────────── */

const CONTROL_STYLES = {
  minHeight: 'auto',
  borderRadius: '6px',
  borderColor: '#E5D9C5',
  boxShadow: 'none',
  backgroundColor: '#fff',
  padding: '0',
  cursor: 'pointer',
  transition: 'all 200ms ease',
  '&:hover': { borderColor: '#1F9D57', boxShadow: '0 0 0 1px rgba(31, 157, 87, 0.1)' },
};

const SELECT_STYLES_BASE = {
  control: (base: any, state: any) => ({
    ...base,
    ...CONTROL_STYLES,
    borderColor: state.isFocused ? '#1F9D57' : '#E5D9C5',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(31, 157, 87, 0.15)' : 'none',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '5px 12px',
    fontSize: '14px',
    color: '#1A1612',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#8B7E6F',
    fontSize: '14px',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#1A1612',
    fontSize: '14px',
  }),
  input: (base: any) => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: '14px',
    color: '#1A1612',
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '10px',
    border: '1px solid #E5D9C5',
    backgroundColor: '#fff',
    boxShadow: '0 2px 6px rgba(61,53,42,0.08)',
    zIndex: 50,
    overflow: 'hidden',
  }),
  menuList: (base: any) => ({
    ...base,
    padding: '4px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: state.isSelected
      ? '#1F9D57'
      : state.isFocused
        ? '#F5EBDC'
        : 'transparent',
    color: state.isSelected ? '#fff' : '#1A1612',
    transition: 'all 150ms ease',
    '&:active': { backgroundColor: state.isSelected ? '#1F9D57' : '#F5EBDC' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any) => ({
    ...base,
    color: '#8B7E6F',
    padding: '6px 8px',
    '&:hover': { color: '#1A1612' },
  }),
  clearIndicator: (base: any) => ({
    ...base,
    color: '#8B7E6F',
    padding: '6px 4px',
    '&:hover': { color: '#B23A2E' },
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    fontSize: '14px',
    color: '#8B7E6F',
    padding: '16px 12px',
  }),
};

/* ─── Select (single) ─────────────────────────────────── */

export interface SelectOption {
  value: string;
  label: string;
}

type CustomSelectProps = {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  className?: string;
  isDisabled?: boolean;
  menuPortalTarget?: HTMLElement;
};

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  isClearable = false,
  className = '',
  isDisabled,
  menuPortalTarget,
}: CustomSelectProps) {
  const isDark = useDarkMode();
  const selected = options.find((o) => o.value === value) ?? null;

  const styles = isDark ? {
    ...SELECT_STYLES_BASE,
    control: (base: any, state: any) => ({
      ...SELECT_STYLES_BASE.control(base, state),
      borderColor: state.isFocused ? '#1F9D57' : '#2A3D48',
      backgroundColor: '#172832',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(31, 157, 87, 0.15)' : 'none',
      '&:hover': { borderColor: '#1F9D57' },
    }),
    valueContainer: (base: any) => ({
      ...SELECT_STYLES_BASE.valueContainer(base),
      color: '#F5EBDC',
    }),
    singleValue: (base: any) => ({
      ...SELECT_STYLES_BASE.singleValue(base),
      color: '#F5EBDC',
    }),
    input: (base: any) => ({
      ...SELECT_STYLES_BASE.input(base),
      color: '#F5EBDC',
    }),
    menu: (base: any) => ({
      ...SELECT_STYLES_BASE.menu(base),
      backgroundColor: '#172832',
      borderColor: '#2A3D48',
    }),
    option: (base: any, state: any) => ({
      ...SELECT_STYLES_BASE.option(base, state),
      backgroundColor: state.isSelected ? '#1F9D57' : state.isFocused ? '#1E3340' : 'transparent',
      color: state.isSelected ? '#fff' : '#F5EBDC',
      transition: 'all 150ms ease',
    }),
    noOptionsMessage: (base: any) => ({
      ...SELECT_STYLES_BASE.noOptionsMessage(base),
      color: '#A89B89',
    }),
  } : SELECT_STYLES_BASE;

  return (
    <ReactSelect
      className={className}
      classNamePrefix="ks"
      styles={styles}
      options={options}
      value={selected}
      onChange={(opt: any) => onChange(opt?.value ?? '')}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      menuPortalTarget={menuPortalTarget}
    />
  );
}

/* ─── MultiSelect ─────────────────────────────────────── */

type MultiSelectProps = {
  options: SelectOption[];
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
};

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select…',
  className = '',
  isDisabled,
}: MultiSelectProps) {
  const isDark = useDarkMode();
  const selected = options.filter((o) => value.includes(o.value));

  const baseStyles = isDark ? {
    ...SELECT_STYLES_BASE,
    control: (base: any, state: any) => ({
      ...SELECT_STYLES_BASE.control(base, state),
      borderColor: state.isFocused ? '#1F9D57' : '#2A3D48',
      backgroundColor: '#172832',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(31, 157, 87, 0.15)' : 'none',
      '&:hover': { borderColor: '#1F9D57' },
    }),
    valueContainer: (base: any) => ({
      ...SELECT_STYLES_BASE.valueContainer(base),
      color: '#F5EBDC',
    }),
    singleValue: (base: any) => ({
      ...SELECT_STYLES_BASE.singleValue(base),
      color: '#F5EBDC',
    }),
    input: (base: any) => ({
      ...SELECT_STYLES_BASE.input(base),
      color: '#F5EBDC',
    }),
    menu: (base: any) => ({
      ...SELECT_STYLES_BASE.menu(base),
      backgroundColor: '#172832',
      borderColor: '#2A3D48',
    }),
    option: (base: any, state: any) => ({
      ...SELECT_STYLES_BASE.option(base, state),
      backgroundColor: state.isSelected ? '#1F9D57' : state.isFocused ? '#1E3340' : 'transparent',
      color: state.isSelected ? '#fff' : '#F5EBDC',
      transition: 'all 150ms ease',
    }),
    noOptionsMessage: (base: any) => ({
      ...SELECT_STYLES_BASE.noOptionsMessage(base),
      color: '#A89B89',
    }),
  } : SELECT_STYLES_BASE;

  return (
    <ReactSelect
      isMulti
      className={className}
      classNamePrefix="ks"
      styles={{
        ...baseStyles,
        multiValue: (base: any) => ({
          ...base,
          backgroundColor: isDark ? '#1E3340' : '#F5EBDC',
          borderRadius: '999px',
          padding: '0 4px',
          margin: '2px',
        }),
        multiValueLabel: (base: any) => ({
          ...base,
          fontSize: '12px',
          color: isDark ? '#F5EBDC' : '#1A1612',
          padding: '2px 4px',
        }),
        multiValueRemove: (base: any) => ({
          ...base,
          borderRadius: '999px',
          color: isDark ? '#A89B89' : '#8B7E6F',
          '&:hover': { backgroundColor: '#B23A2E', color: '#fff' },
        }),
      }}
      options={options}
      value={selected}
      onChange={(opts: any) => onChange((opts ?? []).map((o: any) => o.value))}
      placeholder={placeholder}
      isDisabled={isDisabled}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
    />
  );
}

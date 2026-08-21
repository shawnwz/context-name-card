import { BACKGROUND_PRESETS } from "../lib/background-presets";
import { toCssImageUrl } from "../lib/placeholder-heads";

// Supports two usages: uncontrolled (plain radios read from FormData on
// submit, like the edit dialog's form) by passing `defaultValue`, or
// controlled (the create dialog, which has no native form submission) by
// passing `value` + `onChange`.
export function BackgroundPicker({
  name = "background",
  defaultValue,
  value,
  onChange,
}: {
  name?: string;
  defaultValue?: string | null;
  value?: string | null;
  onChange?: (id: string | null) => void;
}) {
  const isControlled = onChange !== undefined;

  return (
    <div className="grid grid-cols-5 gap-2">
      <label className="cursor-pointer group">
        <input
          type="radio"
          name={name}
          value=""
          checked={isControlled ? !value : undefined}
          defaultChecked={isControlled ? undefined : !defaultValue}
          onChange={isControlled ? () => onChange(null) : undefined}
          className="sr-only peer"
        />
        <div className="aspect-[3/4] rounded-lg border border-black/15 dark:border-white/15 flex items-center justify-center text-center text-[10px] leading-tight text-black/40 dark:text-white/40 peer-checked:ring-2 peer-checked:ring-black dark:peer-checked:ring-white peer-checked:border-transparent group-hover:border-black/30 dark:group-hover:border-white/30 transition-colors">
          Auto
        </div>
      </label>

      {BACKGROUND_PRESETS.map((preset) => (
        <label key={preset.id} className="cursor-pointer group">
          <input
            type="radio"
            name={name}
            value={preset.id}
            checked={isControlled ? value === preset.id : undefined}
            defaultChecked={isControlled ? undefined : defaultValue === preset.id}
            onChange={isControlled ? () => onChange(preset.id) : undefined}
            className="sr-only peer"
          />
          <div
            title={preset.label}
            aria-label={preset.label}
            className="aspect-[3/4] rounded-lg bg-cover bg-center border border-black/15 dark:border-white/15 peer-checked:ring-2 peer-checked:ring-black dark:peer-checked:ring-white peer-checked:border-transparent group-hover:border-black/30 dark:group-hover:border-white/30 transition-colors"
            style={{ backgroundImage: toCssImageUrl(preset.src) }}
          />
        </label>
      ))}
    </div>
  );
}

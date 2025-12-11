import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidatedInputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  name?: string;
  autoComplete?: string;
};

export default function ValidatedInput({ label, type = "text", value, onChange, placeholder, error, name, autoComplete }: ValidatedInputProps) {
  const id = name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "ring-2 ring-destructive" : undefined}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}















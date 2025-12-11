type PasswordStrengthProps = {
  password: string;
};

function computeStrength(password: string): number {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = computeStrength(password);
  const colors = [
    "bg-muted",
    "bg-red-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-600",
  ];
  return (
    <div className="flex items-center gap-2" aria-label="Password strength">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < level ? colors[level] : 'bg-muted'}`} />
      ))}
    </div>
  );
}















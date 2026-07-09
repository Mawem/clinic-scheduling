import { Button } from "./button";

interface ErrorStateProps {
  title: string;
  detail?: string;
  onRetry: () => void;
}

export function ErrorState({ title, detail, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <p className="font-medium text-red-800">{title}</p>
      {detail ? <p className="text-sm text-red-600">{detail}</p> : null}
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

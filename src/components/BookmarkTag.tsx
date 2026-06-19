import { cn } from '@/lib/utils';

interface BookmarkTagProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function BookmarkTag({ label, active, onClick, className }: BookmarkTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative h-11 min-w-[84px] px-4 pr-5',
        'font-serif text-sm tracking-wide transition-all duration-200',
        'rounded-bookmark',
        active
          ? 'bg-moss-500 text-paper-pure shadow-md'
          : 'bg-paper-pure text-moss-700 border border-moss-200 hover:border-moss-400 hover:bg-moss-50',
        className,
      )}
    >
      <span className="relative z-10">{label}</span>
      <span
        className={cn(
          'absolute left-1/2 -translate-x-1/2 bottom-0',
          'w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px]',
          'border-l-transparent border-r-transparent',
          active ? 'border-t-moss-500' : 'border-t-paper-pure',
        )}
      />
      <span
        className={cn(
          'absolute top-1 right-1.5 w-2 h-2 rounded-full',
          active ? 'bg-moss-300/70' : 'bg-moss-100',
        )}
      />
    </button>
  );
}

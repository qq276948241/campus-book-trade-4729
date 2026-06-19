import { Link } from 'react-router-dom';
import type { Book } from '@/types';
import { cn } from '@/lib/utils';

const conditionMap: Record<string, { label: string; color: string }> = {
  new: { label: '全新', color: 'bg-ember text-paper-pure' },
  nine: { label: '九成新', color: 'bg-moss-500 text-paper-pure' },
  eight: { label: '八成新', color: 'bg-moss-300 text-moss-800' },
};

interface BookCardProps {
  book: Book;
  index?: number;
  className?: string;
}

export default function BookCard({ book, index = 0, className }: BookCardProps) {
  const cond = conditionMap[book.condition] || conditionMap.eight;
  const coverUrl = book.cover?.startsWith('http') || book.cover?.startsWith('/uploads')
    ? book.cover
    : `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`${book.title} book cover by ${book.author}, literary, minimalist, paper texture, ${['forest green', 'warm amber', 'deep navy', 'burgundy red'][index % 4]} spine, high quality`)}&image_size=portrait_4_3`;

  return (
    <Link
      to={`/book/${book.id}`}
      className={cn(
        'group block',
        'animate-float-up',
        className,
      )}
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      <div className="relative transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-[-0.5deg]">
        <div className="absolute -inset-0 rounded-lg bg-moss-900/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-paper-pure rounded-lg shadow-book group-hover:shadow-book-hover transition-shadow duration-500 overflow-hidden">
          <div className="relative aspect-[3/4] overflow-hidden book-spine">
            <img
              src={coverUrl}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-3 left-3">
              <span className={cn('inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-full', cond.color)}>
                {cond.label}
              </span>
            </div>
            {book.status === 'sold' && (
              <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                <span className="bg-ember text-paper-pure px-4 py-1.5 rounded-full text-sm font-bold rotate-[-8deg]">
                  已售出
                </span>
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-serif font-bold text-[15px] text-ink leading-tight line-clamp-2 min-h-[40px]">
              {book.title}
            </h3>
            <p className="text-xs text-ink-soft line-clamp-1">{book.author}</p>
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-wrap gap-1">
                {book.tags?.slice(0, 2).map((t) => (
                  <span key={t} className="text-[10px] text-moss-700 bg-moss-50 px-1.5 py-0.5 rounded-sm">
                    {t}
                  </span>
                ))}
              </div>
              <div className="font-serif font-bold text-ember text-lg leading-none">
                ¥{book.price}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

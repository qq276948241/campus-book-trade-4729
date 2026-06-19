import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, BookMarked, GraduationCap } from 'lucide-react';
import BookmarkTag from '@/components/BookmarkTag';
import BookCard from '@/components/BookCard';
import { api } from '@/lib/api';
import type { Book } from '@/types';


const HOT_TAGS = ['全部', '教材教辅', '小说文学', '科技编程', '历史人文', '经济管理', '外语学习'];

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);

  const activeTag = new URLSearchParams(location.search).get('tag') || '全部';
  const keyword = new URLSearchParams(location.search).get('keyword') || '';

  const allTags = useMemo(() => {
    const merged = [...HOT_TAGS];
    tags.forEach((t) => {
      if (!merged.includes(t)) merged.push(t);
    });
    return merged;
  }, [tags]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookRes, tagRes] = await Promise.all([
          api.books.list({
            tag: activeTag === '全部' ? undefined : activeTag,
            keyword: keyword || undefined,
          }),
          api.tags.list(),
        ]);
        if (!cancelled) {
          setBooks(bookRes.list);
          setTags(tagRes.tags);
        }
      } catch (err) {
        console.error('fetch books failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [activeTag, keyword]);

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(location.search);
    if (tag === '全部') params.delete('tag');
    else params.set('tag', tag);
    navigate({ pathname: '/', search: params.toString() }, { replace: true });
  };



  return (
    <div className="container py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-moss-50 via-paper to-moss-50 border border-moss-100 p-8 mb-8 paper-grain">
        <div className="absolute top-4 right-8 w-64 h-64 bg-moss-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-4 left-16 w-48 h-48 bg-ember/10 rounded-full blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-moss-100 text-moss-700 px-3 py-1.5 rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>毕业季 · 书籍流转专场</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink leading-tight">
            让每本旧书
            <span className="text-moss-600">，</span>
            <br />
            都找到下一位
            <span className="relative inline-block">
              <span className="relative z-10">有心人</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-ember/25 -z-0 rounded-sm" />
            </span>
          </h1>
          <p className="mt-4 text-ink-soft text-lg max-w-xl">
            扫码上架，按专业标签筛选，同城校区交易，让知识在校园里流动。不用再刷微信群，书窝都帮你整理好了。
          </p>
          <div className="mt-6 flex items-center gap-6 text-sm text-ink-soft">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-moss-500" />
              <span>6 个专业分类</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-moss-500" />
              <span>覆盖 128 门课程</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {allTags.map((tag) => (
            <BookmarkTag
              key={tag}
              label={tag}
              active={activeTag === tag}
              onClick={() => handleTagClick(tag)}
              className="shrink-0"
            />
          ))}
        </div>
        {keyword && (
          <p className="text-sm text-ink-soft mt-2">
            搜索「<span className="text-moss-700 font-medium">{keyword}</span>」的结果 · 共 {books.length} 本
          </p>
        )}
      </section>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-paper-pure rounded-lg animate-pulse">
              <div className="aspect-[3/4] bg-paper-warm rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-paper-warm rounded w-3/4" />
                <div className="h-3 bg-paper-warm rounded w-1/2" />
                <div className="h-6 bg-paper-warm rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-6xl mb-3">📚</div>
          <h3 className="font-serif text-xl text-ink mb-1">暂时没有找到相关书籍</h3>
          <p className="text-ink-soft text-sm">试试切换其他标签，或自己上架一本吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {books.map((book, idx) => (
            <BookCard key={book.id} book={book} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

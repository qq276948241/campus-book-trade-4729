import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, BookOpen, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import BookmarkTag from '@/components/BookmarkTag';

const CONDITION_OPTIONS = [
  { value: '全新', label: '全新', desc: '未翻阅' },
  { value: '九成新', label: '九成新', desc: '几乎全新' },
  { value: '八成新', label: '八成新', desc: '少量使用痕迹' },
  { value: '七成新', label: '七成新', desc: '有明显使用痕迹' },
] as const;

const AVAILABLE_TAGS: { id: number; name: string }[] = [
  { id: 1, name: '教材教辅' },
  { id: 2, name: '小说文学' },
  { id: 3, name: '科技编程' },
  { id: 4, name: '历史人文' },
  { id: 5, name: '经济管理' },
  { id: 6, name: '外语学习' },
];

export default function Sell() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [condition, setCondition] = useState<string>('九成新');
  const [price, setPrice] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleScan = async () => {
    if (!isbn.trim()) {
      alert('请输入 ISBN 码或扫描');
      return;
    }
    setScanning(true);
    try {
      const res = await api.books.scan(isbn.trim());
      setTitle(res.title);
      setAuthor(res.author);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '扫码失败，请手动填写');
    } finally {
      setScanning(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCover(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || selectedTagId === null) {
      alert('请填写完整信息（书名、价格、选择一个标签）');
      return;
    }
    setSubmitting(true);
    try {
      let finalCover = cover;
      if (coverFile) {
        const uploadRes = await api.upload(coverFile);
        finalCover = `http://localhost:8080${uploadRes.url}`;
      }
      await api.books.create({
        isbn: isbn.trim(),
        title: title.trim(),
        author: author.trim(),
        condition,
        price: Number(price),
        tagId: selectedTagId,
        cover: finalCover || '',
        description,
      });
      alert('上架成功！');
      navigate('/');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '上架失败');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  };

  if (!isLoggedIn) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">请先登录</h2>
        <p className="text-ink-soft">登录后即可上架您的书籍</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-ink mb-1">上架旧书</h1>
        <p className="text-ink-soft">填写书籍信息，让它找到下一位读者</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-paper-pure rounded-2xl border border-paper-edge p-6 shadow-soft">
          <h2 className="font-serif text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-moss-500" />
            ISBN 扫码录入
          </h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="输入书背后的 ISBN 条码"
                className="w-full h-11 px-4 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100"
              />
            </div>
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="h-11 px-6 bg-moss-500 hover:bg-moss-600 disabled:bg-moss-300 text-paper-pure rounded-lg font-medium transition-all"
            >
              {scanning ? '识别中...' : '扫码查书'}
            </button>
          </div>
          <p className="text-xs text-ink-soft mt-2">扫码后会自动填充书名和作者，您也可以手动填写</p>
        </section>

        <section className="bg-paper-pure rounded-2xl border border-paper-edge p-6 shadow-soft">
          <h2 className="font-serif text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-moss-500" />
            书籍信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">书名 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：算法导论"
                className="w-full h-11 px-4 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">作者</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="例如：Thomas H. Cormen"
                className="w-full h-11 px-4 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">成色 *</label>
              <div className="grid grid-cols-3 gap-2">
                {CONDITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCondition(opt.value)}
                    className={cn(
                      'h-16 rounded-lg border-2 transition-all text-center p-2',
                      condition === opt.value
                        ? 'border-moss-500 bg-moss-50 text-moss-800'
                        : 'border-paper-edge hover:border-moss-300',
                    )}
                  >
                    <div className="font-bold text-sm">{opt.label}</div>
                    <div className="text-[10px] text-ink-soft mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">定价 (¥) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">¥</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full h-11 pl-8 pr-4 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100 font-mono text-ember font-bold text-lg"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-ink mb-2">专业课程标签 *（选择一个）</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <BookmarkTag
                  key={tag.id}
                  label={tag.name}
                  active={selectedTagId === tag.id}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-ink mb-2">书籍简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述一下书籍的使用情况，适合哪些课程..."
              rows={3}
              className="w-full px-4 py-3 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100 resize-none"
            />
          </div>
        </section>

        <section className="bg-paper-pure rounded-2xl border border-paper-edge p-6 shadow-soft">
          <h2 className="font-serif text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-moss-500" />
            书封图片
          </h2>
          <div className="flex gap-4 items-start">
            <label className="relative w-40 h-56 border-2 border-dashed border-moss-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-moss-400 hover:bg-moss-50/50 transition-all overflow-hidden">
              {cover ? (
                <>
                  <img src={cover} alt="preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-moss-500 text-paper-pure text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> 已上传
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-moss-400 mb-1" />
                  <span className="text-xs text-ink-soft">点击上传书封</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
            <div className="text-xs text-ink-soft space-y-1 pt-1">
              <p>· 建议上传清晰的书封正面照片</p>
              <p>· 支持 JPG、PNG 格式</p>
              <p>· 大小不超过 5MB</p>
            </div>
          </div>
        </section>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-12 px-6 border border-paper-edge text-ink rounded-lg hover:bg-paper-warm"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 h-12 bg-moss-500 hover:bg-moss-600 disabled:bg-moss-300 text-paper-pure rounded-lg font-bold text-lg transition-all shadow-soft"
          >
            {submitting ? '发布中...' : '✓ 立即上架'}
          </button>
        </div>
      </form>
    </div>
  );
}

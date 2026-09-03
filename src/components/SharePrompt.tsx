import { useEffect, useState } from 'react';
import { toPng } from 'html-to-image';

const PAGE_URL = 'https://lizhao077-netizen.github.io/jubensha-appetite-test/';

export function SharePrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jubensha-appetite-v1') || '{}');
      const key = `jubensha-share-prompt-${saved.completedAt || ''}`;
      if (saved.completedAt && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.setTimeout(() => setOpen(true), 220);
      }
    } catch {
      // The result page remains usable if storage is unavailable.
    }
  }, []);

  const saveImage = async () => {
    const result = document.querySelector('.result') as HTMLElement | null;
    if (!result) return;
    setOpen(false);
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const dataUrl = await toPng(result, { backgroundColor: '#f8f3e9', pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = '我的剧本杀胃口.png';
      link.href = dataUrl;
      link.click();
    } catch {
      window.alert('图片生成失败，请长按页面截图保存。');
    }
  };

  const shareLink = async () => {
    const content = { title: '测测你的剧本杀胃口', text: '47 种剧情线，你到底能吃多少？', url: PAGE_URL };
    try {
      if (navigator.share) await navigator.share(content);
      else {
        await navigator.clipboard?.writeText(PAGE_URL);
        window.alert('链接已复制，去微信粘贴分享吧。');
      }
    } catch {
      // Dismissing the system share sheet is not an error that needs to interrupt the user.
    }
  };

  if (!open) return null;
  return <div className="share-prompt" role="dialog" aria-modal="true" aria-label="保存并分享胃口卡">
    <article>
      <button className="share-prompt-close" onClick={() => setOpen(false)} aria-label="关闭">×</button>
      <p className="eyebrow">RESULT / READY</p>
      <h2>你的胃口卡做好了</h2>
      <p>保存图片，发到群里看看谁和你同桌。</p>
      <button className="primary" onClick={saveImage}>保存图片</button>
      <button className="outline" onClick={shareLink}>分享链接</button>
      <button className="text-button" onClick={() => setOpen(false)}>先看看结果</button>
    </article>
  </div>;
}

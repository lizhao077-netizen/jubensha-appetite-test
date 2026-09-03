import { useEffect, useState } from 'react';
import { toPng } from 'html-to-image';

export function SharePrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The parent writes completedAt in an effect. Waiting one short beat makes
    // the dialog reliable immediately after the last answer is submitted.
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('jubensha-appetite-v1') || '{}');
        const key = `jubensha-share-prompt-${saved.completedAt || ''}`;
        if (saved.completedAt && !sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          setOpen(true);
        }
      } catch {
        // The result page remains usable if storage is unavailable.
      }
    }, 420);
    return () => window.clearTimeout(timer);
  }, []);

  const createImage = async () => {
    const result = document.querySelector('.result') as HTMLElement | null;
    if (!result) throw new Error('Result card not found');
    setOpen(false);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const dataUrl = await toPng(result, { backgroundColor: '#f8f3e9', pixelRatio: 2, cacheBust: true });
    const blob = await (await fetch(dataUrl)).blob();
    return { dataUrl, file: new File([blob], '我的剧本杀胃口.png', { type: 'image/png' }) };
  };

  const saveImage = async () => {
    try {
      const { dataUrl } = await createImage();
      const link = document.createElement('a');
      link.download = '我的剧本杀胃口.png';
      link.href = dataUrl;
      link.click();
      window.setTimeout(() => window.alert('图片已生成。保存后可在微信发送给好友或发布朋友圈。'), 180);
    } catch {
      window.alert('图片生成失败，请长按页面截图保存。');
    }
  };

  const shareImage = async () => {
    try {
      const { dataUrl, file } = await createImage();
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: '我的剧本杀胃口', text: '来测测你的剧本杀胃口', files: [file] });
        return;
      }
      const link = document.createElement('a');
      link.download = file.name;
      link.href = dataUrl;
      link.click();
      window.setTimeout(() => window.alert('已生成图片。请保存后在微信选择「发送给朋友」或「分享到朋友圈」。'), 180);
    } catch {
      // Closing a system share sheet does not need an error prompt.
    }
  };

  if (!open) return null;
  return <div className="share-prompt" role="dialog" aria-modal="true" aria-label="保存并分享胃口卡">
    <article>
      <button className="share-prompt-close" onClick={() => setOpen(false)} aria-label="关闭">×</button>
      <p className="eyebrow">RESULT / READY</p>
      <h2>你的胃口卡做好了</h2>
      <p>保存胃口卡，发给好友或分享到朋友圈。</p>
      <button className="primary" onClick={shareImage}>保存图片并分享</button>
      <button className="outline" onClick={saveImage}>仅保存图片</button>
      <button className="text-button" onClick={() => setOpen(false)}>先看看结果</button>
    </article>
  </div>;
}

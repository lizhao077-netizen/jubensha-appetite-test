import { useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import { track } from '../analytics';

export function SharePrompt() {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // The parent writes completedAt in an effect. Waiting one short beat makes
    // the dialog reliable immediately after the last answer is submitted.
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('jubensha-appetite-v1') || '{}');
        const key = `jubensha-share-prompt-${saved.completedAt || ''}`;
        if (saved.completedAt && !sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          track('share_prompt_shown');
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
    track('image_generated');
    const blob = await (await fetch(dataUrl)).blob();
    return { dataUrl, file: new File([blob], '我的剧本杀胃口.png', { type: 'image/png' }) };
  };

  const saveImage = async () => {
    try {
      const { dataUrl } = await createImage();
      // WeChat reliably saves a real image shown in-page through its long-press
      // menu, whereas programmatic downloads usually go to an invisible cache.
      setPreviewUrl(dataUrl);
    } catch {
      window.alert('图片生成失败，请长按页面截图保存。');
    }
  };

  const shareImage = async () => {
    try {
      const { dataUrl, file } = await createImage();
      track('image_shared');
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: '我的剧本杀胃口', text: '来测测你的剧本杀胃口', files: [file] });
        return;
      }
      setPreviewUrl(dataUrl);
    } catch {
      // Closing a system share sheet does not need an error prompt.
    }
  };

  if (previewUrl) return <div className="image-preview" role="dialog" aria-modal="true" aria-label="长按保存胃口卡">
    <p>长按图片，选择「保存图片」</p>
    <img src={previewUrl} alt="我的剧本杀胃口卡" />
    <small>保存后可在微信发送给好友或发布朋友圈</small>
    <button className="outline" onClick={() => setPreviewUrl(null)}>返回结果</button>
  </div>;

  if (!open) return null;
  return <div className="share-prompt" role="dialog" aria-modal="true" aria-label="保存并分享胃口卡">
    <article>
      <button className="share-prompt-close" onClick={() => setOpen(false)} aria-label="关闭">×</button>
      <p className="eyebrow">RESULT / READY</p>
      <h2>你的胃口卡做好了</h2>
      <p>保存胃口卡，发给好友或分享到朋友圈。</p>
      <button className="primary" onClick={shareImage}>保存图片并分享</button>
      <button className="outline" onClick={saveImage}>生成图片</button>
      <button className="text-button" onClick={() => setOpen(false)}>先看看结果</button>
    </article>
  </div>;
}

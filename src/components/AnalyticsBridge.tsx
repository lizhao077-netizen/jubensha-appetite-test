import { useEffect } from 'react';
import { track } from '../analytics';
import { score, Answers } from '../logic/scoring';

const clickEvents: Record<string, 'test_started' | 'test_completed' | 'share_card_view'> = {
  '开始干饭 →': 'test_started',
  '继续上次测试 →': 'test_started',
  '查看结果': 'test_completed',
  '生成胃口卡': 'share_card_view',
};

export function AnalyticsBridge() {
  useEffect(() => {
    track('page_view', { path: window.location.pathname });
    const reportCompletedResult = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('jubensha-appetite-v1') || '{}');
        if (!saved.completedAt) return;
        const key = `jubensha-result-tracked-${saved.completedAt}`;
        if (sessionStorage.getItem(key)) return;
        const result = score(saved.answers as Answers || {});
        sessionStorage.setItem(key, '1');
        track('result_view', { level: result.level, total: result.total, thunderCount: result.thunder.length, categoryScores: result.categories });
      } catch {
        // Analytics must never affect the test flow.
      }
    };
    reportCompletedResult();
    const completionTimer = window.setInterval(reportCompletedResult, 600);
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest('button');
      const type = button && clickEvents[button.textContent?.trim() || ''];
      if (type) track(type);
    };
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('click', onClick); window.clearInterval(completionTimer); };
  }, []);
  return null;
}

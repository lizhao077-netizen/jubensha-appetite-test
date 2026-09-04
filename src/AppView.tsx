import { useEffect, useMemo, useState } from 'react';
import { Answer, categoryNames, pages, questions, Question } from './data/questions';
import { Answers, score } from './logic/scoring';
import { getTags } from './logic/tagEvidence';
import { getQuote } from './logic/quoteRules';
import { QuestionCard } from './components/QuestionCard';
import { RadarResult } from './components/RadarResult';

type Saved = { answers: Answers; currentPage: number; startTime: number; completedAt?: number };
const KEY = 'jubensha-appetite-v1';
const totalQuestions = questions.length;

function getSaved(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { answers: raw.answers ?? {}, currentPage: Math.min(raw.currentPage ?? 0, pages.length - 1), startTime: raw.startTime ?? Date.now(), completedAt: raw.completedAt };
  } catch { return { answers: {}, currentPage: 0, startTime: Date.now() }; }
}

export function AppView() {
  const [saved, setSaved] = useState<Saved>(getSaved);
  const [screen, setScreen] = useState<'home' | 'quiz' | 'result' | 'taste' | 'share'>(() => getSaved().completedAt ? 'result' : 'home');
  const [info, setInfo] = useState<Question | null>(null);
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(saved)), [saved]);
  const update = (patch: Partial<Saved>) => setSaved(value => ({ ...value, ...patch }));
  const result = useMemo(() => score(saved.answers), [saved.answers]);
  const tags = useMemo(() => getTags(saved.answers), [saved.answers]);
  const xp = questions.filter(question => saved.answers[question.id] === 'love').slice(0, 6);
  const start = (fresh = false) => { if (fresh) setSaved({ answers: {}, currentPage: 0, startTime: Date.now() }); setScreen('quiz'); };
  const finish = () => { update({ completedAt: Date.now() }); setScreen('result'); };

  if (screen === 'home') return <main className="shell home"><div className="archive-no">CASE / 053</div><p className="eyebrow">剧本杀胃口测试</p><h1>测测你的<br/><em>剧本杀胃口</em></h1><p className="intro">53种剧情线，<br/>你到底能吃多少？</p><div className="category-strip"><span>爱情</span><span>亲情</span><span>事业</span><span>其他</span></div><p className="time">约 3 分钟<br/><small>测出胃口等级 · 本命 XP · 雷区</small></p>{Object.keys(saved.answers).length > 0 ? <div className="home-actions"><button className="primary" onClick={() => start()}>继续上次测试 →</button><button className="text-button" onClick={() => start(true)}>重新开始</button></div> : <button className="primary" onClick={() => start(true)}>开始干饭 →</button>}<p className="footnote">没打过的线可以选「不了解」，不会影响结果。</p></main>;

  if (screen === 'quiz') {
    const ids = pages[saved.currentPage];
    const current = ids.map(id => questions.find(question => question.id === id)!);
    const category = current[0].category;
    const answeredBefore = pages.slice(0, saved.currentPage).flat().length;
    const range = `${answeredBefore + 1}–${answeredBefore + ids.length}`;
    const title = category === 'love' ? '恋爱这桌，你都吃些什么？' : category === 'family' ? '这一桌，聊聊亲情。' : category === 'career' ? '不谈感情的时候，你还吃什么？' : '接下来看看，你喜欢怎么被刀。';
    return <main className={`shell quiz ${category}`}><header><button className="back" onClick={() => setScreen('home')}>←</button><div><b>{categoryNames[category]}</b><small>{saved.currentPage + 1} / {pages.length}　·　{range} / {totalQuestions}</small></div></header><div className="progress"><i style={{ width: `${((answeredBefore + ids.length) / totalQuestions) * 100}%` }}/></div><div className="quiz-title">{title}</div><div className="questions">{current.map(question => <QuestionCard key={question.id} question={question} value={saved.answers[question.id]} onInfo={setInfo} onChange={answer => update({ answers: { ...saved.answers, [question.id]: answer } })}/>)}</div><nav className="quiz-nav"><button disabled={saved.currentPage === 0} onClick={() => update({ currentPage: saved.currentPage - 1 })}>上一页</button><button className="primary" onClick={() => saved.currentPage === pages.length - 1 ? finish() : update({ currentPage: saved.currentPage + 1 })}>{saved.currentPage === pages.length - 1 ? '查看结果' : '下一页 →'}</button></nav>{info && <div className="modal" onClick={() => setInfo(null)}><article onClick={event => event.stopPropagation()}><button onClick={() => setInfo(null)}>×</button><p className="eyebrow">剧情线说明</p><h2>{info.title}</h2><p>{info.description}</p><button className="unknown" onClick={() => { update({ answers: { ...saved.answers, [info.id]: null } }); setInfo(null); }}>不了解 / 没打过</button></article></div>}</main>;
  }

  const quote = getQuote(tags, result);
  if (screen === 'result') return <main className="shell result"><p className="eyebrow">我的剧本杀胃口</p><h1>{result.level}</h1><p className="capacity">胃容量 <b>{result.total}%</b></p><p className="subtitle">{result.subtitle}</p><RadarResult scores={result}/><section className="result-section"><h3>胃型标签</h3><p className="tags main-tags">{tags.map(tag => <span key={tag.id}>{tag.label}</span>)}</p></section><section className="result-section"><h3>本命 XP</h3><p className="tags">{xp.length ? xp.map(question => <span key={question.id}>{question.title}</span>) : '还没有无脑吃，口味很谨慎。'}</p></section><section className="result-section"><h3>雷点</h3><p className="tags thunder">{result.thunder.length ? result.thunder.slice(0, 5).map(title => <span key={title}>{title}</span>) : '目前没有明确雷点。'}</p></section><blockquote>“{quote}”</blockquote><button className="primary" onClick={() => setScreen('share')}>生成胃口卡</button><button className="outline" onClick={() => setScreen('taste')}>查看完整口味表</button><button className="text-button" onClick={() => start(true)}>重新测试</button></main>;

  if (screen === 'taste') return <main className="shell detail"><button className="back" onClick={() => setScreen('result')}>← 返回结果</button><p className="eyebrow">CASE / 053</p><h2>我的完整口味说明书</h2><p className="taste-legend"><i className="love"/>爱情 <i className="family"/>亲情 <i className="career"/>事业 <i className="other"/>其他</p>{(['love', 'like', 'maybe', 'no', 'avoid', null] as Answer[]).map(answer => { const label = answer === 'love' ? '无脑吃' : answer === 'like' ? '大部分吃' : answer === 'maybe' ? '偶尔吃' : answer === 'no' ? '不吃但不雷' : answer === 'avoid' ? '雷' : '不了解'; const list = questions.filter(question => (saved.answers[question.id] ?? null) === answer); return <section className="taste-group" key={label}><h3>{label}</h3><p>{list.length ? list.map(question => <span className={`taste-tag ${question.category}`} key={question.id}>{question.title}</span>) : '—'}</p></section>; })}</main>;

  return <main className="share-page"><div className="share-card"><p>剧本杀胃口测试</p><h1>{result.level}</h1><b>胃容量 {result.total}%</b><RadarResult scores={result} compact/><p className="share-tags">{tags.map(tag => tag.label).join(' × ')}</p><p>本命 XP：{xp.slice(0, 4).map(question => question.title).join(' / ') || '谨慎尝试'}</p><p>雷点：{result.thunder.slice(0, 3).join(' / ') || '暂无'}</p><blockquote>“{quote}”</blockquote><small>测测你的剧本杀胃口</small></div><button className="primary" onClick={() => setScreen('result')}>返回结果</button></main>;
}

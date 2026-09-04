import { Answer, Category, questions } from '../data/questions';
import { Answers, score } from './scoring';

export type Tag = {
  id: string;
  label: string;
  priority: number;
  strength: number;
  supportingQuestions: string[];
  evidenceScore: number;
  loveCount: number;
};

const evidence: Record<Exclude<Answer, null>, number> = { love: 4, like: 2, maybe: 0.5, no: -1, avoid: -3 };
const categories: Category[] = ['love', 'family', 'career', 'other'];

function answerOf(answers: Answers, title: string): Answer | undefined {
  return answers[questions.find(question => question.title === title)?.id ?? -1];
}
function isLove(answers: Answers, title: string) { return answerOf(answers, title) === 'love'; }
function isAtLeastLike(answers: Answers, title: string) { return ['love', 'like'].includes(answerOf(answers, title) ?? ''); }
function isAtMostMaybe(answers: Answers, title: string) { return ['maybe', 'no', 'avoid'].includes(answerOf(answers, title) ?? ''); }
function loveCount(answers: Answers, titles: string[]) { return titles.filter(title => isLove(answers, title)).length; }

export function tagEvidence(answers: Answers, supportingQuestions: string[], priority: number, contrast = false) {
  const values = supportingQuestions.map(title => answerOf(answers, title));
  const loves = values.filter(value => value === 'love').length;
  const likes = values.filter(value => value === 'like').length;
  const noes = values.filter(value => value === 'no').length;
  const avoids = values.filter(value => value === 'avoid').length;
  const score = priority + loves * 10 + likes * 3 + (contrast ? 8 : 0) - noes * 4 - avoids * 12;
  return { evidenceScore: score, loveCount: loves, strength: score };
}

type Rule = { id: string; label: string; priority: number; supportingQuestions: string[]; contrast?: boolean; minLove?: number; when: () => boolean };

export function getTags(answers: Answers): Tag[] {
  const scores = score(answers);
  const topTwo = (category: Category) => categories.sort((left, right) => scores.categories[right] - scores.categories[left]).slice(0, 2).includes(category);
  const careerQuestions = ['事业', '家国', '苍生', '复仇', '权谋', '成长'];
  const loveQuestions = ['暗恋', '明恋', '爱而不得', '双向奔赴', '青梅竹马', '天降', '日久生情', '一见钟情', '先婚后爱', '破镜重圆', '相爱相杀', '强制爱', '默默守护', '追妻/追夫火葬场', '病态', '正常', '真骨科', '伪骨科', '训狗', '当狗'];
  const familyQuestions = ['父亲', '类父', '母亲', '类母', '哥哥', '姐姐', '弟弟', '妹妹', '子女', '隔辈'];
  const otherQuestions = ['友情', '师徒', '主仆', '君臣', '战友', '群像', '宠物', '宿敌', '委屈', '愧疚', '抗压', '付出', '被付出', '背刺', '被背刺', '救赎', '输出'];

  const rules: Rule[] = [
    { id: 'father', label: '类父特攻', priority: 85, supportingQuestions: ['类父', '父亲'], contrast: true, when: () => isLove(answers, '类父') && isAtMostMaybe(answers, '父亲') },
    { id: 'mother', label: '类母特攻', priority: 85, supportingQuestions: ['类母', '母亲'], contrast: true, when: () => isLove(answers, '类母') && isAtMostMaybe(answers, '母亲') },
    { id: 'siblings', label: '哥姐宝', priority: 100, minLove: 2, supportingQuestions: ['哥哥', '姐姐'], when: () => isLove(answers, '哥哥') && isLove(answers, '姐姐') },
    { id: 'kids', label: '养崽型选手', priority: 100, minLove: 2, supportingQuestions: ['弟弟', '妹妹', '子女'], when: () => loveCount(answers, ['弟弟', '妹妹', '子女']) >= 2 },
    { id: 'secret', label: '偷偷爱到死型', priority: 85, supportingQuestions: ['暗恋', '明恋'], contrast: true, when: () => isLove(answers, '暗恋') && isAtMostMaybe(answers, '明恋') },
    { id: 'direct', label: '直球恋爱脑', priority: 85, supportingQuestions: ['明恋', '暗恋'], contrast: true, when: () => isLove(answers, '明恋') && isAtMostMaybe(answers, '暗恋') },
    { id: 'bamboo', label: '坚定竹马党', priority: 85, supportingQuestions: ['青梅竹马', '天降'], contrast: true, when: () => isLove(answers, '青梅竹马') && isAtMostMaybe(answers, '天降') },
    { id: 'arrival', label: '天降系选手', priority: 85, supportingQuestions: ['天降', '青梅竹马'], contrast: true, when: () => isLove(answers, '天降') && isAtMostMaybe(answers, '青梅竹马') },
    { id: 'slow', label: '慢热养成派', priority: 85, supportingQuestions: ['日久生情', '一见钟情'], contrast: true, when: () => isLove(answers, '日久生情') && isAtMostMaybe(answers, '一见钟情') },
    { id: 'first', label: '第一眼定生死', priority: 85, supportingQuestions: ['一见钟情', '日久生情'], contrast: true, when: () => isLove(answers, '一见钟情') && isAtMostMaybe(answers, '日久生情') },
    { id: 'regret', label: '遗憾饭重度爱好者', priority: 70, supportingQuestions: ['爱而不得'], when: () => isLove(answers, '爱而不得') },
    { id: 'career', label: '搞事业才是正餐', priority: 100, minLove: 2, supportingQuestions: careerQuestions, when: () => loveCount(answers, careerQuestions) >= 2 && careerQuestions.filter(title => isAtLeastLike(answers, title)).length >= 4 && topTwo('career') },
    { id: 'business', label: '事业脑', priority: 85, minLove: 2, supportingQuestions: careerQuestions, when: () => loveCount(answers, careerQuestions) >= 2 && topTwo('career') },
    { id: 'epic', label: '宏大叙事特攻', priority: 100, minLove: 2, supportingQuestions: ['家国', '苍生'], when: () => isLove(answers, '家国') && isLove(answers, '苍生') },
    { id: 'both', label: '江山爱人我全都要', priority: 100, minLove: 2, supportingQuestions: [...careerQuestions, '明恋', '双向奔赴', '爱而不得'], when: () => loveCount(answers, careerQuestions) >= 1 && loveCount(answers, ['明恋', '双向奔赴', '爱而不得']) >= 1 && topTwo('career') && topTwo('love') },
    { id: 'master', label: '师父变爹必死型', priority: 100, minLove: 2, supportingQuestions: ['师徒', '类父'], when: () => isLove(answers, '师徒') && isLove(answers, '类父') },
    { id: 'stabber', label: '只有我能捅人型', priority: 85, supportingQuestions: ['背刺', '被背刺'], contrast: true, when: () => isLove(answers, '背刺') && isAtMostMaybe(answers, '被背刺') },
    { id: 'betrayed', label: '请狠狠骗我型', priority: 85, supportingQuestions: ['被背刺', '背刺'], contrast: true, when: () => isLove(answers, '被背刺') && isAtMostMaybe(answers, '背刺') },
    { id: 'blood', label: '刀一定要见血型', priority: 100, minLove: 2, supportingQuestions: ['背刺', '被背刺'], when: () => isLove(answers, '背刺') && isLove(answers, '被背刺') },
    { id: 'sacrifice', label: '我可以为你死型', priority: 85, supportingQuestions: ['付出', '被付出'], contrast: true, when: () => isLove(answers, '付出') && isAtMostMaybe(answers, '被付出') },
    { id: 'loved', label: '请狠狠爱我型', priority: 85, supportingQuestions: ['被付出', '付出'], contrast: true, when: () => isLove(answers, '被付出') && isAtMostMaybe(answers, '付出') },
    { id: 'mutual', label: '双向献祭型', priority: 100, minLove: 2, supportingQuestions: ['付出', '被付出'], when: () => isLove(answers, '付出') && isLove(answers, '被付出') },
    { id: 'guilt', label: '先委屈我，再让我发现是我错了', priority: 100, minLove: 2, supportingQuestions: ['委屈', '愧疚'], when: () => isLove(answers, '委屈') && isLove(answers, '愧疚') },
    { id: 'burst', label: '红光爆发型', priority: 100, minLove: 2, supportingQuestions: ['输出', '抗压'], when: () => isLove(answers, '输出') && isLove(answers, '抗压') },
    { id: 'explode', label: '憋到最后一起炸型', priority: 100, minLove: 2, supportingQuestions: ['输出', '委屈'], when: () => isLove(answers, '输出') && isLove(answers, '委屈') },
    { id: 'pet', label: '宠物特攻', priority: 70, supportingQuestions: ['宠物'], when: () => isLove(answers, '宠物') },
    { id: 'unhealthy-love', label: '病态爱好者', priority: 70, supportingQuestions: ['病态'], when: () => isLove(answers, '病态') },
    { id: 'bone', label: '骨科特攻', priority: 100, minLove: 2, supportingQuestions: ['真骨科', '伪骨科'], when: () => isLove(answers, '真骨科') && isLove(answers, '伪骨科') },
    { id: 'love-concentrated', label: '爱情主食派', priority: 75, minLove: 2, supportingQuestions: loveQuestions, when: () => loveCount(answers, loveQuestions) >= 2 },
    { id: 'family-concentrated', label: '亲情羁绊特攻', priority: 75, minLove: 2, supportingQuestions: familyQuestions, when: () => loveCount(answers, familyQuestions) >= 2 },
    { id: 'other-concentrated', label: '羁绊重度爱好者', priority: 75, minLove: 2, supportingQuestions: otherQuestions, when: () => loveCount(answers, otherQuestions) >= 2 },
  ];

  return rules.flatMap(rule => {
    if (!rule.when()) return [];
    const item = tagEvidence(answers, rule.supportingQuestions, rule.priority, rule.contrast);
    const minimum = rule.minLove ?? 1;
    if (item.loveCount < minimum) return [];
    return [{ id: rule.id, label: rule.label, priority: rule.priority, supportingQuestions: rule.supportingQuestions, ...item }];
  }).sort((left, right) => right.evidenceScore - left.evidenceScore || right.loveCount - left.loveCount || right.priority - left.priority).slice(0, 3);
}

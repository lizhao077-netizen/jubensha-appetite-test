import { Tag } from './rules';
import { Scores } from './scoring';
export function getQuote(tags:Tag[], scores:Scores) {
 const ids=tags.map(t=>t.id); if(scores.categories.love>=70&&scores.categories.career>=70&&ids.includes('betrayed')) return '江山可以丢，爱情也得有，最好还能骗我一刀。';
 if(ids.includes('father')&&scores.categories.other>=40) return '亲爹不一定吃，类父请直接端上来，再配一点委屈。';
 if(ids.includes('stabber')) return '可以有刀，但刀最好握在我手里。';
 if(ids.includes('betrayed')) return '求你骗我，最好最后一幕才告诉我真相。';
 if(ids.includes('career')||ids.includes('epic')) return '感情可以慢慢谈，先把江山和大局端上来。';
 return scores.total>=70?'写得好就端上来，我的胃还有位置。':'挑得明白，才知道哪一口值得回味。';
}

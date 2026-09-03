import { Answer, Category, Question, questions } from '../data/questions';
export type Answers = Record<number, Answer | undefined>;
export type Scores = { categories: Record<Category,number>; alarms: Record<Category,number>; total:number; totalAlarmRate:number; level:string; subtitle:string; thunder:string[] };
const points: Record<Exclude<Answer,null>,number> = {love:1,like:.75,maybe:.4,no:0,avoid:0};
const categoryQuestions = (category:Category) => questions.filter(q=>q.category===category);
export function score(answers:Answers): Scores {
 const categories = {} as Record<Category,number>, alarms = {} as Record<Category,number>;
 (['love','family','career','other'] as Category[]).forEach(category=>{ const valid=categoryQuestions(category).filter(q=>answers[q.id] !== null && answers[q.id] !== undefined); const appetite=valid.length ? valid.reduce((sum,q)=>sum+points[answers[q.id] as Exclude<Answer,null>],0)/valid.length*100 : 0; const thunderCount=valid.filter(q=>answers[q.id]==='avoid').length; const tolerance=valid.length ? 100*(1-thunderCount/valid.length) : 0; categories[category]=Math.round(appetite*.8+tolerance*.2); alarms[category]=valid.length ? Math.round(thunderCount/valid.length*100) : 0; });
 const allValid=questions.filter(q=>answers[q.id] !== null && answers[q.id] !== undefined); const totalAlarmRate=allValid.length ? Math.round(allValid.filter(q=>answers[q.id]==='avoid').length/allValid.length*100) : 0; const categoryWeights=(['love','family','career','other'] as Category[]).map(category=>({category,weight:categoryQuestions(category).length})); const totalWeight=categoryWeights.reduce((sum,item)=>sum+item.weight,0); const total=Math.round(categoryWeights.reduce((sum,item)=>sum+categories[item.category]*item.weight,0)/totalWeight); const allBalanced=Object.values(categories).every(value=>value>=65); let level=total<25?'小鸟胃':total<40?'挑食胃':total<55?'正常饭量':total<70?'大胃袋':total<85?'无底洞':allBalanced&&totalAlarmRate<=10?'饕餮':'无底洞';
 const subtitle = level==='饕餮'?'四桌齐开，也很难让你空手离席。': total>=70?'只要人物写得好，基本没有你吃不下的饭。':total>=40?'口味不止一种，好饭值得慢慢尝。':'你知道自己想吃什么，也不勉强自己。';
 return {categories,alarms,total,totalAlarmRate,level,subtitle,thunder:questions.filter(q=>answers[q.id]==='avoid').map(q=>q.title)};
}
export const getQuestion = (title:string):Question => questions.find(q=>q.title===title)!;
export function isHigh(answers:Answers,title:string) { return ['love','like'].includes(answers[getQuestion(title).id] ?? ''); }

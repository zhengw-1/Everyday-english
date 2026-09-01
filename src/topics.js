export const TOPICS = [
  { id:'greetings', icon:'👋', label:'打招呼' },
  { id:'emergency', icon:'🆘', label:'求救' },
  { id:'vegetables', icon:'🥬', label:'蔬菜' },
  { id:'meat', icon:'🥩', label:'肉类' },
  { id:'doctor', icon:'🏥', label:'看医生' },
  { id:'shopping', icon:'🛒', label:'买东西' },
  { id:'restaurant', icon:'🍜', label:'吃饭' },
  { id:'transport', icon:'🚌', label:'坐车问路' },
  { id:'fruits', icon:'🍎', label:'水果' },
  { id:'food-drinks', icon:'🥛', label:'食物和饮料' },
  { id:'medicine', icon:'💊', label:'药和身体' },
  { id:'money', icon:'💵', label:'钱和价格' },
  { id:'home', icon:'🏠', label:'家里' },
  { id:'family', icon:'👨‍👩‍👧', label:'家人' },
  { id:'phone', icon:'📞', label:'打电话' },
  { id:'directions', icon:'📍', label:'问路' },
  { id:'weather', icon:'🌤️', label:'天气' },
  { id:'months', icon:'📅', label:'月份' },
  { id:'seasons', icon:'🌷', label:'四季' },
  { id:'numbers', icon:'🔢', label:'数字' },
  { id:'time', icon:'🕐', label:'时间' },
  { id:'everyday', icon:'💬', label:'日常对话' },
];

const DATA = {
  greetings: [
    ['你好。','Hello.','最简单的打招呼。'],
    ['早上好。','Good morning.','早上见面时说。'],
    ['很高兴见到你。','Nice to meet you.','第一次见面时说。'],
    ['谢谢。','Thank you.','别人帮助你以后说。'],
  ],
  emergency: [
    ['救命！','Help!','紧急危险时大声说。'],
    ['请帮帮我。','Please help me.','需要别人帮助时说。'],
    ['请打911。','Please call 911.','美国紧急情况时说。'],
    ['我迷路了。','I am lost.','找不到路时说。'],
  ],
  vegetables: [
    ['这个菜叫什么？','What is this vegetable called?','买菜时问名字。'],
    ['我要这个青菜。','I want this vegetable.','指着菜购买。'],
    ['这个新鲜吗？','Is this fresh?','买菜时问新不新鲜。'],
  ],
  meat: [
    ['这是猪肉吗？','Is this pork?','确认肉的种类。'],
    ['我要一磅牛肉。','I would like one pound of beef.','买肉时说数量。'],
    ['请切薄一点。','Please slice it thin.','请店员切薄。'],
  ],
  doctor: [
    ['我头晕。','I feel dizzy.','dizzy 是“头晕的”。'],
    ['我这里疼。','It hurts here.','一边说一边指疼的地方。'],
    ['这个药一天吃几次？','How many times a day should I take this medicine?','问药怎么吃。'],
  ],
  shopping: [
    ['这个多少钱？','How much is this?','问价格。'],
    ['有便宜一点的吗？','Do you have a cheaper one?','想找便宜一点的。'],
    ['我可以退这个吗？','Can I return this?','想退货时说。'],
  ],
  restaurant: [
    ['我要这个。','I would like this.','指着菜单点餐。'],
    ['不要辣。','No spicy food, please.','不要辣时说。'],
    ['可以买单吗？','Can I have the check, please?','吃完饭结账。'],
  ],
  transport: [
    ['厕所在哪里？','Where is the restroom?','问厕所。'],
    ['这个车去这里吗？','Does this bus go there?','确认公交方向。'],
    ['请告诉我什么时候下车。','Please tell me when to get off.','怕坐过站时说。'],
  ],

  fruits: [
    ['这个苹果甜吗？','Is this apple sweet?','买水果时问。'],
    ['我要两个苹果。','I would like two apples.','买水果时说数量。'],
    ['这些香蕉熟了吗？','Are these bananas ripe?','问水果是否成熟。'],
  ],
  'food-drinks': [
    ['我要一杯水。','I would like a glass of water.','想要水时说。'],
    ['我不喝咖啡。','I do not drink coffee.','说明自己不喝咖啡。'],
    ['我要热水。','I would like hot water.','想要热水时说。'],
  ],
  medicine: [
    ['我感觉不舒服。','I do not feel well.','身体不舒服时说。'],
    ['我需要吃药吗？','Do I need to take medicine?','问是否需要服药。'],
    ['这个药什么时候吃？','When should I take this medicine?','问服药时间。'],
  ],
  money: [
    ['多少钱？','How much is it?','问价格。'],
    ['可以刷卡吗？','Can I pay by card?','付款时问。'],
    ['找多少钱？','How much change?','确认找零。'],
  ],
  home: [
    ['请坐。','Please sit down.','请别人坐下。'],
    ['门在哪里？','Where is the door?','问门的位置。'],
    ['请等一下。','Please wait a moment.','请别人稍等。'],
  ],
  family: [
    ['这是我的女儿。','This is my daughter.','介绍家人。'],
    ['这是我的儿子。','This is my son.','介绍家人。'],
    ['我的家人在这里。','My family is here.','说家人在这里。'],
  ],
  phone: [
    ['请再说一遍。','Please say that again.','没听清时说。'],
    ['请慢一点说。','Please speak slowly.','请别人说慢一点。'],
    ['我听不清楚。','I cannot hear you clearly.','电话里没听清时说。'],
  ],
  directions: [
    ['这个地方在哪里？','Where is this place?','问地点。'],
    ['怎么去这里？','How do I get here?','问怎么到一个地方。'],
    ['左边还是右边？','Left or right?','问方向。'],
  ],
  weather: [
    ['今天冷吗？','Is it cold today?','问天气。'],
    ['今天会下雨吗？','Will it rain today?','问是否下雨。'],
    ['天气很好。','The weather is nice.','说天气很好。'],
  ],
  everyday: [
    ['你好吗？','How are you?','简单问候。'],
    ['我很好，谢谢。','I am good, thank you.','回答问候。'],
    ['请等一下。','Please wait a moment.','请别人稍等。'],
  ],
  months: [
    ['一月','January','一年里的第一个月。'],['二月','February','一年里的第二个月。'],['三月','March','一年里的第三个月。'],['四月','April','一年里的第四个月。'],['五月','May','一年里的第五月。'],['六月','June','一年里的第六月。'],['七月','July','一年里的第七月。'],['八月','August','一年里的第八月。'],['九月','September','一年里的第九月。'],['十月','October','一年里的第十月。'],['十一月','November','一年里的第十一月。'],['十二月','December','一年里的第十二月。'],
  ],
  seasons: [
    ['春天','spring','天气变暖、花开始开。'],['夏天','summer','一年里比较热的时候。'],['秋天','fall','树叶变色的时候。'],['冬天','winter','一年里比较冷的时候。'],
  ],
  numbers: [['一','one','数字 1。'],['二','two','数字 2。'],['三','three','数字 3。'],['十','ten','数字 10。'],['一百','one hundred','数字 100。']],
  time: [['现在几点？','What time is it?','问时间。'],['今天','today','说今天。'],['明天','tomorrow','说明天。'],['昨天','yesterday','说昨天。']],
};

export function topicPhrases(topicId) {
  return (DATA[topicId] || []).map(([zh,en,note], i) => ({ id:`built-${topicId}-${i}`, zh,en,note,category:topicId,correct:0,wrong:0 }));
}

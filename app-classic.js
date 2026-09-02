function speakNativeForDirectHtml(text, rate, scope = globalThis) {
  const synth = scope?.speechSynthesis;
  const Utterance = scope?.SpeechSynthesisUtterance;
  if (!synth || !Utterance) return false;
  try {
    synth.cancel?.();
    const utterance = new Utterance(String(text || ''));
    utterance.lang = 'en-US';
    utterance.rate = Number(rate) || 0.82;
    synth.speak(utterance);
    return true;
  } catch (_) {
    return false;
  }
}

function speakEnglish(text, _rate = 0.82, scope = globalThis) {
  // Voice A: exactly the approved original native speech behavior.
  return speakNativeForDirectHtml(text, 0.82, scope);
}

const STORAGE_KEY = 'elder-english-state-v1';

function defaultState() {
  return {
    version: 1,
    settings: { textSize: 'large', voiceRate: 0.82 },
    saved: [],
    practice: null,
    practiceSessions: [],
    currentPracticeId: null,
  };
}

function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!validateBackup(parsed)) return defaultState();
    if (!Array.isArray(parsed.practiceSessions)) parsed.practiceSessions = parsed.practice ? [parsed.practice] : [];
    parsed.currentPracticeId = parsed.currentPracticeId || parsed.practiceSessions.at(-1)?.id || null;
    parsed.practice = parsed.practiceSessions.find(x => x.id === parsed.currentPracticeId) || parsed.practice || null;
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state, storage = globalThis.localStorage) {
  storage?.setItem?.(STORAGE_KEY, JSON.stringify(state));
}

function mergePhrase(state, phrase) {
  const zh = String(phrase.zh || '').trim();
  const en = String(phrase.en || '').trim();
  if (!zh || !en) return null;
  const existing = state.saved.find(x => x.zh === zh && x.en === en);
  if (existing) return existing;
  const item = {
    id: phrase.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    zh,
    en,
    category: phrase.category || 'custom',
    note: phrase.note || '生活里可以直接用。',
    createdAt: phrase.createdAt || new Date().toISOString(),
    correct: Number(phrase.correct || 0),
    wrong: Number(phrase.wrong || 0),
    source: phrase.source || (phrase.category === 'custom' ? 'translation' : 'built-in'),
  };
  state.saved.unshift(item);
  return item;
}

function createBackupPayload(state) {
  return JSON.parse(JSON.stringify({ ...state, version: 1 }));
}

function validateBackup(value) {
  if (!value || value.version !== 1) return false;
  if (!value.settings || !['large','xlarge'].includes(value.settings.textSize)) return false;
  if (typeof value.settings.voiceRate !== 'number') return false;
  if (!Array.isArray(value.saved)) return false;
  if (value.practice !== null && typeof value.practice !== 'object') return false;
  if (value.practiceSessions !== undefined && !Array.isArray(value.practiceSessions)) return false;
  if (value.currentPracticeId !== undefined && value.currentPracticeId !== null && typeof value.currentPracticeId !== 'string') return false;
  return value.saved.every(x => x && typeof x.zh === 'string' && typeof x.en === 'string');
}

function downloadBackup(state) {
  const blob = new Blob([JSON.stringify(createBackupPayload(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `生活英语备份-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function readBackupFile(file) {
  const value = JSON.parse(await file.text());
  if (!validateBackup(value)) throw new Error('这个备份文件不正确。');
  return value;
}

const V9_EXTRA_DATA = {"greetings":[["认识你很高兴。","Nice to meet you.","第一次见面。"],["请坐。","Please sit down.","邀请别人坐下。"],["你住在哪里？","Where do you live?","问住在哪里。"],["今天好吗？","How are you today?","日常问候。"],["回头见。","See you later.","以后还会见面。"],["祝你今天愉快。","Have a nice day.","礼貌告别。"],["请慢一点说。","Please speak slowly.","听不清时说。"]],"emergency":[["我需要帮助。","I need help.","需要帮助。"],["请过来。","Please come here.","叫别人过来。"],["我不舒服。","I do not feel well.","身体不舒服。"],["我不能走路。","I cannot walk.","不能走路时说。"],["请叫救护车。","Please call an ambulance.","需要救护车。"],["请留在这里。","Please stay here.","需要别人留下。"]],"vegetables":[["菠菜","spinach","蔬菜名称。"],["生菜","lettuce","蔬菜名称。"],["黄瓜","cucumber","蔬菜名称。"],["蘑菇","mushroom","蔬菜名称。"],["玉米","corn","常见食物。"],["这个多少钱？","How much is this?","问蔬菜价格。"],["我要半磅。","I would like half a pound.","说数量。"]],"meat":[["火鸡","turkey","肉类名称。"],["羊肉","lamb","肉类名称。"],["猪排","pork chop","常见肉类。"],["鸡腿","chicken leg","常见肉类。"],["不要骨头。","No bones, please.","不要骨头。"],["请切厚一点。","Please slice it thicker.","请店员切厚。"],["我想要新鲜的。","I want fresh meat.","选择新鲜的肉。"]],"doctor":[["我感觉很好。","I feel good.","说感觉很好。"],["我有点累。","I am a little tired.","说有一点累。"],["我需要休息。","I need to rest.","需要休息。"],["哪里疼？","Where does it hurt?","问疼痛位置。"],["多久了？","How long has it been?","问持续多久。"],["我有预约。","I have an appointment.","到了预约时间。"],["请写下来。","Please write it down.","听不懂时可以请对方写下来。"]],"shopping":[["我只看看。","I am just looking.","暂时不买。"],["有黑色的吗？","Do you have a black one?","问颜色。"],["有红色的吗？","Do you have a red one?","问颜色。"],["我需要大号。","I need a large size.","问尺码。"],["我需要小号。","I need a small size.","问尺码。"],["在哪里付款？","Where do I pay?","问付款地点。"],["商店几点关门？","What time does the store close?","问关门时间。"]],"restaurant":[["我要一杯茶。","I would like a cup of tea.","点茶。"],["我要咖啡。","I would like coffee.","点咖啡。"],["没有洋葱。","No onions, please.","不要洋葱。"],["少一点辣。","Less spicy, please.","少一点辣。"],["我对花生过敏。","I am allergic to peanuts.","说明过敏。"],["洗手间在哪里？","Where is the restroom?","问洗手间。"],["可以打包吗？","Can I get this to go?","想打包。"]],"transport":[["我想坐公交车。","I want to take the bus.","想坐公交车。"],["我想坐地铁。","I want to take the subway.","想坐地铁。"],["下一站下车。","Get off at the next stop.","下一站下车。"],["这是去市中心的吗？","Does this go downtown?","问方向。"],["我需要换车吗？","Do I need to transfer?","问是否换车。"],["车站在哪里？","Where is the station?","问车站。"],["我需要一张票。","I need a ticket.","买票。"]],"fruits":[["梨","pear","水果名称。"],["桃子","peach","水果名称。"],["蓝莓","blueberry","水果名称。"],["柠檬","lemon","水果名称。"],["菠萝","pineapple","水果名称。"],["这个酸吗？","Is this sour?","问水果酸不酸。"],["这个甜吗？","Is this sweet?","问水果甜不甜。"]],"food-drinks":[["我要水。","I want water.","简单要水。"],["我要茶。","I would like tea.","点茶。"],["我要咖啡。","I would like coffee.","点咖啡。"],["不要糖。","No sugar, please.","不要糖。"],["少一点糖。","Less sugar, please.","少糖。"],["我吃饱了。","I am full.","吃饱了。"],["很好喝。","It tastes good.","说饮料好喝。"]],"medicine":[["我忘记吃药了。","I forgot to take my medicine.","忘记服药。"],["我需要药。","I need medicine.","需要药。"],["药店在哪里？","Where is the pharmacy?","找药店。"],["我每天吃一次。","I take it once a day.","说明次数。"],["我每天吃两次。","I take it twice a day.","说明次数。"],["我要问药剂师。","I want to ask the pharmacist.","想问药剂师。"],["这是我的药。","This is my medicine.","说明这是自己的药。"]],"money":[["这是十美元。","This is ten dollars.","说金额。"],["我有二十美元。","I have twenty dollars.","说有多少钱。"],["可以找零吗？","Can you give me change?","问找零。"],["我需要零钱。","I need change.","需要零钱。"],["价格太高了。","The price is too high.","觉得太贵。"],["这个便宜吗？","Is this cheap?","问是否便宜。"],["我先看看。","I will look first.","先看看再决定。"]],"home":[["我在厨房。","I am in the kitchen.","说位置。"],["我在客厅。","I am in the living room.","说位置。"],["请开窗。","Please open the window.","开窗。"],["请关窗。","Please close the window.","关窗。"],["电视在哪里？","Where is the TV?","找电视。"],["遥控器在哪里？","Where is the remote?","找遥控器。"],["我很累。","I am very tired.","说很累。"]],"family":[["这是我的姐姐。","This is my older sister.","介绍姐姐。"],["这是我的哥哥。","This is my older brother.","介绍哥哥。"],["这是我的妹妹。","This is my younger sister.","介绍妹妹。"],["这是我的弟弟。","This is my younger brother.","介绍弟弟。"],["我的家人在家。","My family is home.","说家人在家。"],["我想家了。","I miss my family.","想念家人。"],["我们一起吃饭。","We eat together.","和家人一起吃饭。"]],"phone":[["请给我留言。","Please leave me a message.","请留言。"],["我现在不能接电话。","I cannot answer the phone right now.","不能接电话。"],["你可以晚点打吗？","Can you call later?","请晚点打。"],["号码是多少？","What is the number?","问电话号码。"],["我打错电话了。","I called the wrong number.","打错电话。"],["请发短信给我。","Please text me.","请发短信。"],["我没有信号。","I have no signal.","没有信号。"]],"directions":[["向左走。","Go left.","指左边。"],["向右走。","Go right.","指右边。"],["就在这里。","It is right here.","地点就在这里。"],["就在那边。","It is over there.","地点在那里。"],["在街角。","It is on the corner.","地点在街角。"],["在附近。","It is nearby.","距离很近。"],["离这里很远。","It is far from here.","距离很远。"]],"weather":[["今天下雪吗？","Will it snow today?","问是否下雪。"],["外面很冷。","It is very cold outside.","说外面很冷。"],["外面很热。","It is very hot outside.","说外面很热。"],["我需要一把伞。","I need an umbrella.","需要雨伞。"],["我需要一件外套。","I need a coat.","需要外套。"],["今天是晴天。","It is sunny today.","说天气晴朗。"],["明天会冷吗？","Will it be cold tomorrow?","问明天天气。"]],"months":[["今年","this year","现在这一年。"],["明年","next year","下一年。"],["去年","last year","上一年。"],["这个月","this month","现在这个月。"],["下个月","next month","下一个月。"],["上个月","last month","上一个月。"],["你的生日是几月？","What month is your birthday?","问生日月份。"],["这个月几号？","What is the date this month?","问日期。"]],"seasons":[["春天很温暖。","Spring is warm.","说春天。"],["夏天很热。","Summer is hot.","说夏天。"],["秋天很漂亮。","Fall is beautiful.","说秋天。"],["冬天下雪。","It snows in winter.","说冬天。"],["你喜欢夏天吗？","Do you like summer?","问喜好。"],["我喜欢秋天。","I like fall.","表达喜欢。"],["哪个季节最冷？","Which season is the coldest?","比较季节。"],["春天来了。","Spring is here.","说春天到了。"],["冬天很冷。","Winter is cold.","说冬天天气。"]],"numbers":[["十一","eleven","数字 11。"],["十二","twelve","数字 12。"],["二十","twenty","数字 20。"],["三十","thirty","数字 30。"],["一百","one hundred","数字 100。"],["第一","first","表示顺序。"],["第二","second","表示顺序。"],["多少钱？","How much is it?","买东西时常用。"],["我需要两个。","I need two.","说数量。"],["三个","three","数字 3。"]],"time":[["现在几点？","What time is it?","问时间。"],["上午","morning","中午以前。"],["中午","noon","一天中间的时间。"],["下午","afternoon","中午以后。"],["晚上","evening","晚上。"],["很早","early","时间比较早。"],["很晚","late","时间比较晚。"],["今天","today","现在这一天。"],["明天","tomorrow","下一天。"],["等一下。","Wait a moment.","请稍等。"]],"everyday":[["请帮我。","Please help me.","需要帮助。"],["没关系。","It is okay.","回答道歉。"],["我不知道。","I do not know.","不知道时说。"],["我明白了。","I understand.","表示明白。"],["等一下。","Wait a moment.","请稍等。"],["请再说一遍。","Please say that again.","没听清。"],["我会一点英语。","I speak a little English.","说明英语水平。"]]};

const V10_MORE_DATA = {"greetings":[["你多大了？","How old are you?","询问年龄。"],["你从哪里来？","Where are you from?","询问来自哪里。"],["我来自这里。","I am from here.","说明来自这里。"],["认识你很开心。","I am happy to meet you.","表达见面时的开心。"],["祝你好运。","Good luck.","祝别人顺利。"],["晚安。","Good night.","晚上道别时说。"],["再见。","Goodbye.","正式或普通道别。"],["明天见。","See you tomorrow.","约定明天再见。"],["保重。","Take care.","道别时祝对方照顾好自己。"],["请告诉我你的名字。","Please tell me your name.","礼貌地询问名字。"]],"emergency":[["我受伤了。","I am injured.","说明自己受伤。"],["我流血了。","I am bleeding.","说明正在流血。"],["这里很危险。","It is dangerous here.","提醒这里有危险。"],["请不要动。","Please do not move.","紧急情况下让人保持不动。"],["我需要警察。","I need the police.","需要警察帮助时说。"],["我找不到家。","I cannot find my home.","找不到回家的地方。"],["我的手机没电了。","My phone is dead.","说明手机没有电。"],["请给我地址。","Please give me the address.","需要知道地点地址。"],["有人受伤了。","Someone is injured.","说明另一个人受伤。"],["请叫警察。","Please call the police.","需要警察时说。"]],"vegetables":[["土豆","potato","常见的根茎类蔬菜。"],["胡萝卜","carrot","常见的橙色根茎类蔬菜。"],["西红柿","tomato","常见的红色食材。"],["洋葱","onion","常用来做菜的蔬菜。"],["大蒜","garlic","有强烈味道的调味食材。"],["卷心菜","cabbage","圆形叶菜。"],["西兰花","broccoli","绿色花球状蔬菜。"],["芹菜","celery","茎比较脆的蔬菜。"],["豆角","green beans","细长的绿色豆类蔬菜。"],["红薯","sweet potato","味道偏甜的根茎类食物。"]],"meat":[["鸡胸肉","chicken breast","鸡肉中常见的瘦肉部位。"],["牛排","steak","一块可以煎或烤的牛肉。"],["培根","bacon","通常腌制后煎熟的猪肉。"],["香肠","sausage","把肉调味后制成的食品。"],["牛肉末","ground beef","切碎或绞碎的牛肉。"],["排骨","ribs","带骨头的肉。"],["鸭肉","duck","鸭子的肉。"],["火腿","ham","经过腌制或熟制的猪腿肉。"],["肉馅","ground meat","绞碎后用来包饺子或做菜的肉。"],["新鲜肉","fresh meat","没有变质、刚购买或保存良好的肉。"]],"doctor":[["我发烧了。","I have a fever.","说明体温升高。"],["我咳嗽。","I have a cough.","说明有咳嗽。"],["我喉咙痛。","I have a sore throat.","说明喉咙疼。"],["我肚子疼。","My stomach hurts.","说明肚子疼。"],["我头疼。","I have a headache.","说明头部疼痛。"],["我很虚弱。","I feel weak.","说明身体没有力气。"],["我昨晚没有睡好。","I did not sleep well last night.","说明昨晚睡眠不好。"],["症状什么时候开始的？","When did the symptoms start?","询问症状开始的时间。"],["我对这种药过敏。","I am allergic to this medicine.","说明对这种药过敏。"],["我需要看医生。","I need to see a doctor.","表示需要医生检查。"]],"shopping":[["我可以试试吗？","Can I try it?","购买前想试用或试穿。"],["有其他颜色吗？","Do you have other colors?","询问其他颜色。"],["有大一点的吗？","Do you have a bigger one?","询问更大的尺寸。"],["有小一点的吗？","Do you have a smaller one?","询问更小的尺寸。"],["我喜欢这个颜色。","I like this color.","表示喜欢颜色。"],["我不喜欢这个。","I do not like this one.","表示不喜欢某个东西。"],["我决定买这个。","I decided to buy this.","决定购买。"],["请给我收据。","Please give me the receipt.","付款后索要收据。"],["这里可以试穿吗？","Can I try this on here?","询问是否可以试穿。"],["我要现金付款。","I will pay in cash.","表示用现金付款。"]],"restaurant":[["请给我菜单。","Please give me the menu.","要看菜单时说。"],["我想要汤。","I would like soup.","点汤。"],["我要鸡肉。","I would like chicken.","点鸡肉。"],["这道菜很好吃。","This dish is delicious.","说菜很好吃。"],["不要冰。","No ice, please.","饮料不要冰。"],["可以少放盐吗？","Can you use less salt?","要求少放盐。"],["我需要一个叉子。","I need a fork.","需要叉子。"],["请给我一杯水。","Please give me a glass of water.","请求一杯水。"],["账单有错误。","There is a mistake on the bill.","发现账单有问题。"],["我已经点过了。","I already ordered.","说明已经点过餐。"]],"transport":[["火车在哪里？","Where is the train?","询问火车在哪里。"],["机场在哪里？","Where is the airport?","询问机场位置。"],["我要去机场。","I need to go to the airport.","说明目的地是机场。"],["这班车几点到？","What time does this bus arrive?","询问公交车到达时间。"],["这趟车是快车吗？","Is this an express train?","询问是否为快车。"],["我要下车。","I want to get off.","表示要下车。"],["我错过了公交车。","I missed the bus.","说明没有赶上公交车。"],["车票多少钱？","How much is the ticket?","询问车票价格。"],["这里可以上车吗？","Can I get on here?","询问能否在这里上车。"],["请告诉我站名。","Please tell me the station name.","请求告诉自己站名。"]],"fruits":[["苹果","apple","常见的圆形水果。"],["香蕉","banana","常见的黄色水果。"],["橙子","orange","常见的橙色水果。"],["葡萄","grape","一串串生长的小水果。"],["西瓜","watermelon","个头较大的多汁水果。"],["草莓","strawberry","红色的小水果。"],["樱桃","cherry","小而圆的水果。"],["芒果","mango","香甜多汁的热带水果。"],["猕猴桃","kiwi","棕色外皮、绿色果肉的水果。"],["这个熟了吗？","Is this ripe?","询问水果是否成熟。"]],"food-drinks":[["果汁","juice","从水果等食材中得到的液体饮料。"],["牛奶","milk","常见的乳制饮料。"],["汽水","soda","有气泡的甜味饮料。"],["早餐","breakfast","一天中的第一顿饭。"],["午餐","lunch","通常在中午吃的一顿饭。"],["晚餐","dinner","通常在晚上吃的一顿饭。"],["饥饿","hungry","感到想吃东西。"],["口渴","thirsty","感到想喝水。"],["热的","hot","温度比较高。"],["冷的","cold","温度比较低。"]],"medicine":[["药片","pill","可以吞服的固体药物。"],["药水","liquid medicine","液体形式的药。"],["处方","prescription","医生给出的用药指示或药方。"],["药剂师","pharmacist","在药房配药并提供用药信息的人。"],["药房","pharmacy","购买或领取药物的地方。"],["剂量","dose","一次应该使用的药量。"],["副作用","side effect","使用药物后可能出现的额外反应。"],["每天一次","once a day","一天使用一次。"],["饭后","after a meal","吃完饭以后。"],["饭前","before a meal","吃饭以前。"]],"money":[["美元","dollar","美国使用的货币单位。"],["硬币","coin","金属制成的钱。"],["纸币","bill","纸制的钱。"],["信用卡","credit card","可以先消费后还款的支付卡。"],["借记卡","debit card","直接从银行账户扣款的支付卡。"],["现金","cash","纸币和硬币等实物钱。"],["总价","total price","全部商品加起来的价格。"],["折扣","discount","从原价中减去的一部分价格。"],["免费","free","不需要付钱。"],["贵","expensive","价格比较高。"]],"home":[["卧室","bedroom","睡觉和休息的房间。"],["浴室","bathroom","洗澡、洗手等使用的房间。"],["冰箱","refrigerator","用来冷藏食物的电器。"],["炉子","stove","用来加热和做饭的设备。"],["床","bed","用来睡觉的家具。"],["桌子","table","有平面的家具，可以放东西。"],["椅子","chair","供人坐的家具。"],["灯","lamp","用来照明的设备。"],["地板","floor","房间下面供人行走的表面。"],["钥匙","key","用来开锁的金属物品。"]],"family":[["妈妈","mother","女性家长。"],["爸爸","father","男性家长。"],["奶奶","grandmother","父亲或母亲的妈妈。"],["爷爷","grandfather","父亲或母亲的爸爸。"],["妻子","wife","结婚关系中的女性配偶。"],["丈夫","husband","结婚关系中的男性配偶。"],["孩子","child","年龄较小的人，也可以指自己的儿女。"],["孙子","grandson","儿子或女儿的男孩孩子。"],["孙女","granddaughter","儿子或女儿的女孩孩子。"],["亲戚","relative","和自己有家庭或血缘关系的人。"]],"phone":[["手机","phone","可以打电话和使用网络的移动设备。"],["联系人","contact","手机里保存的某个人的信息。"],["语音信箱","voicemail","别人没接电话时留下语音的系统。"],["来电","incoming call","别人打给你的电话。"],["未接电话","missed call","没有接到的电话。"],["电池","battery","为设备提供电力的部件。"],["充电器","charger","给电子设备充电的设备。"],["短信","text message","通过手机发送的文字消息。"],["视频通话","video call","可以同时看到对方画面的电话。"],["静音","mute","关闭声音。"]],"directions":[["直走。","Go straight.","沿着现在的方向继续走。"],["过马路。","Cross the street.","从街道的一边走到另一边。"],["红绿灯","traffic light","控制道路车辆和行人通行的灯。"],["十字路口","intersection","两条或多条道路相交的地方。"],["桥","bridge","跨过河流或道路的建筑。"],["拐角","corner","两条道路或两个边相接的位置。"],["入口","entrance","进入建筑或地点的地方。"],["出口","exit","离开建筑或地点的地方。"],["楼上","upstairs","建筑物较高的一层。"],["楼下","downstairs","建筑物较低的一层。"]],"weather":[["刮风。","It is windy.","说风比较大。"],["有雾。","It is foggy.","说空气中有雾。"],["雷雨","thunderstorm","伴有雷和雨的天气。"],["冰","ice","冻结成固体的水。"],["温度","temperature","表示冷热程度的数值。"],["湿度","humidity","空气中水分的多少。"],["阳光","sunshine","太阳发出的光。"],["阴天","cloudy","天空被云覆盖、阳光较少。"],["天气预报","weather forecast","对未来天气的预测。"],["暴风雨","storm","风雨很强的天气。"]],"everyday":[["请重复。","Please repeat.","请别人再说一次。"],["请写下来。","Please write it down.","请别人把内容写下来。"],["我明白了。","I understand.","表示已经理解。"],["我不明白。","I do not understand.","表示没有理解。"],["没问题。","No problem.","表示没有问题。"],["当然。","Of course.","表示同意或肯定。"],["也许。","Maybe.","表示不确定。"],["现在。","Now.","表示此时。"],["稍后。","Later.","表示过一会儿。"],["小心。","Be careful.","提醒别人注意安全。"],["慢慢来。","Take your time.","告诉别人不用着急。"]],"seasons":[["春天来了。","Spring has arrived.","说春天已经到来。"],["夏天到了。","Summer has arrived.","说夏天已经到来。"],["秋天天气凉。","Fall weather is cool.","说秋天的天气比较凉。"],["冬天有冰。","There is ice in winter.","说冬天可能有冰。"],["花开了。","The flowers are blooming.","说花正在开放。"],["树叶变黄了。","The leaves are turning yellow.","说秋天树叶颜色发生变化。"],["天气变暖了。","The weather is getting warmer.","说天气正在变暖。"]],"numbers":[["四","four","数字 4。"],["五","five","数字 5。"],["六","six","数字 6。"],["七","seven","数字 7。"],["八","eight","数字 8。"],["九","nine","数字 9。"],["十四","fourteen","数字 14。"]],"time":[["一小时","one hour","六十分钟。"],["一分钟","one minute","六十秒钟。"],["半小时","half an hour","三十分钟。"],["中午十二点","noon","一天中十二点左右的时间。"],["午夜","midnight","夜里十二点左右的时间。"],["马上。","Right away.","表示立刻去做。"],["几点钟？","What time?","简单询问时间。"],["早上八点。","It is eight in the morning.","说明早上八点。"],["五分钟","five minutes","五个一分钟。"],["一周","one week","七天的时间。"]]};

const TOPICS = [
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
  { id:'new-china', icon:'🥡', label:'New China 餐馆' },
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

const WORDS = {"911":["九一一；美国紧急电话","在美国遇到紧急情况时拨打的电话号码。"],"i":["我","表示说话的人自己。"],"me":["我","表示动作的对象是我。"],"my":["我的","表示东西属于我。"],"you":["你；你们","对正在说话的人说。"],"your":["你的；你们的","表示东西属于你或你们。"],"he":["他","指一个男性。"],"him":["他","表示动作的对象是一个男性。"],"his":["他的","表示东西属于他。"],"she":["她","指一个女性。"],"her":["她的；她","根据句子表示属于她或指她。"],"it":["它；这件事","常指东西、动物或一件事情。"],"its":["它的","表示东西属于它。"],"we":["我们","表示我和其他人。"],"us":["我们","表示动作的对象是我们。"],"our":["我们的","表示东西属于我们。"],"they":["他们；她们","指其他一些人。"],"them":["他们；她们","表示动作的对象是他们或她们。"],"their":["他们的；她们的","表示东西属于他们或她们。"],"this":["这个","指距离较近的一个人或东西。"],"that":["那个","指距离较远或已经提到的人或东西。"],"these":["这些","指距离较近的几个东西。"],"those":["那些","指距离较远的几个东西。"],"here":["这里","表示说话人所在的地方。"],"there":["那里","表示另一个地方。"],"come":["来","从别的地方到说话人所在的地方。"],"want":["想要","表示希望得到某物或做某事。"],"need":["需要","表示必须有某物或必须做某事。"],"like":["喜欢；像","表示喜欢，也可表示相似。"],"have":["有；拥有","表示拥有某物或某种情况。"],"do":["做","表示进行一件事情。"],"does":["做","do 的第三人称形式。"],"am":["是；处于","be 的形式之一，和 I 一起使用。"],"is":["是；处于","be 的形式之一，常和 he、she、it 一起使用。"],"are":["是；处于","be 的形式之一，常和 you、we、they 一起使用。"],"can":["可以；能","表示能力或允许。"],"cannot":["不能","表示没有能力或不允许。"],"please":["请","用于礼貌地提出请求。"],"help":["帮助","为别人提供需要的帮助。"],"where":["哪里","用来询问地点。"],"what":["什么","用来询问事物或信息。"],"when":["什么时候","用来询问时间。"],"how":["怎么；如何","用来询问方法或情况。"],"who":["谁","用来询问人。"],"why":["为什么","用来询问原因。"],"the":["这；那；特指的","用于特指已经知道或明确的名词，中文常不单独翻译。"],"a":["一个；一件","用于单数可数名词前，表示一个。"],"an":["一个；一件","a 在元音音素前的形式。"],"to":["到；去；向","常表示方向、目标或动作对象。"],"in":["在……里面；在……期间","表示位置或时间范围。"],"on":["在……上面；在……时候","表示位置或某个时间。"],"see":["看见","用眼睛看到。"],"look":["看；查看","把注意力放到某个东西上。"],"say":["说","用语言表达想法或信息。"],"know":["知道；认识","表示知道信息或认识某人。"],"understand":["明白；理解","表示理解意思。"],"wait":["等；等待","暂时停留，等事情发生或等人。"],"good":["很好；好","表示质量好、状态好或令人满意。"],"okay":["好的；可以","表示同意、接受或没有问题。"],"bad":["不好；坏的","表示质量差、状态不好或令人不满意。"],"new":["新的","以前没有用过或刚出现。"],"today":["今天","现在这一天。"],"tomorrow":["明天","今天之后的下一天。"],"yesterday":["昨天","今天之前的那一天。"],"morning":["早上；上午","一天中从早晨到中午前的时间。"],"afternoon":["下午","中午以后到傍晚前的时间。"],"evening":["晚上；傍晚","下午以后到睡觉前的时间。"],"one":["一；一个","数字 1，也可表示一个。"],"two":["二；两个","数字 2，也可表示两个。"],"three":["三；三个","数字 3，也可表示三个。"],"thank":["感谢","表示对别人的帮助或好意表示感激。"],"thanks":["谢谢","表示感谢的常用说法。"],"sorry":["对不起","用于道歉。"],"lost":["迷路的；丢失的","找不到路或找不到东西。"],"restroom":["洗手间","美国英语中常用的礼貌说法。"],"water":["水","一种无色、无味的液体。"],"food":["食物","可以吃的东西。"],"money":["钱","用于购买东西或服务的货币。"],"bus":["公交车","坐公交车时用的车。"],"subway":["地铁","城市里常见的公共交通。"],"called":["叫；称为","call 的过去式或过去分词，这里常表示“叫作”。"],"vegetable":["蔬菜","可以食用的植物部分。"],"go":["去","从这里到另一个地方。"],"stay":["留下；待着；停留","留在某个地方，不离开。"],"spinach":["菠菜","一种常见的绿叶蔬菜。"],"lettuce":["生菜","一种常见的绿叶蔬菜。"],"cucumber":["黄瓜","一种可以生吃或烹饪的蔬菜。"],"mushroom":["蘑菇","一种常见的可食用真菌。"],"corn":["玉米","一种常见的谷物和食物。"],"pound":["磅","美国常用的重量单位，约 0.45 千克。"],"slice":["切片；薄片","把食物切成薄片，也可指一片。"],"thin":["薄的","厚度比较小。"],"thicker":["更厚的","表示比另一个东西厚。"],"fresh":["新鲜的","食物等刚准备好或状态很好。"],"pork":["猪肉","猪的可食用肉。"],"beef":["牛肉","牛的可食用肉。"],"turkey":["火鸡；火鸡肉","一种鸟类，也指它的肉。"],"lamb":["羊肉；羔羊","幼羊，也常指羔羊肉。"],"chop":["排；切","这里常指一块肉排，也可表示切。"],"chicken":["鸡；鸡肉","一种家禽，也指它的肉。"],"leg":["腿；腿部","身体或动物身体的一部分。"],"bones":["骨头","动物身体里的硬骨。"],"apple":["苹果","一种常见水果。"],"apples":["苹果","apple 的复数形式。"],"sweet":["甜的","味道像糖一样甜。"],"banana":["香蕉","一种常见水果。"],"bananas":["香蕉","banana 的复数形式。"],"ripe":["成熟的","水果已经成熟，可以食用。"],"pear":["梨","一种常见水果。"],"peach":["桃子","一种有核的常见水果。"],"blueberry":["蓝莓","一种小型蓝色水果。"],"lemon":["柠檬","一种味道很酸的黄色水果。"],"pineapple":["菠萝","一种有硬外皮和甜酸果肉的水果。"],"sour":["酸的","味道带有酸味。"],"coffee":["咖啡","用咖啡豆制作的饮料。"],"tea":["茶","用茶叶冲泡的饮料。"],"cup":["杯；杯子","用来装饮料的容器。"],"glass":["玻璃杯；杯子","常用来装水或其他饮料的杯子。"],"hot":["热的；烫的","温度较高。"],"drink":["喝；饮料","表示喝东西，也可以指饮料。"],"spicy":["辣的","有辛辣味的。"],"onions":["洋葱","一种常见蔬菜。"],"allergic":["过敏的","身体对某种物质产生过敏反应。"],"peanuts":["花生","一种常见食物，也可能引起过敏。"],"check":["账单；检查","餐厅里常指需要支付的账单。"],"pharmacy":["药店","可以买药和获得药品帮助的地方。"],"once":["一次","表示发生一遍。"],"twice":["两次","表示发生两遍。"],"pharmacist":["药剂师","在药房提供药物和用药帮助的专业人员。"],"card":["卡；银行卡","这里指付款时使用的卡。"],"change":["零钱；找零；改变","这里通常指付款后找回的钱。"],"price":["价格","购买东西需要支付的钱数。"],"cheap":["便宜的","价格比较低。"],"expensive":["贵的","价格比较高。"],"high":["高的；高","这里常表示价格或数量高。"],"kitchen":["厨房","家里做饭和准备食物的地方。"],"living":["居住的；生活的","living room 中表示居住空间。"],"room":["房间","建筑物里的一个空间。"],"open":["打开；开放","让门窗等从关闭变成打开，也可表示开放。"],"close":["关上；关闭","让门窗等从打开变成关闭。"],"window":["窗户","建筑物中让光线和空气进入的开口。"],"television":["电视","用来看电视节目和视频的设备。"],"tv":["电视","television 的常用简称。"],"remote":["遥控器","控制电视等设备的工具。"],"daughter":["女儿","自己的女性孩子。"],"son":["儿子","自己的男性孩子。"],"sister":["姐妹；姐姐；妹妹","女性兄弟姐妹。"],"brother":["兄弟；哥哥；弟弟","男性兄弟姐妹。"],"family":["家人；家庭","和自己有家庭关系的人，也指家庭。"],"home":["家","自己居住的地方。"],"miss":["想念；错过","因为不在一起而想念某人，也可表示错过。"],"message":["留言；消息","别人留下或发送的信息。"],"answer":["回答；接听","回答问题或接听电话。"],"phone":["电话；手机","用来通话的设备。"],"number":["号码；数字","这里可指电话号码或数字。"],"text":["发短信；短信","用短信联系别人，也可指短信本身。"],"signal":["信号","手机或通信设备连接网络的信号。"],"left":["左边；向左；离开了","根据句子可表示方向左边或 leave 的过去式。"],"right":["右边；正确的","根据句子可表示方向右边或正确。"],"downtown":["市中心","城市中心区域。"],"station":["车站","公交车或地铁停靠的地方。"],"ticket":["票","乘车或进入某处使用的票。"],"transfer":["换乘；转移","从一种交通工具换到另一种，也可表示转移。"],"get":["得到；到达；变得","根据句子表示得到、到达或变成某种状态。"],"off":["离开；下车","get off 中表示下车。"],"street":["街道","城市中车辆和行人通行的道路。"],"corner":["街角；角落","两条街相交的位置，也可指一个角落。"],"nearby":["附近的","距离不远。"],"far":["远的","距离比较大。"],"cold":["冷的","温度较低。"],"rain":["雨；下雨","表示雨水或下雨。"],"snow":["雪；下雪","表示雪或下雪。"],"outside":["外面；室外","建筑物外的地方。"],"umbrella":["雨伞","下雨时用来挡雨的工具。"],"coat":["外套","穿在身体外面的衣服。"],"sunny":["晴朗的","天气有阳光、没有明显下雨。"],"year":["年","大约十二个月的一段时间。"],"next":["下一个；下一","表示顺序或时间中紧接着的一个。"],"last":["上一个；最后的","根据句子表示前一个或最后一个。"],"month":["月；月份","一年中的十二个时间单位之一。"],"birthday":["生日","出生日期每年对应的那一天。"],"date":["日期","表示某一天的年月日。"],"spring":["春天","四季中天气开始变暖的季节。"],"summer":["夏天","四季中通常最热的季节。"],"fall":["秋天；落下","在这里通常表示秋天，也可表示落下。"],"winter":["冬天","四季中通常最冷的季节。"],"warm":["温暖的","温度舒服、不冷。"],"beautiful":["漂亮的；美丽的","形容外表或景色好看。"],"season":["季节","春夏秋冬中的一个。"],"coldest":["最冷的","在比较中温度最低。"],"eleven":["十一；十一个","数字 11。"],"twelve":["十二；十二个","数字 12。"],"twenty":["二十；二十个","数字 20。"],"thirty":["三十；三十个","数字 30。"],"hundred":["一百；一百个","数字 100。"],"first":["第一","表示顺序第一。"],"second":["第二；秒","表示顺序第二，也可表示时间单位秒。"],"early":["早的；早早地","时间比通常安排的时间更早。"],"late":["晚的；迟到的","时间比通常安排的时间更晚。"],"noon":["中午","大约一天中十二点的时间。"],"wrong":["错误的","不正确的。"],"speak":["说话","使用语言说话。"],"slowly":["慢慢地","速度比较慢。"],"clearly":["清楚地","让声音、意思或信息容易理解。"],"hear":["听见","用耳朵听到声音。"],"a little":["一点；少量","表示数量比较少。"],"english":["英语","一种语言。"],"feel":["感觉","表示身体或心里的感受。"],"dizzy":["头晕的","感觉周围在转或身体不稳。"],"tired":["累的；疲倦的","身体或精神需要休息的状态。"],"rest":["休息","停止活动一段时间。"],"appointment":["预约；约定的时间","提前约好的见面或看诊时间。"],"write":["写","用文字记录信息。"],"hurt":["疼；受伤","身体感到疼痛或受到伤害。"],"should":["应该","表示建议、责任或应该做的事情。"],"take":["拿；带；服用","根据句子表示拿走、带走或服用。"],"medicine":["药；药物","用于预防、治疗或缓解疾病的物质。"],"times":["次数；倍数","表示事情发生的次数。"],"dollars":["美元","美国使用的货币单位。"],"pay":["付款","为商品或服务支付钱。"],"just":["只是；刚刚","根据句子表示限制或时间。"],"black":["黑色的","一种颜色。"],"red":["红色的","一种颜色。"],"large":["大的；大号","尺寸比较大。"],"small":["小的；小号","尺寸比较小。"],"store":["商店","可以买东西的地方。"],"no":["不；没有","表示否定或没有。"],"sugar":["糖","一种常见的甜味食品。"],"full":["饱的；满的","这里可表示吃饱了，也可表示装满。"],"tastes":["尝起来；有……味道","描述食物或饮料尝起来的味道。"],"well":["好；健康地","feel well 中表示感觉健康、状态好。"],"forgot":["忘记了","forget 的过去式。"],"every":["每一个；每次","表示全部中的每一个。"],"day":["天；一天","表示一天这段时间。"],"ask":["问；询问","向别人提出问题。"],"weather":["天气","某个地方某段时间的天气情况。"],"place":["地方；地点","一个位置或地点。"],"moment":["片刻；一会儿","很短的一段时间。"],"later":["稍后；以后","表示现在之后的一段时间。"],"little":["少量的；一点","表示数量少。"],"together":["一起","和别人共同做事情。"],"nice":["好的；友好的；令人愉快的","表示感觉好、态度友好或令人愉快。"],"meet":["见面；遇见","和别人见面。"],"hello":["你好","打招呼用语。"],"call":["打电话；叫","这里通常表示打电话给某人。"],"ambulance":["救护车","用于运送需要紧急医疗帮助的人的车辆。"],"walk":["走路","用脚步行。"],"leave":["离开；留下","根据句子表示离开某处或留下某物。"],"sit":["坐","让身体处于坐着的姿势。"],"door":["门","房间进出的门。"],"TV":["电视","television 的简称。"],"older":["年长的；较大的","表示年龄更大。"],"younger":["年幼的；较小的","表示年龄更小。"],"will":["将会；会","表示将来会发生或要做的事情。"],"would":["想要；会","would like 常用于礼貌地表示想要。"],"of":["的；属于","常表示所属、关系或部分。"],"hurts":["疼；感到疼","hurt 的第三人称形式。"],"many":["许多；很多","用于可数的人或东西。"],"much":["多少；很多","常用于不可数事物的数量或程度。"],"cheaper":["更便宜的","价格比另一个更低。"],"return":["返回；退回","表示回到原来的地方，也可表示退货。"],"tell":["告诉","把信息说给别人知道。"],"not":["不；没有","表示否定。"],"by":["通过；在……旁边；由","根据句子表示方式、位置或动作执行者。"],"down":["向下；坐下","表示向下的方向，也可在 sit down 中表示坐下。"],"again":["再一次","表示重复发生。"],"or":["或者；还是","用于两个或多个选择之间。"],"january":["一月","一年中的第一个月。"],"february":["二月","一年中的第二个月。"],"march":["三月","一年中的第三个月。"],"april":["四月","一年中的第四个月。"],"may":["五月；可以","表示五月这个月份；也可表示允许。"],"june":["六月","一年中的第六个月。"],"july":["七月","一年中的第七个月。"],"august":["八月","一年中的第八个月。"],"september":["九月","一年中的第九个月。"],"october":["十月","一年中的第十个月。"],"november":["十一月","一年中的第十一个月。"],"december":["十二月","一年中的第十二个月。"],"ten":["十；十个","数字 10。"],"time":["时间；次数","根据句子表示时间或事情发生的次数。"],"at":["在；于","表示具体时间或地点。"],"be":["是；成为","表示存在、状态或成为某种情况。"],"been":["已经是；曾经是","be 的过去分词，表示过去的状态。"],"from":["从；来自","表示起点或来源。"],"now":["现在；目前","表示这个时候。"],"over":["超过；结束","根据句子表示超过范围或结束。"],"very":["很；非常","用来加强程度。"],"all":["全部；所有","表示没有遗漏的全部东西或人。"],"eat":["吃","把食物放进嘴里并食用。"],"give":["给","把东西交给别人。"],"has":["有","have 的第三人称形式。"],"half":["一半；半个","表示一个整体的二分之一。"],"less":["较少；更少","表示数量或程度比较少。"],"looking":["看；正在看","look 的现在分词形式。"],"live":["住；生活","表示居住或生活。"],"long":["长的；久的","表示长度大或时间久。"],"meat":["肉","动物可食用的肉。"],"stop":["停；停止；车站","根据句子表示停止或停靠地点。"],"snows":["下雪","snow 的第三人称形式。"],"too":["也；太","根据句子表示也或程度过高。"],"which":["哪一个；哪个","在几个选择中询问其中哪一个。"],"aunt":["姑妈；姨妈","父母的姐妹。"],"uncle":["叔叔；舅舅","父母的兄弟。"],"child":["孩子","年龄较小的人。"],"children":["孩子们","child 的复数。"],"people":["人；人们","指人或一群人。"],"person":["人；个人","指一个人。"],"thing":["东西；事情","指物品或事情。"],"things":["东西；事情","thing 的复数。"],"same":["相同的；一样的","表示两个事物没有区别。"],"different":["不同的","表示与另一个不一样。"],"more":["更多；更加","表示数量或程度增加。"],"most":["最多；最","表示数量最大或程度最高。"],"some":["一些；某些","表示不确定的一部分。"],"any":["任何；一些","常用于疑问句和否定句。"],"each":["每一个","逐个表示一组中的单个成员。"],"third":["第三","表示顺序第三。"],"four":["四；四个","数字 4，也可表示四个。"],"five":["五；五个","数字 5，也可表示五个。"],"six":["六；六个","数字 6，也可表示六个。"],"seven":["七；七个","数字 7，也可表示七个。"],"eight":["八；八个","数字 8，也可表示八个。"],"nine":["九；九个","数字 9，也可表示九个。"],"thirteen":["十三；十三个","数字 13。"],"fourteen":["十四；十四个","数字 14。"],"fifteen":["十五；十五个","数字 15。"],"sixteen":["十六；十六个","数字 16。"],"seventeen":["十七；十七个","数字 17。"],"eighteen":["十八；十八个","数字 18。"],"nineteen":["十九；十九个","数字 19。"],"was":["是；处于","be 的过去式，常用于单数主语。"],"were":["是；处于","be 的过去式，常用于 you、we、they 等。"],"did":["做了","do 的过去式。"],"make":["制作；使","表示制作东西或使某事发生。"],"use":["使用","把东西用于某个目的。"],"listen":["听","有意识地听声音或别人说话。"],"watch":["观看；看守","持续看电视、视频或某个活动。"],"size":["尺寸；大小","表示物品大小的程度。"]};

Object.assign(WORDS, {
  '911':['九一一；美国紧急电话','美国遇到紧急情况时拨打的电话。'],
  will:['将会；会','表示将来会发生的事情。'],
  would:['想要；会','would like 表示礼貌地说“想要”。'],
  of:['的；属于','常用来表示所属或事物之间的关系。'],
  hurts:['疼；感到疼','hurt 的第三人称形式。'],
  many:['许多；很多','用于可数的人或东西数量。'],
  much:['多少；很多','常用于询问不可数的数量。'],
  cheaper:['更便宜的','表示价格比另一个更低。'],
  return:['退回；返回','买东西时可表示退货，也可表示回去。'],
  tell:['告诉；说','把信息告诉别人。'],
  call:['打电话；叫','这里表示打电话。'],
  not:['不；没有','表示否定。'],
  by:['通过；在……旁边','这里常用于表示方式或位置。'],
  down:['向下；坐下','这里在 sit down 中表示坐下。'],
  again:['再一次','表示重复一次。'],
  or:['或者；还是','用于两个或多个选择之间。'],
  january:['一月','一年中的第一个月。'], february:['二月','一年中的第二个月。'], march:['三月','一年中的第三个月。'],
  april:['四月','一年中的第四个月。'], may:['五月','一年中的第五个月。'], june:['六月','一年中的第六个月。'],
  july:['七月','一年中的第七个月。'], august:['八月','一年中的第八个月。'], september:['九月','一年中的第九个月。'],
  october:['十月','一年中的第十个月。'], november:['十一月','一年中的第十一个月。'], december:['十二月','一年中的第十二个月。'],
  ten:['十；十个','数字 10。'], time:['时间；次数','这里可表示时间，也可表示次数。']
});

const NEW_CHINA_DATA = [
  ["你好，这里是新中国餐馆。", "Hi, this is New China Restaurant.", "接电话时介绍新中国餐馆。"],
  ["您想要什么？", "What would you like?", "接电话或点餐时询问客人想要什么。"],
  ["自取还是外送？", "Is that for pickup or delivery?", "确认客人是来取餐还是需要外送。"],
  ["您的地址是什么？", "What is your address?", "外送时询问客人的地址。"],
  ["您的电话号码是多少？", "What is your phone number?", "点餐或外送时询问电话号码。"],
  ["小份还是大份？", "Small or large?", "询问客人要小份还是大份。"],
  ["要蔬菜还是不要蔬菜？", "With vegetables or no vegetables?", "确认客人是否要加蔬菜。"],
  ["您要几个？", "How many would you like?", "询问客人需要几个。"],
  ["还要别的吗？", "Anything else?", "点餐结束前询问客人是否还需要别的东西。"],
  ["请稍等。", "Please wait a moment.", "让客人稍等一下。"],
  ["您几点来取餐？", "What time will you pick it up?", "自取订单时询问取餐时间。"],
  ["谢谢您打电话给新中国。", "Thank you for calling New China.", "电话结束时礼貌地感谢客人。"],
  ["左宗棠鸡", "General Tso's Chicken", "新中国菜单上的常见鸡肉菜名。"],
  ["西兰花鸡", "Chicken with Broccoli", "鸡肉和西兰花的常见中式外卖菜名。"],
  ["牛肉捞面", "Beef Lo Mein", "牛肉和捞面的常见外卖菜名。"],
  ["虾炒饭", "Shrimp Fried Rice", "虾和炒饭的常见外卖菜名。"],
  ["薯条", "French Fries", "炸土豆条。"],
  ["鸡翅", "Chicken Wings", "鸡翅做成的常见小吃或菜。"],
  ["蛋卷", "Egg Roll", "常见的中式炸卷类小吃。"],
  ["披萨卷", "Pizza Roll", "里面有披萨馅料的卷类小吃。"],
];

const V11_WORD_DEFINITIONS = {
  "anything": ["任何东西；任何事", "用于询问是否还有其他东西。"],
  "broccoli": ["西兰花", "绿色花球状的蔬菜。"],
  "chicken": ["鸡；鸡肉", "可以指鸡这种动物，也可以指鸡肉。"],
  "delivery": ["外送；配送", "把食物或东西送到客人指定的地方。"],
  "egg": ["鸡蛋", "鸡产的蛋，也常用于做菜。"],
  "else": ["其他；另外", "表示除了已经提到的东西以外。"],
  "french": ["法式的", "在 French Fries 中表示这种薯条的名称。"],
  "fried": ["炒的；炸的", "用油加热烹调的食物。"],
  "fries": ["薯条", "切成条状后油炸的土豆。"],
  "general": ["将军；普通的", "General Tso's Chicken 中是菜名的一部分。"],
  "how": ["怎么；如何", "询问方式或程度。"],
  "is": ["是；处于", "be 的第三人称单数形式。"],
  "large": ["大的；大份的", "尺寸或份量比较大。"],
  "lo": ["捞面中的 Lo", "Lo Mein 是一种中式面条菜名。"],
  "mein": ["面（Lo Mein 中）", "Lo Mein 是一种中式面条菜名。"],
  "many": ["许多；多少", "用于询问或表示数量。"],
  "no": ["不；没有", "用于否定回答或表示没有。"],
  "or": ["或者", "表示两个或多个选择中的一个。"],
  "pickup": ["自取；取餐", "客人自己到餐馆取已经准备好的订单。"],
  "pizza": ["披萨", "一种常见的烘烤食品，通常有面饼、酱料和奶酪等。"],
  "restaurant": ["餐馆；餐厅", "提供食物和饮料给客人用餐或购买的地方。"],
  "rice": ["米饭；米", "常见的主食，也用于炒饭等菜。"],
  "roll": ["卷；卷类食物", "把食物卷起来做成的食物，也可指面包卷。"],
  "shrimp": ["虾", "常见的海鲜食材。"],
  "small": ["小的；小份的", "尺寸或份量比较小。"],
  "tso's": ["Tso 的", "General Tso's Chicken 菜名中的专有名称部分。"],
  "vegetables": ["蔬菜（复数）", "可以作为食物吃的植物部分，vegetable 的复数形式。"],
  "wings": ["鸡翅；翅膀（复数）", "chicken wings 中指鸡翅。"],
  "with": ["和；带有", "表示一起或包含某种东西。"],
  "would": ["会；愿意；想要", "常用于礼貌地询问或表达想要什么。"]
  ,"a": ["一个；一名", "用于表示一个人或一件事。"]
  ,"calling": ["打电话；致电", "call 的现在分词，在这里表示打电话给餐馆。"]
  ,"china": ["中国；中国的", "China 是中国的英文名称；这里也是餐馆名称的一部分。"]
  ,"for": ["给；为了", "表示对象、目的或用途。"]
  ,"hi": ["你好；嗨", "非正式的打招呼用语。"]
  ,"it": ["它；这件事", "用来指代已经提到的人、事或东西。"]
  ,"like": ["喜欢；想要", "可以表示喜欢，也常用于 would like 表达想要。"]
  ,"moment": ["片刻；一会儿", "很短的一段时间。"]
  ,"new": ["新的", "表示以前没有或最近出现的。"]
  ,"number": ["数字；号码", "表示数量的符号，也可指电话号码等编号。"]
  ,"phone": ["电话；手机", "用来通话的设备。"]
  ,"pick": ["拿；取", "在 pick it up 中表示取走或取餐。"]
  ,"please": ["请", "用于礼貌地提出请求。"]
  ,"thank": ["感谢", "表示对别人帮助或服务的感谢。"]
  ,"that": ["那个；那件事", "用来指已经提到或距离较远的人、事或东西。"]
  ,"this": ["这个；这里的", "用来指眼前或刚提到的人、事或东西。"]
  ,"up": ["向上；起来", "在 pick it up 中表示取走。"]
  ,"wait": ["等待；等一下", "暂时不离开，等一会儿。"]
  ,"what": ["什么；什么东西", "用于询问事物或信息。"]
  ,"will": ["将会；会", "表示将来发生的事情。"]
  ,"you": ["你；您；你们", "指正在说话的对象。"]
  ,"your": ["你的；您的", "表示某样东西属于正在说话的人。"]
};

const V10_WORD_DEFINITIONS = {"address":["地址","表示一个地点的具体地址。"],"after":["在……以后","表示时间在某件事之后。"],"again":["再一次","表示重复做一次。"],"airport":["机场","飞机起飞和降落的地方。"],"allergic":["过敏的","身体对某种食物或药物产生过敏反应。"],"already":["已经","表示某件事在现在以前发生了。"],"ambulance":["救护车","运送病人或伤者去医院的车辆。"],"answer":["回答；答案","answer 可以表示回答，也可以表示问题的答案。"],"apple":["苹果","常见的圆形水果。"],"apples":["苹果（复数）","apple 的复数形式，表示两个或更多苹果。"],"appointment":["预约","事先约好的见面或看诊时间。"],"april":["四月","一年中的第四个月。"],"arrive":["到达","到达某个地方。"],"arrived":["到达了","arrive 的过去式，表示已经到达。"],"ask":["问；询问","向别人提出问题或请求信息。"],"at":["在；于","表示具体时间或地点。"],"august":["八月","一年中的第八个月。"],"away":["离开；远处","表示离某个地方有距离或离开。"],"bacon":["培根","通常腌制后煎熟的猪肉。"],"banana":["香蕉","常见的黄色水果。"],"bananas":["香蕉（复数）","banana 的复数形式。"],"bathroom":["浴室；洗手间","洗澡、洗手或上厕所的房间。"],"battery":["电池","储存并提供电力的装置。"],"be":["是；存在","表示身份、状态或存在。"],"beans":["豆类；豆子","豆类植物的种子，也可指豆类蔬菜。"],"beautiful":["漂亮的；美丽的","形容外表或景色很好看。"],"bed":["床","用来睡觉和休息的家具。"],"bedroom":["卧室","睡觉和休息的房间。"],"beef":["牛肉","牛的肉。"],"been":["是过；处于过","be 的过去分词，常用于完成时。"],"before":["在……以前","表示时间早于某件事。"],"bigger":["更大的","big 的比较级，表示尺寸更大。"],"bill":["账单；纸币","在餐厅表示账单，也可以指纸币。"],"birthday":["生日","一个人出生的日期，每年庆祝的日子。"],"black":["黑色的","一种很深的颜色。"],"bleeding":["流血","血液正在从身体流出。"],"blooming":["正在开花","花正在开放。"],"blueberry":["蓝莓","一种小而圆的蓝色或深紫色水果。"],"bones":["骨头","构成身体骨骼的硬组织；bones 是复数。"],"breakfast":["早餐","一天中的第一顿饭。"],"breast":["胸部；乳房","身体前面的胸部区域；在 chicken breast 中指鸡胸肉。"],"bridge":["桥","跨过河流、道路等的建筑。"],"broccoli":["西兰花","绿色花球状的蔬菜。"],"brother":["兄弟","男性的兄弟姐妹。"],"buy":["买","用钱换取商品或服务。"],"by":["通过；在……旁边","表示方式、手段或靠近的位置。"],"cabbage":["卷心菜","圆形叶菜。"],"call":["打电话；呼叫","通过电话联系，也可以表示叫某人。"],"card":["卡；卡片","用于付款、身份或其他用途的卡片。"],"care":["照顾；关心","照顾某人或在意某事。"],"careful":["小心的","做事时注意安全和细节。"],"carrot":["胡萝卜","常见的橙色根茎类蔬菜。"],"cash":["现金","纸币和硬币等实物钱。"],"celery":["芹菜","茎比较脆的蔬菜。"],"chair":["椅子","供人坐的家具。"],"change":["零钱；改变","付款时可指找零，也可以表示改变。"],"charger":["充电器","给电子设备充电的设备。"],"cheap":["便宜的","价格比较低。"],"cheaper":["更便宜的","cheap 的比较级，表示价格更低。"],"check":["账单；检查","餐厅中可指账单，也可以表示检查。"],"cherry":["樱桃","小而圆的水果。"],"chicken":["鸡；鸡肉","可以指鸡这种动物，也可以指鸡肉。"],"child":["孩子","年龄较小的人，也可以指自己的儿女。"],"chop":["切；剁","用刀把食物切成块或片。"],"clearly":["清楚地","以容易听懂或看懂的方式。"],"close":["关；关闭","把打开的东西合上或关闭。"],"cloudy":["多云的","天空有很多云，阳光较少。"],"coat":["外套","穿在衣服外面的保暖或防风衣服。"],"coffee":["咖啡","用咖啡豆制作的饮料。"],"coin":["硬币","金属制成的钱。"],"cold":["冷的","温度比较低。"],"coldest":["最冷的","cold 的最高级，表示温度最低。"],"color":["颜色","物体看起来的色彩。"],"colors":["颜色（复数）","color 的复数形式。"],"contact":["联系人","手机中保存的某个人的信息。"],"cool":["凉的；酷的","天气中表示温度较凉，也可表示很酷。"],"corn":["玉米","常见的黄色谷物和食物。"],"corner":["角落；拐角","两条边或道路相接的位置。"],"cough":["咳嗽","一种把空气从呼吸道快速呼出的动作。"],"course":["课程；过程","学习中的课程，也可表示事情进行的过程。"],"credit":["信用","付款中指信用额度或信用卡相关的信用。"],"cross":["穿过","从一边到另一边通过。"],"cucumber":["黄瓜","细长的绿色蔬菜。"],"cup":["杯；一杯","用来装饮料的容器，也可表示一杯的量。"],"dangerous":["危险的","可能造成伤害或危险。"],"date":["日期","表示某一天的年月日。"],"daughter":["女儿","父母的女性孩子。"],"day":["天；一天","从一天到下一天的时间单位。"],"dead":["没电的；死亡的","手机中可表示电池没电；也可表示没有生命。"],"debit":["借记","银行账户直接扣款的付款方式。"],"december":["十二月","一年中的第十二个月。"],"decided":["决定了","decide 的过去式，表示已经作出决定。"],"delicious":["美味的","味道很好吃。"],"did":["做了；用于过去时","do 的过去式，表示过去做过某事。"],"dinner":["晚餐","通常在晚上吃的一顿饭。"],"discount":["折扣","从原价中减去的一部分价格。"],"dish":["菜；盘子","可以指一道菜，也可以指装食物的盘子。"],"dizzy":["头晕的","感觉身体或周围好像在转，站立不稳。"],"doctor":["医生","检查和治疗病人的专业人员。"],"dollar":["美元","美国使用的货币单位。"],"dollars":["美元（复数）","dollar 的复数形式。"],"door":["门","房间或建筑物的出入口。"],"dose":["剂量","一次应该使用的药量。"],"down":["向下","表示从较高处向较低处。"],"downstairs":["楼下","建筑物较低的一层或向较低楼层移动。"],"downtown":["市中心","城市中心的商业或主要区域。"],"drink":["喝；饮料","可以表示喝东西，也可以表示饮料。"],"duck":["鸭；鸭肉","可以指鸭这种动物，也可以指鸭肉。"],"early":["早；接近","时间比预期早，或接近某个时间或数量。"],"eat":["吃","把食物放进嘴里并进食。"],"effect":["效果；影响","某件事情产生的结果或影响。"],"eight":["八","数字 8。"],"eleven":["十一","数字 11。"],"english":["英语","英国、美国等地使用的语言。"],"entrance":["入口","进入建筑或地点的地方。"],"exit":["出口","离开建筑或地点的地方。"],"expensive":["贵的","价格比较高。"],"express":["快车；快速的","交通中表示停站较少的快车，也可表示速度快。"],"fall":["秋天；跌倒","美国英语中指秋天，也可以表示跌倒。"],"family":["家人；家庭","有家庭关系的一群人。"],"far":["远的","距离比较大。"],"father":["父亲","男性家长。"],"february":["二月","一年中的第二个月。"],"feel":["感觉","用身体或情绪感受到某种状态。"],"fever":["发烧","体温高于正常水平的状态。"],"find":["找到；发现","经过寻找后得到或发现某物。"],"first":["第一","表示顺序中的第一个。"],"five":["五","数字 5。"],"floor":["地板；楼层","房间下面的表面，也可指建筑物的一层。"],"flowers":["花（复数）","植物开放的花朵。"],"foggy":["有雾的","空气中有很多雾，视线受到影响。"],"forecast":["预报","对未来情况的预测；weather forecast 是天气预报。"],"forgot":["忘记了","forget 的过去式，表示没有记住。"],"fork":["叉子","吃饭时用来叉食物的餐具。"],"four":["四","数字 4。"],"free":["免费的；自由的","不需要付钱，也可表示不受限制。"],"fresh":["新鲜的","没有变质、刚买或保存良好的。"],"from":["从；来自","表示起点、来源或来自某地。"],"full":["饱的；满的","吃完后没有食欲，也可表示容器装满。"],"garlic":["大蒜","有强烈味道的调味食材。"],"get":["得到；到达；变得","根据句子可以表示取得、到达或发生变化。"],"getting":["正在变得；得到","get 的现在分词，表示正在发生的取得或变化。"],"give":["给","把东西交给别人。"],"glass":["玻璃杯；一杯","装饮料的杯子，也可表示一杯的量。"],"goodbye":["再见","道别时说的话。"],"granddaughter":["孙女","儿子或女儿的女儿。"],"grandfather":["祖父；外祖父","父亲或母亲的爸爸。"],"grandmother":["祖母；外祖母","父亲或母亲的妈妈。"],"grandson":["孙子","儿子或女儿的儿子。"],"grape":["葡萄","一串串生长的小水果。"],"green":["绿色的","一种常见的颜色。"],"ground":["地面；绞碎的","可以指地面，也可表示食材被绞碎。"],"half":["一半","一个整体的二分之一。"],"ham":["火腿","经过腌制或熟制的猪腿肉。"],"happy":["开心的；高兴的","表示感到快乐。"],"has":["有；拥有","have 的第三人称单数形式。"],"headache":["头痛","头部疼痛的感觉。"],"hear":["听见","用耳朵接收到声音。"],"hello":["你好","常用的打招呼用语。"],"high":["高的","位置、数量或程度比较高。"],"home":["家","自己居住的地方。"],"hot":["热的","温度比较高。"],"hour":["小时","六十分钟的时间单位。"],"humidity":["湿度","空气中水分的多少。"],"hundred":["一百","数字 100。"],"hungry":["饿的","感到想吃东西。"],"hurt":["疼；伤害","表示身体疼痛，也可表示使人受伤。"],"hurts":["疼；使疼痛","hurt 的第三人称单数形式。"],"husband":["丈夫","结婚关系中的男性配偶。"],"ice":["冰","冻结成固体的水。"],"incoming":["进来的","正在进入或到来的。"],"injured":["受伤的","身体受到伤害的状态。"],"intersection":["十字路口","两条或多条道路相交的地方。"],"january":["一月","一年中的第一个月。"],"juice":["果汁","水果等食材榨出的液体饮料。"],"july":["七月","一年中的第七个月。"],"june":["六月","一年中的第六个月。"],"just":["只是；刚刚","根据句子可表示仅仅或刚刚发生。"],"key":["钥匙","用来开锁的物品。"],"kitchen":["厨房","做饭和准备食物的房间。"],"kiwi":["猕猴桃","棕色外皮、绿色果肉的水果。"],"lamb":["羊肉；羔羊","lamb 可指幼羊，也可指羊肉。"],"lamp":["灯","用来照明的设备。"],"large":["大的；大号的","尺寸比较大。"],"last":["最后的；上一个","可以表示顺序最后，也可以表示前一个时间段。"],"late":["晚的","时间比正常或预期晚。"],"later":["稍后；后来","表示在之后的时间。"],"leave":["离开；留下","可以表示从某地离开，也可以表示让某物留在那里。"],"leaves":["树叶；离开","leave 的第三人称单数，也可以是 leaf 的复数。"],"left":["左边的；离开了","表示方向左边，也可为 leave 的过去式。"],"leg":["腿","人体从髋部到脚的部分；也可指鸡腿等动物腿部。"],"lemon":["柠檬","黄色、味道酸的水果。"],"less":["较少；更少","表示数量或程度比较低。"],"lettuce":["生菜","常见的叶菜。"],"light":["光；灯","照亮环境的光，也可指照明设备。"],"liquid":["液体","没有固定形状、可以流动的物质。"],"little":["少量的；小的","表示数量少或尺寸小。"],"live":["居住；生活","可以表示住在某处或生活。"],"living":["居住的；生活中的","表示正在生活或居住的状态。"],"long":["长的；长时间的","表示长度大或持续时间久。"],"looking":["正在看","look 的现在分词，表示正在看。"],"luck":["运气","事情顺利或不顺利的结果。"],"lunch":["午餐","通常在中午吃的一顿饭。"],"mango":["芒果","香甜多汁的热带水果。"],"many":["许多；很多","表示数量比较多。"],"march":["三月","一年中的第三个月。"],"may":["五月；可能","May 是五月，也可作为情态动词表示可能。"],"maybe":["也许","表示不确定的可能性。"],"meal":["一顿饭","一次吃的完整食物。"],"meat":["肉","动物的肉，可作为食物。"],"medicine":["药；药物","用于预防、治疗或缓解疾病的物质。"],"meet":["见面；遇见","和某人见面或遇到某人。"],"menu":["菜单","餐厅列出食物和饮料的清单。"],"message":["消息；留言","传给别人的信息。"],"midnight":["午夜","夜里十二点左右的时间。"],"milk":["牛奶","常见的乳制饮料。"],"minute":["分钟","六十秒的时间单位。"],"miss":["错过；想念","可以表示没有赶上，也可以表示想念某人。"],"missed":["错过了","miss 的过去式，表示没有赶上或错过。"],"mistake":["错误","做错的事情或不正确之处。"],"moment":["片刻；一会儿","很短的一段时间。"],"month":["月；月份","大约四周的一段时间。"],"mother":["母亲","女性家长。"],"move":["移动","改变位置或让身体移动。"],"much":["很多；非常","常用于不可数事物的数量，也可表示程度很高。"],"mushroom":["蘑菇","常见的可食用真菌。"],"mute":["静音","关闭设备声音。"],"name":["名字；名称","用来称呼或识别人、地方、东西的词。"],"nearby":["附近的","距离这里很近。"],"next":["下一个；接下来","表示顺序或时间紧接着的一个。"],"nice":["好的；友好的","表示令人愉快、不错或友好。"],"night":["夜晚","太阳落山到第二天早晨之间的时间。"],"no":["不；没有","用于否定回答或表示没有。"],"noon":["中午","一天中大约十二点的时间。"],"not":["不；没有","用于构成否定。"],"november":["十一月","一年中的第十一个月。"],"now":["现在","当前这个时间。"],"number":["数字；号码","表示数量的符号，也可指电话号码等编号。"],"october":["十月","一年中的第十个月。"],"of":["……的；……中的","常表示所属、关系或部分。"],"off":["关闭；离开","设备中表示关闭，也可表示离开某处或脱离状态。"],"okay":["好的；可以","表示同意、接受或情况没有问题。"],"old":["老的；旧的","年龄较大，也可以表示使用过一段时间。"],"older":["更年长的；更旧的","old 的比较级，表示年龄或时间更大。"],"once":["一次","表示发生一回。"],"onion":["洋葱","常用来做菜的蔬菜。"],"onions":["洋葱（复数）","onion 的复数形式。"],"open":["打开","使关闭的东西变为开放状态。"],"or":["或者","表示两个或多个选择中的一个。"],"orange":["橙子；橙色的","可以指水果，也可以指橙色。"],"ordered":["点了；订购了","order 的过去式，表示已经点餐或订购。"],"other":["其他的","表示另外的、不同的。"],"outside":["外面","建筑物或某个范围之外。"],"over":["在……上方；结束","表示位置在上面，也可表示事情结束。"],"pay":["付款","给钱以购买商品或服务。"],"peach":["桃子","一种柔软多汁的水果。"],"peanuts":["花生（复数）","peanut 的复数形式，一种常见坚果类食物。"],"pear":["梨","常见的甜味水果。"],"pharmacist":["药剂师","在药房配药并提供用药信息的人。"],"pharmacy":["药房","购买或领取药物的地方。"],"phone":["电话；手机","用来通话的设备。"],"pill":["药片","可以吞服的固体药物。"],"pineapple":["菠萝","外皮粗糙、果肉多汁的热带水果。"],"place":["地方；地点","某个具体的位置或区域。"],"police":["警察","负责维护公共安全和处理紧急情况的人员或部门。"],"pork":["猪肉","猪的肉。"],"potato":["土豆","常见的根茎类食物。"],"pound":["磅","英美常用的重量单位，1 磅约等于 454 克。"],"prescription":["处方","医生给出的用药指示或药方。"],"price":["价格","购买商品或服务需要支付的钱数。"],"problem":["问题；困难","需要解决的事情或困难。"],"rain":["雨；下雨","从云中落下的水，也可表示下雨。"],"receipt":["收据","购买后证明付款和商品信息的纸张或电子记录。"],"red":["红色的","一种常见的颜色。"],"refrigerator":["冰箱","用来冷藏或冷冻食物的电器。"],"relative":["亲戚","和自己有家庭或血缘关系的人。"],"remote":["遥控器；远程的","可以指控制设备的遥控器，也可表示距离远。"],"repeat":["重复","再说或再做一次。"],"rest":["休息","停止活动一段时间以恢复体力。"],"return":["退回；返回","把东西送回，也可以表示回到原来的地方。"],"ribs":["排骨；肋骨","可以指带骨头的肉，也可以指身体的肋骨。"],"right":["右边的；正确的","表示方向右边，也可表示正确。"],"ripe":["成熟的","水果已经成熟，可以食用。"],"room":["房间","建筑物中有墙和门的空间。"],"salt":["盐","常用于调味的白色晶体。"],"sausage":["香肠","把肉调味后制成的食品。"],"season":["季节","一年中天气特点相近的一段时间。"],"second":["第二；秒","可以表示顺序第二，也可以表示时间单位秒。"],"september":["九月","一年中的第九个月。"],"seven":["七","数字 7。"],"should":["应该","表示建议、责任或认为某事最好这样做。"],"side":["一边；一侧","物体或地方的某一个边或方向。"],"signal":["信号","手机或其他设备用来连接通信的信号。"],"sister":["姐妹","女性的兄弟姐妹。"],"sit":["坐","让身体处于坐着的姿势。"],"six":["六","数字 6。"],"size":["尺寸；大小","表示物品大小的程度。"],"sleep":["睡觉","身体休息时的状态。"],"slice":["切片；切","把食物切成片，也可表示切片本身。"],"slowly":["慢慢地","以较慢的速度进行。"],"small":["小的；小号的","尺寸或数量比较小。"],"smaller":["更小的","small 的比较级，表示尺寸更小。"],"snow":["雪；下雪","从天空降下的冰晶，也可表示下雪。"],"snows":["下雪","snow 的第三人称单数形式。"],"soda":["汽水","有气泡的甜味饮料。"],"someone":["某人","表示不知道或不说明身份的一个人。"],"son":["儿子","父母的男性孩子。"],"sore":["疼痛的","身体某个部位感到疼痛或不舒服。"],"soup":["汤","用水或汤汁煮成的液体食物。"],"sour":["酸的","味道像柠檬一样带酸味。"],"speak":["说；讲话","用语言表达想法或信息。"],"spicy":["辣的","食物含有明显的辣味。"],"spinach":["菠菜","常见的绿色叶菜。"],"spring":["春天","一年中天气开始变暖、植物生长的季节。"],"start":["开始","从某件事情的起点开始进行。"],"station":["车站","公共交通工具停靠和乘客上下车的地方。"],"stay":["留下；待着；停留","在某个地方继续待着而不离开。"],"steak":["牛排","一块可以煎或烤的牛肉。"],"stomach":["胃；肚子","身体中消化食物的器官，也常指腹部。"],"stop":["停止；站","停止动作，也可以指公交车等停靠的站。"],"store":["商店","出售商品的地方。"],"storm":["暴风雨","风雨很强的天气。"],"stove":["炉子","用来加热和做饭的设备。"],"straight":["直的；直走","不转弯地向前走，也可表示形状直。"],"strawberry":["草莓","红色的小水果。"],"street":["街道","城市中供车辆和行人通行的道路。"],"sugar":["糖","常用来增加甜味的食品。"],"summer":["夏天","一年里天气通常比较热的季节。"],"sunny":["晴朗的","天气有阳光、云比较少。"],"sunshine":["阳光","太阳发出的光。"],"sweet":["甜的","含糖味道明显。"],"symptoms":["症状（复数）","symptom 的复数形式，表示疾病表现。"],"table":["桌子","有平面的家具，可以放东西。"],"take":["拿；带；服用","根据句子可表示拿走、带走或服用药物。"],"tastes":["尝起来；味道","taste 的第三人称单数形式，表示尝起来的味道。"],"tea":["茶","用茶叶冲泡的饮料。"],"tell":["告诉；告知","把信息告诉别人。"],"temperature":["温度","表示冷热程度的数值。"],"ten":["十","数字 10。"],"text":["短信；发短信","可以指文字消息，也可以表示发送文字消息。"],"thicker":["更厚的","thick 的比较级，表示厚度更大。"],"thin":["薄的","厚度比较小。"],"thirsty":["口渴的","感到想喝水。"],"thirty":["三十","数字 30。"],"throat":["喉咙","口腔后方连接呼吸道和食道的身体部位。"],"thunderstorm":["雷雨","伴有雷和雨的天气。"],"ticket":["票","乘坐交通工具或进入某处时使用的凭证。"],"time":["时间；次数","可以表示时间，也可根据语境表示次数。"],"times":["次数；倍数","time 的复数形式，可以表示次数或倍数。"],"tired":["累的","身体或精神需要休息的状态。"],"together":["一起","和别人共同做某事。"],"tomato":["西红柿","常见的红色食材。"],"too":["也；太","可以表示“也”，也可以表示程度超过需要。"],"total":["总数；总价","全部加起来的数量或价格。"],"traffic":["交通","道路上车辆和行人的通行情况。"],"train":["火车","在铁路上运行的公共交通工具。"],"transfer":["换乘；转移","从一种交通工具换到另一种，也可表示转移。"],"try":["尝试","努力做某事以看看能否成功。"],"turkey":["火鸡；火鸡肉","可以指火鸡这种鸟，也可以指它的肉。"],"turning":["转弯；正在转","turn 的现在分词，表示正在改变方向。"],"tv":["电视","用来接收和播放电视节目和视频的设备。"],"twelve":["十二","数字 12。"],"twenty":["二十","数字 20。"],"twice":["两次","表示发生两回。"],"umbrella":["雨伞","下雨时用来遮雨的物品。"],"upstairs":["楼上","建筑物较高的一层或向较高楼层移动。"],"use":["使用","把某个东西用于特定目的。"],"very":["非常","加强形容词或副词的程度。"],"video":["视频","记录或播放动态画面和声音的内容。"],"voicemail":["语音信箱","别人没接电话时留下语音的系统。"],"walk":["走路","用双脚行走。"],"warm":["温暖的","温度比较舒服、不冷。"],"warmer":["更暖和的","warm 的比较级，表示温度更高更暖。"],"watermelon":["西瓜","个头较大的多汁水果。"],"weak":["虚弱的","力量较小或身体没有力气。"],"weather":["天气","某个时间和地点的空气状况。"],"well":["好；健康地","表示状态好，也可表示身体健康。"],"which":["哪一个；哪个","在多个选择中询问其中哪一个。"],"wife":["妻子","结婚关系中的女性配偶。"],"will":["将会；会","表示将来发生的事情或意愿。"],"window":["窗户","墙上的开口，通常可以采光和通风。"],"windy":["有风的","风比较明显的天气。"],"winter":["冬天","一年里通常比较冷的季节。"],"would":["会；愿意；想要","常用于礼貌请求或表示假设，也可表示过去的将来。"],"write":["写","用文字记录信息。"],"wrong":["错误的；不对的","表示答案、做法或事情不正确。"],"year":["年","十二个月组成的时间单位。"],"yellow":["黄色的","一种明亮的颜色。"],"younger":["更年轻的；年龄更小的","young 的比较级，表示年龄较小。"],"nine":["九","数字 9。"],"fourteen":["十四","数字 14。"],"week":["周；星期","七天组成的一段时间。"],"minutes":["分钟（复数）","minute 的复数形式，表示多个一分钟。"]};
function cleanWord(w){return String(w||'').toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9'-]+$/gi,'');}
function displayEnglish(text){ return String(text||'').replace(/\bI\b/g,'i'); }
function wordBreakdown(en){
  return String(en||'').split(/\s+/).filter(Boolean).map((raw,i)=>{
    const word=raw.replace(/[.,!?;:()[\]{}"“”]/g,'').replace(/^I$/,'i');
    const info=({ ...WORDS, ...V10_WORD_DEFINITIONS, ...V11_WORD_DEFINITIONS })[cleanWord(word)];
    if(!info) return {id:`${i}-${cleanWord(word)}`,word,meaning:'',explanation:''};
    return {id:`${i}-${cleanWord(word)}`,word,meaning:info[0],explanation:info[1]};
  });
}

function topicPhrases(topicId) {
  const rows=[...(DATA[topicId]||[]),...(V9_EXTRA_DATA[topicId]||[]),...(V10_MORE_DATA[topicId]||[]),...(topicId==='new-china'?NEW_CHINA_DATA:[])];
  const seen=new Set();
  const unique=rows.filter(([zh,en])=>{const key=norm(en);if(seen.has(key))return false;seen.add(key);return true;});
  return unique.slice(0,20).map(([zh,en,note], i) => ({ id:`built-${topicId}-${i}`, zh,en,note,category:topicId,correct:0,wrong:0 }));
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/[.,!?，。！？'"“”‘’]/g,'').replace(/\s+/g,' ').trim();
}

function evaluateAnswer(question, answer) {
  return norm(question.answer) === norm(answer);
}

function allSavedWords(saved){
  const words=[];
  const seen=new Set();
  saved.forEach(item=>{
    wordBreakdown(item.en).forEach(w=>{
      const key=cleanWord(w.word);
      if(!key || seen.has(key)) return;
      seen.add(key);
      words.push({...w,sourceId:item.id,sourceEn:item.en,sourceZh:item.zh});
    });
  });
  return words;
}
function tokenizeSentence(en){return String(en||'').trim().replace(/[.!?]+$/,'').split(/\s+/).filter(Boolean).map((text,index)=>({id:`token-${index}-${text.toLowerCase()}`,text}));}
function practiceChoices(correct,pool=[],fallback=[]){return [correct,...pool,...fallback].filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,4);}
function createPracticeQueue(items,mode='all'){
  const usable=items.filter(x=>x&&x.zh&&x.en);
  const words=allSavedWords(usable);
  const questions=[];
  const meanings=['我','你','他','她','它','这个','那个','这里','那里','去','来','需要','喜欢','帮助','好的','不知道'];
  words.forEach((w,wi)=>{
    const distractors=meanings.filter(x=>x!==w.meaning).slice(0,3);
    questions.push({id:`w-meaning-${wi}-${Math.random()}`,sourceId:w.sourceId,prompt:`${displayEnglish(w.word)} 是什么意思？`,answer:w.meaning,note:w.explanation,options:practiceChoices(w.meaning,distractors,['我不知道','谢谢','请帮帮我']),type:'word',word:w.word});
    const otherWords=words.filter(x=>cleanWord(x.word)!==cleanWord(w.word)).map(x=>x.word).slice(0,3);
    questions.push({id:`w-english-${wi}-${Math.random()}`,sourceId:w.sourceId,prompt:`${w.meaning} 英文怎么说？`,answer:w.word,note:`记住这个词：${displayEnglish(w.word)}。`,options:practiceChoices(w.word,otherWords,['hello','thank','help']),type:'word-reverse',word:w.word});
    questions.push({id:`w-listen-${wi}-${Math.random()}`,sourceId:w.sourceId,prompt:'先点“听这个词”，再选它的意思。',answer:w.meaning,note:w.explanation,options:practiceChoices(w.meaning,distractors,['我不知道','谢谢','请帮帮我']),type:'word-listen',word:w.word});
  });
  usable.forEach((item,i)=>{
    const tokens=tokenizeSentence(item.en);
    const pool=usable.filter(x=>x.id!==item.id);
    const distractors=pool.map(x=>x.en).slice(0,3);
    questions.push({id:`s-order-${i}-${Math.random()}`,sourceId:item.id,prompt:item.zh,sourceZh:item.zh,answer:item.en,note:'把单词按正确顺序放好。',tokens,sourceEn:item.en,sourceZh:item.zh,type:'sentence-order'});
    questions.push({id:`s-meaning-${i}-${Math.random()}`,sourceId:item.id,prompt:'这句话是什么意思？',sourceZh:item.zh,answer:item.zh,note:'先看整句话，再选择中文意思。',options:practiceChoices(item.zh,pool.map(x=>x.zh),['谢谢。','我需要帮助。','多少钱？']),sourceEn:item.en,sourceZh:item.zh,type:'sentence-meaning'});
    questions.push({id:`s-listen-${i}-${Math.random()}`,sourceId:item.id,prompt:'先听完整句子，再选择中文意思。',sourceZh:item.zh,answer:item.zh,note:'听懂整句话的意思。',options:practiceChoices(item.zh,pool.map(x=>x.zh),['谢谢。','我需要帮助。','多少钱？']),sourceEn:item.en,sourceZh:item.zh,type:'sentence-listen'});
    if(tokens.length>=2){
      const blankIndex=Math.floor(tokens.length/2), missing=tokens[blankIndex].text;
      const pattern=tokens.map((t,ti)=>ti===blankIndex?'____':t.text).join(' ');
      const wordChoices=[missing,...tokens.filter((_,ti)=>ti!==blankIndex).map(t=>t.text),'you','is','the'].filter((x,j,a)=>a.indexOf(x)===j).slice(0,4);
      questions.push({id:`s-fill-${i}-${Math.random()}`,sourceId:item.id,prompt:'选择缺少的单词。',answer:missing,note:`完整句子：${item.en}`,options:practiceChoices(missing,wordChoices,['you','is','the']),sourceEn:item.en,sourceZh:item.zh,pattern,type:'sentence-fill'});
    }
    questions.push({id:`s-english-${i}-${Math.random()}`,sourceId:item.id,prompt:item.zh,sourceZh:item.zh,answer:item.en,note:'选择最合适的英文句子。',options:practiceChoices(item.en,distractors,['Thank you.','Please help me.','Where is it?']),type:'sentence-english'});
  });
  const filtered = mode === 'all' ? questions : questions.filter(q => q.type === mode);
  return filtered.sort(()=>Math.random()-0.5);
}

function applyPracticeResult(saved, sourceId, correct) {
  const item = saved.find(x => x.id === sourceId);
  if (!item) return;
  if (correct) item.correct = Number(item.correct || 0) + 1;
  else item.wrong = Number(item.wrong || 0) + 1;
}

function normalizeRecognizedText(text) { return String(text || '').trim(); }
function getRecognitionConstructor(scope = globalThis) {
  return scope?.SpeechRecognition || scope?.webkitSpeechRecognition || null;
}
function isRecognitionSupported(scope = globalThis) { return Boolean(getRecognitionConstructor(scope)); }
function startChineseRecognition({ onStart, onText, onError, onEnd } = {}, scope = globalThis) {
  const Ctor = getRecognitionConstructor(scope);
  if (!Ctor) throw new Error('这个浏览器不支持语音输入，请用打字。');
  const recognition = new Ctor();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => onStart?.();
  recognition.onresult = e => onText?.(normalizeRecognizedText(e.results?.[0]?.[0]?.transcript || ''));
  recognition.onerror = e => onError?.(e.error || '语音输入失败');
  recognition.onend = () => onEnd?.();
  recognition.start();
  return recognition;
}
let translatorPromise;

async function translateZhToEn(text, onProgress = () => {}) {
  const input = String(text || '').trim();
  if (!input) throw new Error('请先说一句中文，或者打字。');
  if (!translatorPromise) {
    onProgress('第一次使用正在下载免费翻译工具，可能需要一点时间…');
    translatorPromise = (async () => {
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm');
      env.allowLocalModels = false;
      return pipeline('translation', 'Xenova/opus-mt-zh-en', { dtype: 'q8' });
    })();
  } else {
    onProgress('正在翻译…');
  }
  const translator = await translatorPromise;
  const result = await translator(input, { max_new_tokens: 128 });
  const output = Array.isArray(result) ? result[0] : result;
  const translated = output?.translation_text || output?.generated_text || '';
  if (!translated) throw new Error('这次没有翻译成功，请再试一次。');
  onProgress('');
  return translated.trim();
}


let state = loadState();
let route = 'home';
let currentTranslation = null;
let practiceFeedback = null;
const view = document.querySelector('#view');

function persist(){ saveState(state); applySettings(); }
function applySettings(){ document.documentElement.dataset.size = state.settings.textSize; }
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function nav(next){ route=next; practiceFeedback=null; render(); view.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'}); }

function home(){
  const recommended=TOPICS.slice(0,6);
  return `<section class="hero"><span class="pill">每天学一点就够了</span><h1>今天想学什么？</h1><p class="muted">只学生活里马上能用的英语。不会也没关系，点一下就能听。</p></section><button class="big-action" data-nav="translate">🎤 说中文，帮我翻成英文</button><h2 class="section-title">推荐学这些</h2><div class="grid">${recommended.map(t=>`<button class="topic" data-topic="${t.id}"><span class="icon">${t.icon}</span><strong>${t.label}</strong></button>`).join('')}</div><button class="more-categories" data-nav="categories">更多学习内容</button>`}

function categoriesView(){return `<section class="hero"><h1>生活分类</h1><p class="muted">选择你今天想学的生活内容。</p></section><div class="grid">${TOPICS.map(t=>`<button class="topic" data-topic="${t.id}"><span class="icon">${t.icon}</span><strong>${t.label}</strong></button>`).join('')}</div>`}

function translateView(){return `<section class="hero"><h1>说中文，我帮你翻</h1><p class="muted">按麦克风说完一句，或者直接打字。</p></section><div class="card"><textarea id="zhInput" class="input-box" placeholder="例如：这个多少钱？">${escapeHtml(currentTranslation?.zh||'')}</textarea><div class="button-row"><button class="mic" id="micBtn">🎤 说中文</button><button class="translate-btn" id="translateBtn">翻译</button></div><div id="status" class="status" aria-live="polite"></div></div><div id="resultArea">${currentTranslation?resultCard(currentTranslation):''}</div>`}
function resultCard(x){const words=wordBreakdown(x.en);return `<div class="card translation-result"><div class="zh">${escapeHtml(x.zh)}</div><div class="en">${escapeHtml(displayEnglish(x.en))}</div><div class="button-row"><button type="button" class="standard-audio-button listen" data-speak="${escapeHtml(x.en)}">念给我听<small class="tap-hint">点击听</small></button><button class="save" id="saveCurrent">保存</button></div><div class="word-learning"><h3>单词</h3><div class="word-grid">${words.map(w=>`<button type="button" class="standard-audio-button word-card" data-word-speak="${escapeHtml(w.word)}" data-word-meaning="${escapeHtml(w.meaning)}" data-word-explanation="${escapeHtml(w.explanation)}"><strong>${escapeHtml(displayEnglish(w.word))}</strong><span>${escapeHtml(w.meaning)}</span><small class="tap-hint">点击听</small></button>`).join('')}</div><div class="word-detail">点一个单词可以单独听。</div></div></div>`}

function savedView(){
  const words=allSavedWords(state.saved);
  const translations=state.saved.filter(x=>x.source==='translation'||x.category==='custom');
  const learned=state.saved.filter(x=>!(x.source==='translation'||x.category==='custom'));
  const sentenceCards=(items,empty)=>items.length?items.map(x=>`<article class="card saved-card"><div class="sentence-display"><div class="en">${escapeHtml(displayEnglish(x.en))}</div><div class="zh">${escapeHtml(x.zh)}</div></div><div class="note">${escapeHtml(x.note||'生活里可以直接用。')}</div><div class="button-row"><button type="button" class="standard-audio-button listen" data-speak="${escapeHtml(x.en)}">听<small class="tap-hint">点击听</small></button><button class="secondary practice-one" data-id="${x.id}">练习</button></div><button class="danger delete-item" data-id="${x.id}" style="width:100%;margin-top:12px">删除这句</button></article>`).join(''):empty;
  return `<section class="hero"><h1>我的英语</h1><p class="muted">这里保存了你想学的内容。</p></section>
  <div class="saved-tabs"><button type="button" class="saved-tab active" data-saved-tab="sentences">我的句子</button><button type="button" class="saved-tab" data-saved-tab="translations">我的保存</button><button type="button" class="saved-tab" data-saved-tab="words">单词（${words.length}）</button></div>
  <section id="savedSentences">${sentenceCards(learned,'<div class="empty">⭐ 还没有保存的学习句子。</div>')}</section>
  <section id="savedTranslations" class="hidden">${sentenceCards(translations,'<div class="empty">⭐ 还没有保存翻译。去“翻译”保存几句吧。</div>')}</section>
  <section id="savedWords" class="hidden">${words.length?`<p class="muted">这里会把你保存的所有句子拆成单独的词。每个词都可以单独听、单独练习。</p><div class="word-grid saved-word-grid">${words.map(w=>`<button type="button" class="standard-audio-button word-card" data-word-speak="${escapeHtml(w.word)}" data-word-meaning="${escapeHtml(w.meaning)}" data-word-explanation="${escapeHtml(w.explanation)}"><strong>${escapeHtml(displayEnglish(w.word))}</strong><span>${escapeHtml(w.meaning)}</span><small class="tap-hint">点击听</small></button>`).join('')}</div><button type="button" class="big-action" id="practiceAllWords">练习全部单词</button>`:`<div class="empty">保存句子后，这里会自动出现里面的单词。</div>`}</section>`;
}

function wordCards(en){
  return tokenizeSentence(en).map(w=>`<span class="mini-word">${escapeHtml(displayEnglish(w.text))}</span>`).join(' ');
}

function shuffleCopy(items){return [...items].sort(()=>Math.random()-0.5);}

function practiceTypeLabel(type){
  return ({word:'单词意思', 'word-reverse':'中文 → 英文', 'word-listen':'听单词', 'sentence-order':'排列句子', 'sentence-meaning':'英文 → 中文', 'sentence-listen':'听句子', 'sentence-fill':'句子填空', 'sentence-english':'中文 → 英文'})[type] || '练习';
}
function categoryLabel(category){
  if(!category || category==='all') return '全部生活英语';
  return TOPICS.find(t=>t.id===category)?.label || (category==='custom'?'我的句子':category);
}
function newPracticeId(){return globalThis.crypto?.randomUUID?.() || `practice-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
function practiceItemsForCategory(category){
  if(category==='custom') return (state.saved || []).filter(x=>x.source==='translation'||x.category==='custom').map(x=>({...x,category:'custom'}));
  if(category==='all'){
    const builtIn=TOPICS.flatMap(topic=>topicPhrases(topic.id));
    const saved=(state.saved || []).map(x=>({...x,category:x.category||'custom'}));
    const seen=new Set();
    return [...builtIn,...saved].filter(item=>{const key=`${item.category||'custom'}::${norm(item.en)}`;if(seen.has(key))return false;seen.add(key);return true;});
  }
  return topicPhrases(category);
}
function deletePracticeSession(sessionId){
  if(!Array.isArray(state.practiceSessions)) return;
  state.practiceSessions=state.practiceSessions.filter(s=>s.id!==sessionId);
  if(state.currentPracticeId===sessionId){state.currentPracticeId=null;state.practice=null;}
  persist();
  render();
}

function createPracticeSession(items, category='all', mode='all'){
  const queue=createPracticeQueue(items,mode);
  return {id:newPracticeId(),active:true,queue,index:0,answers:[],startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),category,categoryLabel:categoryLabel(category),type:mode,typeLabel:practiceTypeLabel(mode),clue:queue[0]?.prompt || '生活英语练习'};
}
function savePracticeSession(session){
  if(!Array.isArray(state.practiceSessions)) state.practiceSessions=[];
  const i=state.practiceSessions.findIndex(x=>x.id===session.id);
  if(i>=0) state.practiceSessions[i]=session; else state.practiceSessions.unshift(session);
  state.currentPracticeId=session.id;
  state.practice=session;
}
function currentPractice(){
  if(!Array.isArray(state.practiceSessions)) state.practiceSessions=[];
  const found=state.practiceSessions.find(x=>x.id===state.currentPracticeId);
  if(found){state.practice=found;return found;}
  if(state.practice){savePracticeSession(state.practice);return state.practice;}
  return null;
}
function resumePracticeSession(sessionId){
  if(!Array.isArray(state.practiceSessions)) state.practiceSessions=[];
  const session=state.practiceSessions.find(x=>x.id===sessionId);
  if(!session) return false;
  if(session.index>=session.queue.length){session.index=0;session.answers=[];}
  session.active=true;
  session.updatedAt=new Date().toISOString();
  state.currentPracticeId=session.id;
  state.practice=session;
  practiceFeedback=null;
  persist();
  render();
  return true;
}
function practiceListView(){
  const sessions=(state.practiceSessions || []).filter(s=>s.type!=='all');
  const cards=sessions.map(s=>{
    const done=s.index>=s.queue.length;
    const clue=s.clue || s.queue?.[s.index]?.prompt || '生活英语练习';
    return `<article class="card practice-session-card"><div class="practice-session-top"><span class="pill">${escapeHtml(s.categoryLabel||categoryLabel(s.category))}</span><span class="practice-session-type">${escapeHtml(s.typeLabel||practiceTypeLabel(s.type))}</span></div><h3>${escapeHtml(s.categoryLabel||categoryLabel(s.category))} · ${escapeHtml(s.typeLabel||practiceTypeLabel(s.type))}</h3><p class="muted practice-session-clue">${escapeHtml(String(clue))}</p><p class="practice-session-progress">${done?'已完成':`进行到：第 ${Math.min((s.index||0)+1,s.queue.length)} / ${s.queue.length} 题`}</p><div class="button-row"><button type="button" class="big-action practice-continue" data-practice-id="${escapeHtml(s.id)}">${done?'重新练习':'继续练习 →'}</button><button type="button" class="danger practice-delete" data-practice-id="${escapeHtml(s.id)}">删除</button></div></article>`;
  }).join('');
  return `<section class="hero"><h1>我的练习</h1><p class="muted">每个练习都会单独保存。可以保存很多个，不会互相覆盖。</p></section>${cards || '<div class="empty">还没有保存的练习。先开始一个练习吧。</div>'}<section class="card new-practice-card"><h2>开始新练习</h2><div class="setting-row"><strong>选择分类</strong><select id="practiceCategory"><option value="all">全部生活英语</option>${TOPICS.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)}</option>`).join('')}</select></div><div class="setting-row"><strong>练习类型</strong><select id="practiceType"><option value="word">单词意思</option><option value="word-reverse">中文 → 英文</option><option value="word-listen">听单词</option><option value="sentence-order">排列句子</option><option value="sentence-meaning">英文 → 中文</option><option value="sentence-listen">听句子</option><option value="sentence-fill">句子填空</option><option value="sentence-english">中文 → 英文</option></select></div><button type="button" class="big-action" id="startSelectedPractice">开始这个练习</button></section>`;
}

function practiceView(){
  if(!state.saved.length)return `<section class="hero"><h1>练习</h1><p class="muted">先保存几句自己想学的英语，再来练习。</p></section><button class="big-action" data-nav="home">去学几句</button>`;
  const current=currentPractice();
  if(!current || !current.active) return practiceListView();
  const q=current.queue[current.index];
  if(!q){current.active=false;current.updatedAt=new Date().toISOString();savePracticeSession(current);persist();return `<section class="hero"><h1>全部练完啦！</h1><p class="muted">这个练习已经完成，可以继续其他练习。</p></section><button class="big-action" data-nav="practice">返回我的练习</button>`;}
  let question='';
  if(q.type==='word'){
    question=`<div class="practice-type">单词意思</div><div class="practice-word">${escapeHtml(displayEnglish(q.word))}</div><p class="practice-instruction">这个词是什么意思？</p>${choiceOptions(q)}`;
  }else if(q.type==='word-reverse'){
    question=`<div class="practice-type">中文 → 英文</div><div class="practice-word-meaning">${escapeHtml(q.prompt.replace(/^“|”/g,''))}</div><p class="practice-instruction">英文怎么说？</p>${choiceOptions(q)}`;
  }else if(q.type==='word-listen'){
    question=`<div class="practice-type">听单词</div><p class="practice-instruction">先听这个词，再选择意思。</p><button type="button" class="standard-audio-button listen practice-listen" data-speak="${escapeHtml(q.word)}">🔊 听这个词<small class="tap-hint">点击听</small></button>${choiceOptions(q)}`;
  }else if(q.type==='sentence-order'){
    const tiles=shuffleCopy(q.tokens);
    question=`<div class="practice-type">排列句子</div><div class="practice-prompt">题目：${escapeHtml(q.prompt)}</div><p class="practice-instruction">把下面的单词拖到上面，排成正确的句子。</p><div class="order-answer" id="orderAnswer" aria-label="已选择的单词"></div><div class="order-bank" id="orderBank" aria-label="可选择的单词">${tiles.map((t,i)=>orderTile(t,i)).join('')}</div><button type="button" class="big-action order-check" id="checkOrder">检查答案</button>`;
  }else if(q.type==='sentence-listen'){
    question=`<div class="practice-type">听句子</div><button type="button" class="standard-audio-button listen practice-listen" data-speak="${escapeHtml(q.sourceEn)}">🔊 听完整句子<small class="tap-hint">点击听</small></button><p class="practice-instruction">听完后，选出中文意思。</p>${choiceOptions(q)}`;
  }else if(q.type==='sentence-fill'){
    question=`<div class="practice-type">填空</div><div class="practice-prompt">${escapeHtml(q.pattern)}</div><p class="practice-instruction">选择缺少的单词。</p>${choiceOptions(q)}`;
  }else if(q.type==='sentence-english'){
    question=`<div class="practice-type">中文 → 英文</div><div class="practice-word-meaning">${escapeHtml(q.prompt)}</div><p class="practice-instruction">选择正确的英文句子。</p>${choiceOptions(q)}`;
  }else if(q.type==='sentence-meaning'){
    question=`<div class="practice-type">英文 → 中文</div><div class="practice-prompt">${escapeHtml(displayEnglish(q.sourceEn||q.answer))}</div><p class="practice-instruction">这句话是什么意思？</p>${choiceOptions(q)}`;
  }
  return `<button class="secondary" id="exitPractice">← 退出并保存</button><article class="card practice-card"><span class="pill">第 ${current.index+1} / ${current.queue.length} 题</span>${question}${practiceFeedback?feedbackHtml(q,practiceFeedback):''}</article>`;
}

function choiceOptions(q){
  return `<div class="options">${q.options.map(o=>`<button type="button" class="option practice-option" data-answer="${escapeHtml(o)}">${escapeHtml(typeof o==='string'&&/[A-Za-z]/.test(o)?displayEnglish(o):o)}</button>`).join('')}</div>`;
}
function orderTile(token,index){
  return `<button type="button" draggable="true" class="order-tile" data-order-token="${escapeHtml(token.text)}" data-token-id="${escapeHtml(token.id)}" aria-label="${escapeHtml(displayEnglish(token.text))}">${escapeHtml(displayEnglish(token.text))}</button>`;
}

function sentenceWordCards(en){return wordBreakdown(en).map(w=>`<button type="button" class="standard-audio-button word-card" data-word-speak="${escapeHtml(w.word)}" data-word-meaning="${escapeHtml(w.meaning)}" data-word-explanation="${escapeHtml(w.explanation)}"><strong>${escapeHtml(displayEnglish(w.word))}</strong><span>${escapeHtml(w.meaning)}</span><small class="tap-hint">点击听</small></button>`).join(' ')}
function sentenceBreakdownHtml(en){
  const words=wordBreakdown(en);
  return `<div class="word-learning practice-breakdown"><h3>单词解释</h3><div class="word-grid">${words.map(w=>`<div class="word-explanation"><strong>${escapeHtml(displayEnglish(w.word))}</strong><span>${escapeHtml(w.meaning)}</span><small>${escapeHtml(w.explanation)}</small></div>`).join('')}</div></div>`;
}
function feedbackHtml(q,f){
  const isWord=q.type?.startsWith('word');
  const english=isWord?displayEnglish(q.word||q.answer):displayEnglish(q.sourceEn||q.answer);
  const chinese=isWord?(q.type==='word-reverse' ? String(q.prompt||'').replace(/ 英文怎么说？$/,'') : q.answer):(q.sourceZh||q.prompt||q.answer);
  const words=wordBreakdown(english);
  return `<div class="feedback ${f.correct?'correct':'wrong'}"><strong>${f.correct?'✓ 对了！':'✕ 还差一点'}</strong><div class="feedback-answer">${escapeHtml(english)}</div><div class="feedback-translation">${escapeHtml(chinese)}</div>${!f.correct?`<div class="feedback-hint">正确答案：${escapeHtml(isWord?q.answer:english)}</div>`:''}<div class="word-learning practice-breakdown"><h3>${isWord?'单词解释':'句子里的单词'}</h3><div class="word-grid">${words.map(w=>`<div class="word-explanation"><strong>${escapeHtml(displayEnglish(w.word))}</strong><span>${escapeHtml(w.meaning)}</span><small>${escapeHtml(w.explanation)}</small></div>`).join('')}</div></div><div class="button-row"><button type="button" class="standard-audio-button listen" data-speak="${escapeHtml(english)}">听答案<small class="tap-hint">点击听</small></button><button class="secondary" id="retryQuestion">再练一次</button></div><button class="big-action" id="nextQuestion" style="margin-top:12px">下一题 →</button></div>`;
}

function settingsView(){return `<section class="hero"><h1>设置</h1><p class="muted">只放最需要的设置。</p></section><div class="card"><div class="setting-row"><strong>字体大小</strong><select id="textSize"><option value="large" ${state.settings.textSize==='large'?'selected':''}>大</option><option value="xlarge" ${state.settings.textSize==='xlarge'?'selected':''}>特大</option></select></div><div class="setting-row"><strong>英文朗读速度</strong><select id="voiceRate"><option value="0.68" ${state.settings.voiceRate===0.68?'selected':''}>很慢</option><option value="0.82" ${state.settings.voiceRate===0.82?'selected':''}>慢</option><option value="1" ${state.settings.voiceRate===1?'selected':''}>正常</option></select></div></div><button class="big-action secondary" id="backupBtn">⬇️ Backup 备份</button><div style="height:12px"></div><label class="big-action secondary" style="display:flex;align-items:center;justify-content:center;cursor:pointer">⬆️ Restore 恢复<input id="restoreInput" type="file" accept="application/json" class="hidden"></label><div style="height:28px"></div><button class="big-action danger" id="clearBtn">清除全部学习数据</button><p class="muted">Backup 会保存：我的英语、练习进度、答对/答错记录和设置。</p>`}

function topicView(topicId){const topic=TOPICS.find(t=>t.id===topicId);const phrases=topicPhrases(topicId);if(!topic)return `<section class="hero"><h1>找不到这个分类</h1></section>`;return `<section class="hero"><button type="button" class="secondary" data-nav="categories">← 返回分类</button><div class="topic-heading"><span class="icon">${topic.icon}</span><h1>${escapeHtml(topic.label)}</h1></div></section><div class="topic-list">${phrases.map(item=>`<article class="card topic-phrase"><div class="en sentence-full">${escapeHtml(displayEnglish(item.en))}</div><div class="zh">${escapeHtml(item.zh)}</div><h3 class="word-section-title">点每个词听一听</h3><div class="sentence-word-row">${sentenceWordCards(item.en)}</div><div class="note">${escapeHtml(item.note||'生活里可以直接用。')}</div><div class="button-row"><button type="button" class="standard-audio-button listen" data-speak="${escapeHtml(item.en)}">听整句<small class="tap-hint">点击听</small></button><button type="button" class="secondary built-save" data-topic="${escapeHtml(topicId)}" data-zh="${escapeHtml(item.zh)}" data-en="${escapeHtml(item.en)}" data-note="${escapeHtml(item.note||'生活里可以直接用。')}">保存</button></div></article>`).join('')}</div>`}

function render(){applySettings(); if(route.startsWith('topic:')) view.innerHTML=topicView(route.split(':')[1]); else if(route==='home') view.innerHTML=home(); else if(route==='translate') view.innerHTML=translateView(); else if(route==='categories') view.innerHTML=categoriesView(); else if(route==='saved') view.innerHTML=savedView(); else if(route==='practice') view.innerHTML=practiceView(); else if(route==='settings') view.innerHTML=settingsView(); else { route='home'; view.innerHTML=home(); } bind();}

function bind(){
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
  document.querySelectorAll('.topic').forEach(b=>b.onclick=()=>{route=`topic:${b.dataset.topic}`;render();});
  document.querySelectorAll('[data-saved-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-saved-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const tab=b.dataset.savedTab;document.querySelector('#savedSentences')?.classList.toggle('hidden',tab!=='sentences');document.querySelector('#savedTranslations')?.classList.toggle('hidden',tab!=='translations');document.querySelector('#savedWords')?.classList.toggle('hidden',tab!=='words');});
  document.querySelector('#practiceAllWords')?.addEventListener('click',()=>{const session=createPracticeSession(state.saved,'all','word');savePracticeSession(session);practiceFeedback=null;persist();nav('practice');});
  document.querySelectorAll('[data-speak]').forEach(b=>{
    b.onclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      const text=b.dataset.speak;
      const played=speakEnglish(text,state.settings.voiceRate);
      if(!played) alert('英语发音暂时没有准备好。请稍等一下再点一次。');
    };
  });
  document.querySelectorAll('[data-word-speak]').forEach(b=>{
    b.onclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      const played=speakEnglish(b.dataset.wordSpeak,state.settings.voiceRate);
      if(!played) alert('英语发音暂时没有准备好。请稍等一下再点一次。');
      const d=b.closest('.word-learning')?.querySelector('.word-detail');
      if(d)d.innerHTML=`<strong>${escapeHtml(b.dataset.wordSpeak)}</strong> = ${escapeHtml(b.dataset.wordMeaning)}<br>${escapeHtml(b.dataset.wordExplanation)}`;
    };
  });
  document.querySelectorAll('.built-save').forEach(b=>b.onclick=()=>{mergePhrase(state,{zh:b.dataset.zh,en:b.dataset.en,note:b.dataset.note,category:b.dataset.topic});persist();b.textContent='✅ 已保存';});
  document.querySelectorAll('.delete-item').forEach(b=>b.onclick=()=>{if(confirm('确定删除这句吗？')){state.saved=state.saved.filter(x=>x.id!==b.dataset.id);persist();render();}});
  document.querySelectorAll('.practice-one').forEach(b=>b.onclick=()=>{const item=state.saved.find(x=>x.id===b.dataset.id);if(!item)return;const session=createPracticeSession([item],item.category||'custom','all');savePracticeSession(session);practiceFeedback=null;persist();nav('practice');});
  document.querySelector('#translateBtn')?.addEventListener('click',doTranslate);
  document.querySelector('#micBtn')?.addEventListener('click',doMic);
  document.querySelector('#saveCurrent')?.addEventListener('click',()=>{if(currentTranslation){mergePhrase(state,{...currentTranslation,category:'custom',source:'translation',note:'这是你自己翻译并保存的句子。'});persist();document.querySelector('#saveCurrent').textContent='✅ 已保存';}});
  document.querySelectorAll('.practice-delete').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();if(confirm('确定删除这个练习吗？'))deletePracticeSession(b.dataset.practiceId);});
  document.querySelector('#startSelectedPractice')?.addEventListener('click',()=>{const category=document.querySelector('#practiceCategory')?.value||'all';const mode=document.querySelector('#practiceType')?.value||'word';const items=practiceItemsForCategory(category);const session=createPracticeSession(items,category,mode);if(!session.queue.length){alert('这个分类暂时没有适合这种练习的题目。请换一种练习方式。');return;}savePracticeSession(session);practiceFeedback=null;persist();render();});
  document.querySelector('#exitPractice')?.addEventListener('click',()=>{const current=currentPractice();if(current){current.active=false;current.updatedAt=new Date().toISOString();savePracticeSession(current);}practiceFeedback=null;persist();render();});
  document.querySelectorAll('.practice-option').forEach(b=>b.onclick=()=>answerQuestion(b.dataset.answer));
  bindOrderPractice();
  document.querySelector('#retryQuestion')?.addEventListener('click',()=>{practiceFeedback=null;render();});
  document.querySelector('#nextQuestion')?.addEventListener('click',()=>{const current=currentPractice();if(!current)return;current.index++;current.updatedAt=new Date().toISOString();savePracticeSession(current);practiceFeedback=null;persist();render();});
  document.querySelector('#textSize')?.addEventListener('change',e=>{state.settings.textSize=e.target.value;persist();render();});
  document.querySelector('#voiceRate')?.addEventListener('change',e=>{state.settings.voiceRate=Number(e.target.value);persist();});
  document.querySelector('#backupBtn')?.addEventListener('click',()=>downloadBackup(state));
  document.querySelector('#restoreInput')?.addEventListener('change',async e=>{try{const restored=await readBackupFile(e.target.files[0]);state=restored;persist();alert('恢复成功。');render();}catch(err){alert(err.message||'恢复失败。');}});
  document.querySelector('#clearBtn')?.addEventListener('click',()=>{if(confirm('确定要清除全部学习内容吗？这个操作不能撤销。')){state=defaultState();persist();render();}});
}

// Practice-session cards are rendered dynamically. Delegate their click from the
// stable #view container so the button keeps working after every render.
view.addEventListener('click', (event)=>{
  const button=event.target?.closest?.('.practice-continue');
  if(!button || !view.contains(button)) return;
  event.preventDefault();
  event.stopPropagation();
  resumePracticeSession(button.dataset.practiceId);
});

function bindOrderPractice(){
  const bank=document.querySelector('#orderBank');
  const answer=document.querySelector('#orderAnswer');
  if(!bank||!answer)return;
  let dragged=null;
  const moveTile=(tile,targetZone)=>{
    if(!tile)return;
    if(targetZone==='answer') answer.appendChild(tile); else bank.appendChild(tile);
  };
  const attach=(tile)=>{
    tile.addEventListener('dragstart',()=>{dragged=tile;tile.classList.add('dragging');});
    tile.addEventListener('dragend',()=>{dragged=null;tile.classList.remove('dragging');});
    tile.addEventListener('dragover',e=>e.preventDefault());
    tile.addEventListener('drop',e=>{
      e.preventDefault();
      if(!dragged||dragged===tile)return;
      tile.parentElement.insertBefore(dragged,tile);
    });
    let startX=0,startY=0,moved=false;
    tile.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY;moved=false;dragged=tile;tile.classList.add('dragging');tile.setPointerCapture?.(e.pointerId);});
    tile.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-startX,e.clientY-startY)>8)moved=true;});
    tile.addEventListener('pointerup',e=>{
      tile.releasePointerCapture?.(e.pointerId);
      tile.classList.remove('dragging');
      const under=document.elementFromPoint(e.clientX,e.clientY);
      const target=under?.closest?.('.order-tile');
      const zone=under?.closest?.('#orderAnswer,#orderBank');
      if(moved){
        if(target&&target!==tile)target.parentElement.insertBefore(tile,target);
        else if(zone)zone.appendChild(tile);
      }else{
        moveTile(tile,tile.parentElement===bank?'answer':'bank');
      }
      dragged=null;
    });
  };
  bank.querySelectorAll('.order-tile').forEach(attach);
  answer.querySelectorAll('.order-tile').forEach(attach);
  bank.addEventListener('dragover',e=>e.preventDefault());
  answer.addEventListener('dragover',e=>e.preventDefault());
  [bank,answer].forEach(zone=>zone.addEventListener('drop',e=>{e.preventDefault();if(dragged)zone.appendChild(dragged);}));
  document.querySelector('#checkOrder')?.addEventListener('click',()=>{
    if(practiceFeedback)return;
    const selected=[...answer.querySelectorAll('.order-tile')].map(x=>x.dataset.orderToken).join(' ');
    if(!selected.trim()){return;}
    answerQuestion(selected);
  });
}

async function doTranslate(){const input=document.querySelector('#zhInput');const status=document.querySelector('#status');const text=input?.value?.trim();if(!text){status.textContent='请先说一句中文，或者打字。';return;}try{status.textContent='正在准备…';const en=await translateZhToEn(text,msg=>{status.textContent=msg});currentTranslation={zh:text,en};status.textContent='翻译好了。';document.querySelector('#resultArea').innerHTML=resultCard(currentTranslation);bind();}catch(e){status.textContent=e.message||'翻译失败，请再试一次。';}}
function doMic(){const status=document.querySelector('#status');if(!isRecognitionSupported()){status.textContent='这个浏览器不能用语音输入，请直接打字。';return;}try{startChineseRecognition({onStart:()=>{status.textContent='正在听…说完一句就可以。';document.querySelector('#micBtn').textContent='🎙️ 正在听';},onText:text=>{document.querySelector('#zhInput').value=text;status.textContent='听到了，正在翻译…';doTranslate();},onError:()=>{status.textContent='没有听清楚。可以再说一次，或者打字。';},onEnd:()=>{const b=document.querySelector('#micBtn');if(b)b.textContent='🎤 说中文';}});}catch(e){status.textContent=e.message;}}
function answerTone(correct){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    const ctx=new AC();
    const now=ctx.currentTime;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if(correct){
      osc.frequency.setValueAtTime(660,now);
      osc.frequency.setValueAtTime(880,now+0.09);
    }else{
      osc.frequency.setValueAtTime(260,now);
      osc.frequency.setValueAtTime(190,now+0.12);
    }
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(0.24,now+0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+0.22);
    osc.start(now); osc.stop(now+0.24);
    setTimeout(()=>ctx.close?.(),350);
  }catch(err){}
}
function answerQuestion(answer){
  if(practiceFeedback)return;
  const current=currentPractice();
  if(!current)return;
  const q=current.queue[current.index];
  const correct=evaluateAnswer(q,answer);
  practiceFeedback={correct,answer};

  // Record and render the answer first. Speech is an enhancement and must
  // never be allowed to block the practice feedback UI.
  current.answers.push({sourceId:q.sourceId,correct,at:new Date().toISOString()});
  current.updatedAt=new Date().toISOString();
  savePracticeSession(current);
  applyPracticeResult(state.saved,q.sourceId,correct);
  persist();
  render();

  // Keep speech inside the original tap, but isolate failures from the UI.
  try { speakEnglish(q.answer, state.settings.voiceRate); } catch (err) {}
  answerTone(correct);
}

render();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
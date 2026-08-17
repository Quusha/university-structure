/* ================= STATE ================= */
const KEY='shakarim_org_builder_v2';
let state={units:[],employees:[],accruals:[],settings:{}};
let collapsed=new Set();     // tree
let ocCollapsed=new Set();   // org chart

const TYPES=['Руководство','Проректорат / блок','Департамент','Управление','Отдел','Центр',
             'Служба','Офис','Лаборатория','Школа / колледж','Совет / комитет','Иное'];
const REASONS=['Ученое звание','Научная степень','Другое'];
const REASON_SHORT={'Ученое звание':'Уч. звание','Научная степень':'Науч. степень','Другое':'Другое'};

function uid(){return 'id'+Math.random().toString(36).slice(2,9)}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function save(){saveLocal();cloudSchedulePush();}
function load(){try{const s=localStorage.getItem(KEY);if(s){state=JSON.parse(s);return true}}catch(e){}return false}

function defaultAccruals(){return[
  {id:uid(),name:'ОСМС (работодатель)',mode:'monthly_percent',value:3,enabled:true},
  {id:uid(),name:'Социальные отчисления (СО)',mode:'monthly_percent',value:3.5,enabled:true},
  {id:uid(),name:'ОПВР (пенсионные, работодатель)',mode:'monthly_percent',value:3.5,enabled:true},
  {id:uid(),name:'Отпускные',mode:'annual_salaries',value:1,enabled:true},
  {id:uid(),name:'Оздоровительное пособие',mode:'annual_salaries',value:1,enabled:true},
  {id:uid(),name:'Материальная помощь',mode:'annual_fixed',value:0,enabled:true},
]}
function ensureShape(){
  state.units=state.units||[]; state.employees=state.employees||[];
  state.employees.forEach(e=>{e.supplements=e.supplements||[]});
  state.settings=state.settings||{};
  if(!state.settings.period)state.settings.period='month';
  if(!state.settings.startDate)state.settings.startDate=new Date().getFullYear()+'-01-01';
  if(!state.accruals||!state.accruals.length)state.accruals=defaultAccruals();
  state.dict=state.dict||{};
  state.dict.incomeArticles=state.dict.incomeArticles||['Наука','Услуги','Контингент','Прочее'];
  state.dict.expenseArticles=state.dict.expenseArticles||['Текущий ремонт','Приобретение основных средств','Нематериальные активы','Товары','Услуги/работы','Ремонт','Прочее'];
  state.dict.assetCategories=state.dict.assetCategories||['Здание','Оборудование','Мебель','Транспорт','Оргтехника','Расходные материалы','Прочее'];
  state.hourlyRates=state.hourlyRates||[];
  state.loads=state.loads||[];
  state.incomes=state.incomes||[];
  state.expenses=state.expenses||[];
  state.contingent=state.contingent||[];
  state.assets=state.assets||[];
  state.assetMoves=state.assetMoves||[];
  state.requests=state.requests||[];
  state.plan=state.plan||[];
  state.audit=state.audit||[];
  state.roleCurrent=state.roleCurrent||'Администратор';
  state.programs=state.programs||[];
  state.buildings=state.buildings||[];
  state.rooms=state.rooms||[];
  state.dict.programLevels=state.dict.programLevels||['Бакалавриат','Магистратура','Докторантура','Колледж'];
  state.dict.roomTypes=state.dict.roomTypes||['Лекционная','Практическая/семинарская','Компьютерная','Лаборатория','Спортивная','Актовый зал','Прочее'];
  if(!state.settings.year)state.settings.year=new Date().getFullYear();
}

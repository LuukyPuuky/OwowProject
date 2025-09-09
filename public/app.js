const root = document.getElementById('matrix');
const btnPrev = document.getElementById('prev');
const btnNext = document.getElementById('next');
const btnToday = document.getElementById('today');
const caption = document.getElementById('caption');

const COLS = 32, ROWS = 8;
const dots = [];
for (let i=0;i<ROWS*COLS;i++){ const d=document.createElement('div'); d.className='dot'; root.appendChild(d); dots.push(d); }
const setPixel = (x,y,on)=>{ if(x<0||x>=COLS||y<0||y>=ROWS) return; dots[y*COLS+x].classList.toggle('on', !!on); };
const clear = ()=> dots.forEach(d=>d.classList.remove('on'));
const twinkle = ()=>{ root.classList.add('twinkle'); setTimeout(()=>root.classList.remove('twinkle'), 140); }

// 5x7 digits for left side day number
const DIGITS5x7 = {
  '0':['.###.','##.##','##.##','##.##','##.##','##.##','.###.'],
  '1':['..#..','.##..','..#..','..#..','..#..','..#..','.###.'],
  '2':['.###.','##.##','...##','..##.','.##..','##...','#####'],
  '3':['.###.','##.##','...##','..##.','...##','##.##','.###.'],
  '4':['..##.','.#.##','##.##','#####','...##','...##','...##'],
  '5':['#####','##...','####.','...##','...##','##.##','.###.'],
  '6':['.###.','##...','####.','##.##','##.##','##.##','.###.'],
  '7':['#####','...##','..##.','..##.','.##..','.##..','.##..'],
  '8':['.###.','##.##','##.##','.###.','##.##','##.##','.###.'],
  '9':['.###.','##.##','##.##','.####','...##','..##.','.##..']
};
function drawDigit5x7(x,y,n){
  const rows = DIGITS5x7[String(n)]; if(!rows) return;
  for(let r=0;r<7;r++){ for(let c=0;c<5;c++){ setPixel(x+c, y+r, rows[r][c]==='#'); } }
}
function drawTwoDigits(x,y,v){
  const s = String(v).padStart(2,'0');
  drawDigit5x7(x,y,s[0]);
  drawDigit5x7(x+6,y,s[1]); // +1 col gap
}

// Mini month grid on the right: 7 columns (Sun-Sat) × 6 rows
// Each cell is a single pixel. Header row uses a faint guide (we'll just leave gaps).
function drawMiniMonth(dateObj, focusDay){
  // compute first day-of-week (0=Sun) && days in month
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const startX = 18, startY = 1; // top-left of mini grid
  let d = 1;
  for (let row=0; row<6; row++){
    for (let col=0; col<7; col++){
      const idx = row*7 + col;
      const isDayCell = idx >= firstDow && d <= daysInMonth;
      if (isDayCell){
        // place dot
        setPixel(startX+col, startY+row, true);
        if (d === focusDay){
          // blink highlight as a 2×2 cluster if it fits
          setPixel(startX+col, startY+row, true);
        }
        d++;
      }
    }
  }
  // Blink focus separately (twinkle effect already applied overall)
}

// state
let view = new Date();
let focusDay = new Date().getDate();

function render(){
  clear();
  drawTwoDigits(2,0, focusDay);
  drawMiniMonth(view, focusDay);
  const monthName = view.toLocaleString(undefined,{month:'short'}).toUpperCase();
  caption.textContent = `${monthName} ${view.getFullYear()} — fake mini-grid · day ${focusDay}`;
  twinkle();
}

btnPrev.addEventListener('click', ()=>{ view = new Date(view.getFullYear(), view.getMonth()-1, 1); focusDay = Math.min(focusDay, new Date(view.getFullYear(), view.getMonth()+1, 0).getDate()); render(); });
btnNext.addEventListener('click', ()=>{ view = new Date(view.getFullYear(), view.getMonth()+1, 1); focusDay = Math.min(focusDay, new Date(view.getFullYear(), view.getMonth()+1, 0).getDate()); render(); });
btnToday.addEventListener('click', ()=>{ const now=new Date(); view=new Date(now.getFullYear(),now.getMonth(),1); focusDay = now.getDate(); render(); });

// allow clicking left/right half of screen to change day quickly (fake flip)
root.addEventListener('click', (e)=>{
  const rect = root.getBoundingClientRect();
  const leftHalf = e.clientX - rect.left < rect.width/2;
  const maxDay = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
  focusDay += leftHalf ? -1 : 1;
  if (focusDay < 1) focusDay = maxDay;
  if (focusDay > maxDay) focusDay = 1;
  render();
});

render();

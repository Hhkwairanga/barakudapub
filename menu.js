const menu = [
{ name: 'Breakfast', subtitle: 'Start your day on a delicious note.', icon: '☀', items: [['Potato and egg sauce',4500],['Yam and egg sauce',4500],['Fried or boiled plantain with egg sauce',2500],['Sandwich',7000],['Classic burger',7000],['Chicken burger',7000],['Chess burger',8000],['Moi-moi and custard',2000],['Indomie and egg',2500]] },
{ name: 'Rice, pasta & mains', subtitle: 'Comfort by the plateful.', icon: '✳', items: [['Jollof rice',3000],['White rice',2000],['Fried rice',3000],['Spaghetti — tomato sauce or stir-fried',3000],['Classic egg fried rice',4000],['Asun rice',8000],['Chinese fried rice',11000],['Oriental rice',5000],['Jambalaya',5000],['Chicken Alfredo',10000],['Seafood pasta',17000],['Spaghetti Bolognaese',8000],['Native rice',3000],['Amala',1000],['Semovita',2000],['Pounded yam',2000],['Egba',1000]] },
{ name: 'Soups', subtitle: 'Rich, warming and full of home.', icon: '≈', items: [['Egusi',4000],['Ogbono',4000],['Okro',3500],['Vegetable soup',4500],['Bitterleaf soup',3500],['Oha soup',3500],['Native okro',3000],['Tauste soup',3000],['Moringa soup',3000],['Afang soup',15000],['Marghi special',15000],['Local kuka soup',3000],['Kuka special with chicken',8000],['Seafood okro',18000],['Eforiro',8000],['Ewedu',1500],['Gbegiri',1000]] },
{ name: 'Proteins & sides', subtitle: 'The perfect company for your plate.', icon: '+', items: [['Peppered beef',3000],['Peppered goat',4000],['Peppered chicken',5000],['Peppered fish',8000],['Spicy gizzard',4000],['Fried chicken',4000],['Fried fish',8000],['Moi-moi',1500],['French fries',1500],['Plantain (fried)',1500],['Boiled plantain',1500]] },
{ name: 'Native dishes', subtitle: 'Rooted in tradition. Served with love.', icon: '❋', items: [['Ofadaa rice with Ayamase sauce',6000],['Nkwobi',11000],['Isi ewu',11000]] },
{ name: 'Sauces', subtitle: 'Sauces & accompaniments for white rice.', icon: '◒', items: [['Chicken sauce',3000],['Fish sauce',3000],['Nongolian beef',3000],['Cream sauce',null],['Sweet & sour sauce',null],['Tomato sauce',null]] },
{ name: 'Pastries', subtitle: 'A little bite of happiness.', icon: '◇', items: [['Shawarma',4000],['Meat pie',1500],['Chicken pie',1500],['Puff puff',1000],['Samosa',1000],['Spring rolls',1200],['Doughnut',1000],['Sausage rolls',1200],['Bread',2500],['Cup cake',7000],['Chicken jacket',2000]] }
];
const thumbnailIndex = new Map(menu.flatMap(group => group.items.map(([name]) => `${group.name}|${name}`)).map((key, index) => [key, index]));
function createDishThumbnail(key) {
 const photo = document.createElement('span');
 const imageIndex = thumbnailIndex.get(key);
 photo.className = 'dish-thumbnail';
 photo.setAttribute('role', 'img');
 photo.setAttribute('aria-label', `${key.split('|')[1]} — illustrative image`);
 photo.style.backgroundImage = `url('assets/food-sheet-${Math.floor(imageIndex / 16) + 1}.png')`;
 photo.style.backgroundPosition = `${(imageIndex % 4) * 100 / 3}% ${Math.floor((imageIndex % 16) / 4) * 100 / 3}%`;
 return photo;
}
let selected = 'All dishes';
const search = document.querySelector('#search');
const categories = document.querySelector('#categories');
const content = document.querySelector('#menu-content');
const currency = new Intl.NumberFormat('en-NG');
for (const name of ['All dishes', ...menu.map(group => group.name)]) {
 const button = document.createElement('button');
 button.textContent = name;
 button.setAttribute('aria-pressed', name === selected);
 button.addEventListener('click', () => { selected = name; update(); });
 categories.append(button);
}
function update() {
 categories.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', button.textContent === selected));
 const query = search.value.trim().toLocaleLowerCase();
 const groups = menu.filter(group => selected === 'All dishes' || group.name === selected).map(group => ({...group, items: group.items.filter(([name]) => `${name} ${group.name}`.toLocaleLowerCase().includes(query))})).filter(group => group.items.length);
 content.replaceChildren();
 let count = 0;
 groups.forEach((group, index) => {
  count += group.items.length;
  const section = document.createElement('section');
  section.className = 'dish-section';
  section.style.setProperty('--delay', `${Math.min(index, 4) * 50}ms`);
  const heading = document.createElement('div'); heading.className = 'dish-heading';
  heading.innerHTML = `<span class="category-icon" aria-hidden="true">${group.icon}</span><div><h3>${group.name}</h3><p>${group.subtitle}</p></div><span class="category-count">${String(group.items.length).padStart(2, '0')} DISHES</span>`;
  section.append(heading);
  const list = document.createElement('ul'); list.className = 'dish-grid';
  group.items.forEach(([name,price]) => {
   const li = document.createElement('li');
   const label = document.createElement('span'); label.textContent = name;
   const value = document.createElement('span'); value.className = price === null ? 'price complimentary' : 'price';
   value.textContent = price === null ? 'With white rice' : `₦${currency.format(price)}`;
   const add = document.createElement('button');
   add.className = 'add-dish'; add.textContent = '+';
   add.dataset.dish = `${group.name}|${name}`;
   add.setAttribute('aria-label', `Add ${name} to selection`);
   add.addEventListener('click', () => window.addDish(group.name, name));
   const photo = createDishThumbnail(`${group.name}|${name}`);
   label.className = 'dish-name';
   li.append(photo, label, value, add); list.append(li);
  });
  section.append(list); content.append(section);
 });
 document.querySelector('#result-count').textContent = `${count} ${count === 1 ? 'dish' : 'dishes'} · ${selected}`;
 document.querySelector('#empty').hidden = count > 0;
 window.syncSelection?.();
}
search.addEventListener('input', update);
document.querySelector('#reset').addEventListener('click', () => { selected = 'All dishes'; search.value = ''; update(); search.focus(); });
update();

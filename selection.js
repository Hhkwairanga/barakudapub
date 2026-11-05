// Crop the supplied flier at its original resolution; no logo recreation.
const original = new Image();
const logoReady = new Promise((resolve, reject) => {
 original.onload = () => {
  const canvas = document.createElement('canvas');
  const scale = original.naturalWidth / 1280;
  canvas.width = Math.round(282 * scale); canvas.height = Math.round(145 * scale);
  canvas.getContext('2d').drawImage(original, 60 * scale, 32 * scale, 282 * scale, 145 * scale, 0, 0, canvas.width, canvas.height);
  const logo = new Image();
  logo.onload = () => { document.querySelectorAll('.actual-logo').forEach(img => img.src = logo.src); resolve(logo); };
  logo.onerror = reject; logo.src = canvas.toDataURL('image/png');
 };
 original.onerror = reject; original.src = 'assets/original-menu.png';
});
logoReady.catch(() => { document.querySelectorAll('.actual-logo').forEach(img => { img.alt = 'BARAKUDA PUB'; }); });
const choices = new Map();
const dishLookup = new Map(menu.flatMap(group => group.items.map(([name, price]) => [`${group.name}|${name}`, {name, price, category: group.name}])));
try { for (const [key, quantity] of JSON.parse(localStorage.getItem('barakuda-selection') || '[]')) if (dishLookup.has(key) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99) choices.set(key, quantity); } catch {}
const dialog = document.querySelector('#selection-dialog');
const money = amount => `₦${currency.format(amount)}`;
const entries = () => [...choices].map(([key, quantity]) => ({key, quantity, ...dishLookup.get(key)}));
function selectionTotals(items) {
 const subtotal = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
 const vat = Math.round(subtotal * 7.5) / 100;
 return {subtotal, vat, total: Math.round((subtotal + vat) * 100) / 100};
}
window.addDish = (category, name) => { const key = `${category}|${name}`; choices.set(key, Math.min(99, (choices.get(key) || 0) + 1)); syncSelection(); };
window.syncSelection = function () {
 try { localStorage.setItem('barakuda-selection', JSON.stringify([...choices])); } catch {}
 const count = [...choices.values()].reduce((a,b) => a+b, 0);
 document.querySelector('.selection-bar').hidden = count === 0;
 document.querySelector('#selection-count').textContent = `${count} ${count === 1 ? 'item' : 'items'} selected`;
 document.querySelector('#selection-total').textContent = `${money(selectionTotals(entries()).total)} incl. VAT`;
 document.querySelectorAll('.add-dish').forEach(button => { const qty = choices.get(button.dataset.dish) || 0; button.textContent = qty ? `${qty} ✓` : '+'; button.classList.toggle('is-added', qty > 0); });
 renderSelection();
};
function renderSelection() {
 const list = document.querySelector('#selected-items'); list.replaceChildren();
 for (const item of entries()) {
  const row = document.createElement('div'); row.className = 'selected-row';
  const info = document.createElement('div'); const name = document.createElement('strong'); name.textContent = item.name;
  const meta = document.createElement('small'); meta.textContent = `${item.category} · ${item.price === null ? 'With white rice' : money(item.price) + ' each'}`;
  info.append(name, meta);
  const controls = document.createElement('div'); controls.className = 'quantity-controls';
  for (const [symbol, delta, label] of [['−', -1, 'Decrease'], ['+', 1, 'Increase']]) {
   const button = document.createElement('button'); button.textContent = symbol; button.setAttribute('aria-label', `${label} ${item.name} quantity`); button.disabled = delta === 1 && item.quantity >= 99;
   button.onclick = () => { const next = item.quantity + delta; if (next) choices.set(item.key, next); else choices.delete(item.key); syncSelection(); };
   if (delta === 1) { const number = document.createElement('span'); number.textContent = item.quantity; controls.append(number); }
   controls.append(button);
  }
  const cost = document.createElement('span'); cost.className = 'selected-cost'; cost.textContent = item.price === null ? '—' : money(item.price * item.quantity);
  const printQty = document.createElement('span'); printQty.className = 'print-quantity'; printQty.textContent = `× ${item.quantity}`;
  row.append(createDishThumbnail(item.key), info, controls, printQty, cost); list.append(row);
 }
 if (!choices.size) list.textContent = 'Your selection is empty. Add a dish from the menu to get started.';
 const amounts = selectionTotals(entries());
 document.querySelector('#sheet-subtotal').textContent = money(amounts.subtotal);
 document.querySelector('#sheet-vat').textContent = money(amounts.vat);
 document.querySelector('#sheet-total').textContent = money(amounts.total);
 document.querySelector('#unpriced-note').hidden = !entries().some(item => item.price === null);
 document.querySelector('#print-selection').disabled = document.querySelector('#save-selection').disabled = document.querySelector('#whatsapp-selection').disabled = !choices.size;
 preparedShare = null;
 document.querySelector('#whatsapp-panel').hidden = true;
 document.querySelector('#export-status').textContent = '';
 document.querySelector('#export-preview').hidden = true;
}
document.querySelector('#review-selection').onclick = () => { renderSelection(); dialog.showModal(); };
document.querySelector('#close-selection').onclick = () => dialog.close();
document.querySelector('#clear-selection').onclick = () => { choices.clear(); syncSelection(); };
document.querySelector('#print-selection').onclick = async () => { await logoReady.catch(() => {}); await document.fonts.ready; window.print(); };
async function buildSelectionImage(items) {
  const logo = await logoReady; await document.fonts.ready;
  const sheets = await Promise.all(Array.from({length: 5}, (_, i) => new Promise((resolve, reject) => {
   const img = new Image(); img.onload = () => resolve(img); img.onerror = reject;
   img.src = `assets/food-sheet-${i + 1}.png`;
  })));
  const width = 1200; const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = 710 + items.length * 105 + (items.some(i => i.price === null) ? 60 : 0);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f6f3eb'; ctx.fillRect(0,0,width,canvas.height);
  ctx.fillStyle = '#bd4b2b'; ctx.fillRect(0,0,width,12);
  ctx.drawImage(logo, 70, 40, 240, 123);
  ctx.fillStyle = '#263a2f'; ctx.font = '54px "Playfair Display", Georgia'; ctx.fillText('Your selection.',70,240);
  ctx.font = '22px "DM Sans", sans-serif'; ctx.fillText('National Stadium Abuja, behind Lawn Tennis Court',70,285);
  let y = 350;
  for (const item of items) {
   const index = thumbnailIndex.get(item.key); const sheet = sheets[Math.floor(index / 16)];
   const tileWidth = sheet.naturalWidth / 4; const tileHeight = sheet.naturalHeight / 4;
   ctx.drawImage(sheet, (index % 4) * tileWidth, Math.floor((index % 16) / 4) * tileHeight, tileWidth, tileHeight, 70, y - 26, 80, 80);
   ctx.fillStyle = '#263a2f'; ctx.font = '500 26px "DM Sans", sans-serif';
   // Wrap long dish names within the space reserved before the price column.
   const words = `${item.quantity} × ${item.name}`.split(' '); let line = ''; let lineY = y;
   for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > 660 && line) { ctx.fillText(line,170,lineY); line = word; lineY += 30; } else line = test; }
   ctx.fillText(line,170,lineY);
   ctx.font = '18px "DM Sans", sans-serif'; ctx.fillStyle = '#697167'; ctx.fillText(`${item.category}${item.price === null ? ' · With white rice' : ''}`,170,lineY + 29);
   ctx.textAlign = 'right'; ctx.fillStyle = '#263a2f'; ctx.font = '500 26px "DM Sans", sans-serif'; ctx.fillText(item.price === null ? '—' : money(item.price * item.quantity),1130,y); ctx.textAlign = 'left';
   ctx.strokeStyle = '#dcded2'; ctx.beginPath(); ctx.moveTo(70,y + 76); ctx.lineTo(1130,y + 76); ctx.stroke(); y += 105;
  }
  const amounts = selectionTotals(items);
  for (const [label, amount, prominent] of [['Subtotal', amounts.subtotal, false], ['VAT (7.5%)', amounts.vat, false], ['Total incl. VAT', amounts.total, true]]) {
   ctx.font = '24px "DM Sans", sans-serif'; ctx.fillText(label,70,y + 15);
   ctx.textAlign = 'right'; ctx.font = prominent ? 'bold 36px "DM Sans", sans-serif' : '24px "DM Sans", sans-serif';
   ctx.fillText(money(amount),1130,y + 15); ctx.textAlign = 'left'; y += 45;
  }
  y += 20;
  if (items.some(i => i.price === null)) { ctx.font = '18px "DM Sans", sans-serif'; ctx.fillText('Items with no separate listed price are excluded from the total.',70,y); y += 60; }
  ctx.fillStyle = '#697167'; ctx.font = '20px "DM Sans", sans-serif'; ctx.fillText('A personal selection, not a confirmed order.',70,y); ctx.fillText('Reservations: 0803 417 9350 · 0803 442 4069',70,y + 35); ctx.fillText('@barakudapub1 · Food images are illustrative.',70,y + 70);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); if (!blob) throw new Error('Image export failed');
  return blob;
}
let preparedShare = null;
function showExport(blob) {
 const previousUrl = document.querySelector('#export-download').getAttribute('href');
 if (previousUrl) URL.revokeObjectURL(previousUrl);
 const url = URL.createObjectURL(blob);
 document.querySelector('#export-download').href = url;
 document.querySelector('#whatsapp-download').href = url;
 document.querySelector('#export-image').src = url;
 document.querySelector('#export-preview').hidden = false;
}
function selectionMessage(items) {
 const amounts = selectionTotals(items);
 return ['Hello Barakuda Pub! I would like to order:', '',
  ...items.map(item => `${item.quantity} × ${item.name} — ${item.price === null ? 'With white rice (no separate price listed)' : money(item.price * item.quantity)}`), '',
  `Subtotal: ${money(amounts.subtotal)}`,
  `VAT (7.5%): ${money(amounts.vat)}`,
  `Total incl. VAT: ${money(amounts.total)}`,
  'Please confirm availability and the final total. Thank you!'].join('\n');
}
document.querySelector('#save-selection').onclick = async () => {
 const button = document.querySelector('#save-selection'); button.disabled = true;
 const status = document.querySelector('#export-status'); status.textContent = 'Preparing your image…';
 const snapshot = entries();
 try {
  const blob = await buildSelectionImage(snapshot);
  if (JSON.stringify(snapshot) !== JSON.stringify(entries())) { status.textContent = 'Selection changed. Please save again.'; return; }
  showExport(blob); document.querySelector('#export-download').click();
  status.textContent = 'Your menu image is ready. Check your downloads.';
 } catch { status.textContent = 'Could not save the image. Please try again, or use Print / PDF.'; }
 finally { button.disabled = !choices.size; }
};
document.querySelector('#whatsapp-selection').onclick = async () => {
 const button = document.querySelector('#whatsapp-selection');
 const status = document.querySelector('#export-status');
 const snapshot = entries(); if (!snapshot.length) return;
 button.disabled = true; status.textContent = 'Preparing your WhatsApp selection…';
 try {
  const blob = await buildSelectionImage(snapshot);
  if (JSON.stringify(snapshot) !== JSON.stringify(entries())) { status.textContent = 'Selection changed. Tap Send on WhatsApp again.'; return; }
  showExport(blob);
  const file = new File([blob], 'barakuda-my-menu.png', {type: 'image/png'});
  preparedShare = {files: [file], title: 'Barakuda Pub — my selection', text: selectionMessage(snapshot)};
  let canShare = false;
  try { canShare = !!navigator.share && !!navigator.canShare?.({files:[file]}); } catch {}
  document.querySelector('#share-selection-image').hidden = !canShare;
  document.querySelector('#whatsapp-help').textContent = canShare
   ? 'Tap Share image, choose WhatsApp, then select Barakuda Pub (0803 442 4069). You choose the recipient and tap Send in WhatsApp. Use Open WhatsApp chat below if you need to start the conversation first.'
   : 'Save your selection image below, then open the WhatsApp chat with your order details. Attach the saved image in WhatsApp and tap Send.';
  document.querySelector('#whatsapp-chat').href = `https://wa.me/2348034424069?text=${encodeURIComponent(preparedShare.text)}`;
  document.querySelector('#whatsapp-download').href = document.querySelector('#export-download').href;
  document.querySelector('#whatsapp-panel').hidden = false;
  status.textContent = 'Ready to share with Barakuda Pub. Your message has not been sent.';
 } catch { status.textContent = 'Could not prepare the image. Please try again.'; }
 finally { button.disabled = !choices.size; }
};
document.querySelector('#share-selection-image').onclick = async () => {
 if (!preparedShare) return;
 const status = document.querySelector('#export-status');
 try {
  // Called directly from this second tap to preserve browser user activation.
  await navigator.share(preparedShare);
  status.textContent = 'Selection handed to the share sheet. Complete sending in WhatsApp.';
 } catch (error) {
  status.textContent = error.name === 'AbortError' ? 'Sharing cancelled. Your selection is still here.' : 'Image sharing is unavailable. Save the image and attach it using Open WhatsApp chat below.';
 }
};
syncSelection();

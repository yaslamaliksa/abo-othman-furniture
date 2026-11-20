import { rooms } from './catalog.js';

const storeNumber = '967771177898';
const price = '1,600';
const galleryImage = document.querySelector('#gallery-image');
const galleryCaption = document.querySelector('#gallery-caption');
const thumbs = document.querySelector('#gallery-thumbs');
const dialog = document.querySelector('#product-dialog');
const form = document.querySelector('#booking-form');
const colorOptions = document.querySelector('#color-options');
const colorField = document.querySelector('#custom-color');
const sizeField = document.querySelector('#custom-size');
const filters = document.querySelector('#filters');
const products = document.querySelector('#products');
const resultCount = document.querySelector('#result-count');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const numberFormat = new Intl.NumberFormat('ar');
let selectedRoom;
let currentPhoto = 0;

function imagePath(number, thumbnail = false) {
  const folder = thumbnail ? 'assets/thumbs' : 'assets';
  return `./${folder}/${String(number).padStart(2, '0')}.webp`;
}

function card(room, index) {
  const item = document.createElement('article');
  item.className = 'product';
  item.innerHTML = `
    <button class="card-photo" type="button" data-room="${room.id}" aria-label="صور ${room.name}">
      <img src="${imagePath(room.images[0][0])}" alt="${room.name}" width="720" height="450" loading="${index < 3 ? 'eager' : 'lazy'}">
      <span class="photo-count"><i class="icon icon-details" aria-hidden="true"></i> ${numberFormat.format(room.images.length)} صور</span>
    </button>
    <div class="card-info">
      <h3>${room.name}</h3>
      <p class="card-description">${room.description}</p>
      <div class="card-bottom">
        <p class="card-price"><strong dir="ltr">${price}</strong> ريال سعودي</p>
        <button class="button card-button" type="button" data-room="${room.id}" aria-label="التفاصيل والحجز، ${room.name}">التفاصيل والحجز</button>
      </div>
    </div>`;
  return item;
}

const catalog = rooms.map(card);
products.append(...catalog);

const reveal = new IntersectionObserver((entries) => {
  for (const { isIntersecting, target } of entries) {
    if (!isIntersecting) continue;
    if (!motion.matches) target.animate([{ opacity: .4, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], { duration: 430, easing: 'ease-out' });
    reveal.unobserve(target);
  }
}, { threshold: .12 });
catalog.forEach(item => reveal.observe(item));

function filterRooms(tone) {
  filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', button.dataset.filter === tone));
  let shown = 0;
  catalog.forEach((item, index) => {
    const match = tone === 'all' || rooms[index].tones.includes(tone);
    item.hidden = !match;
    if (match) shown += 1;
  });
  resultCount.textContent = shown === 1 ? 'موديل واحد' : `${numberFormat.format(shown)} موديلات`;
}

filters.addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (button) filterRooms(button.dataset.filter);
});
filterRooms('all');

function showPhoto(index) {
  const [number, caption] = selectedRoom.images[index];
  currentPhoto = index;
  galleryImage.src = imagePath(number);
  galleryImage.alt = `${selectedRoom.name}، ${caption}`;
  galleryCaption.textContent = caption;
  for (const [position, button] of Array.from(thumbs.children).entries()) {
    button.setAttribute('aria-pressed', position === index);
  }
}

function renderGallery(room) {
  const buttons = room.images.map(([number, caption], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.photo = index;
    button.setAttribute('aria-label', caption);
    const image = document.createElement('img');
    image.src = imagePath(number, true);
    image.alt = '';
    button.append(image);
    return button;
  });
  thumbs.replaceChildren(...buttons);
  thumbs.hidden = buttons.length < 2;
  thumbs.scrollLeft = 0;
  showPhoto(0);
}

thumbs.addEventListener('click', event => {
  const button = event.target.closest('button[data-photo]');
  if (button) showPhoto(Number(button.dataset.photo));
});
thumbs.addEventListener('keydown', event => {
  const step = { ArrowLeft: 1, ArrowRight: -1 }[event.key];
  if (!step) return;
  event.preventDefault();
  const next = (currentPhoto + step + selectedRoom.images.length) % selectedRoom.images.length;
  showPhoto(next);
  thumbs.children[next].focus();
});

function renderColors(room) {
  const colors = [...room.colors, { label: 'لون آخر', swatch: '#f6efe3', custom: true }];
  const choices = colors.map((color, index) => {
    const option = document.createElement('label');
    option.className = 'color-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'color';
    input.value = color.custom ? 'custom' : color.label;
    input.checked = index === 0;
    const text = document.createElement('span');
    const swatch = document.createElement('i');
    swatch.className = 'swatch';
    swatch.style.setProperty('--swatch', color.swatch);
    swatch.setAttribute('aria-hidden', 'true');
    text.append(swatch, color.label);
    option.append(input, text);
    return option;
  });
  colorOptions.replaceChildren(...choices);
}

function toggleCustomField(field, show) {
  field.hidden = !show;
  field.disabled = !show;
  field.required = show;
}

function openRoom(room) {
  selectedRoom = room;
  form.reset();
  toggleCustomField(colorField, false);
  toggleCustomField(sizeField, false);
  document.querySelector('#product-title').textContent = room.name;
  document.querySelector('#product-description').textContent = room.description;
  renderGallery(room);
  renderColors(room);
  dialog.showModal();
  dialog.scrollTop = 0;
}

products.addEventListener('click', event => {
  const button = event.target.closest('button[data-room]');
  if (button) openRoom(rooms.find(room => room.id === button.dataset.room));
});

dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener('change', event => {
  if (event.target.name === 'color') toggleCustomField(colorField, form.elements.color.value === 'custom');
  if (event.target.name === 'size') toggleCustomField(sizeField, form.elements.size.value === 'custom');
});

function bookingUrl(roomName, color, size, notes) {
  const lines = [
    'السلام عليكم، أرغب في حجز غرفة نوم من متجر ابو عثمان.',
    `الموديل: ${roomName}`,
    'السعر: 1600 ريال سعودي',
    `اللون المطلوب: ${color}`,
    `مقاس السرير: ${size || 'يُحدد مع المعرض'}`,
  ];
  if (notes) lines.push(`تفاصيل الطلب: ${notes}`);
  return `https://wa.me/${storeNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  for (const field of [colorField, sizeField]) {
    if (field.disabled) continue;
    field.value = field.value.trim();
    if (!field.reportValidity()) return;
  }
  const data = new FormData(form);
  const color = data.get('customColor') ?? data.get('color');
  const size = data.get('customSize') ?? data.get('size');
  const notes = data.get('notes').trim();
  window.location.assign(bookingUrl(selectedRoom.name, color, size, notes));
});

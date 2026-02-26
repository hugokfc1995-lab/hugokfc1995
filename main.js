const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASS = '1234';
const ADMIN_KEY = 'hugok_admin_logged_in';
const ADMIN_PASS_KEY = 'hugok_admin_password';
const MEMBERS_KEY = 'hugok_members';
const PHOTOS_KEY = 'hugok_gallery_photos';
const ADMIN_LAST_ACTIVE_KEY = 'hugok_admin_last_active';
const ADMIN_TIMEOUT_MS = 10 * 60 * 1000;
const ADMIN_WARN_MS = 2 * 60 * 1000;
const MAX_GALLERY_ITEMS = 60;
const GALLERY_PAGE_SIZE = 8;
const CALENDAR_ICS_URL =
  'https://calendar.google.com/calendar/ical/hugokfc1995%40gmail.com/public/basic.ics';
const formatDateCaption = (filename) => {
  const base = filename.replace(/\.[^/.]+$/, '');
  if (/^\d{8}_/.test(base)) {
    const year = base.slice(0, 4);
    const month = base.slice(4, 6);
    const day = base.slice(6, 8);
    return `${year}년 ${month}월 ${day}일`;
  }
  if (/^\d{13}$/.test(base)) {
    const date = new Date(Number(base));
    if (!Number.isNaN(date.getTime())) {
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}년 ${month}월 ${day}일`;
    }
  }
  return '0000년 00월 00일';
};

const formatKstDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
};

const formatKstTime = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const parseIcsDate = (value) => {
  if (!value) return null;
  const isUtc = value.endsWith('Z');
  const clean = value.replace('Z', '');
  const datePart = clean.split('T')[0];
  const timePart = clean.split('T')[1] || '000000';
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6)) - 1;
  const day = Number(datePart.slice(6, 8));
  const hour = Number(timePart.slice(0, 2));
  const minute = Number(timePart.slice(2, 4));
  const second = Number(timePart.slice(4, 6));
  if ([year, month, day].some((n) => Number.isNaN(n))) return null;
  if (isUtc) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  return new Date(year, month, day, hour, minute, second);
};

const extractOpponent = (summary) => {
  if (!summary) return '-';
  const normalized = summary.replace(/\s+/g, ' ').trim();
  const vsIndex = normalized.toLowerCase().indexOf('vs');
  if (vsIndex === -1) return normalized.replace('후곡', '').trim() || normalized;
  const after = normalized.slice(vsIndex + 2).replace(/[:\-]/g, '').trim();
  return after.replace('후곡', '').trim() || after || '-';
};

const fetchIcsText = async () => {
  const direct = await fetch(CALENDAR_ICS_URL, { cache: 'no-store' });
  if (direct.ok) return direct.text();
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(CALENDAR_ICS_URL)}`;
  const proxy = await fetch(proxyUrl, { cache: 'no-store' });
  if (!proxy.ok) throw new Error('calendar fetch failed');
  return proxy.text();
};

const fetchWeeklySchedule = async () => {
  if (!scheduleDateEl || !scheduleTimeEl || !schedulePlaceEl || !scheduleOpponentEl) return;
  try {
    const text = await fetchIcsText();
    const unfolded = text.replace(/\r?\n[ \t]/g, '');
    const events = unfolded.split('BEGIN:VEVENT').slice(1).map((chunk) => {
      const end = chunk.split('END:VEVENT')[0];
      const lines = end.split(/\r?\n/);
      const getLine = (prefix) => {
        const line = lines.find((l) => l.startsWith(prefix));
        return line ? line.slice(prefix.length) : '';
      };
      const dtStartLine = lines.find((l) => l.startsWith('DTSTART'));
      const dtEndLine = lines.find((l) => l.startsWith('DTEND'));
      const summary = getLine('SUMMARY:');
      const dtStartValue = dtStartLine ? dtStartLine.split(':').pop() : '';
      const dtEndValue = dtEndLine ? dtEndLine.split(':').pop() : '';
      return {
        summary,
        start: parseIcsDate(dtStartValue),
        end: parseIcsDate(dtEndValue),
      };
    });
    const now = new Date();
    const upcoming = events
      .filter((evt) => evt.start instanceof Date && evt.start >= now)
      .sort((a, b) => a.start - b.start);
    const next = upcoming[0];
    if (!next) return;
    scheduleDateEl.textContent = formatKstDate(next.start);
    if (next.end) {
      scheduleTimeEl.textContent = `${formatKstTime(next.start)} ~ ${formatKstTime(next.end)}`;
    } else {
      scheduleTimeEl.textContent = formatKstTime(next.start);
    }
    schedulePlaceEl.textContent = '조리체육공원';
    scheduleOpponentEl.textContent = extractOpponent(next.summary);
  } catch {
    scheduleDateEl.textContent = '일정 확인 불가';
    scheduleTimeEl.textContent = '-';
    schedulePlaceEl.textContent = '조리체육공원';
    scheduleOpponentEl.textContent = '-';
  }
};

const DEFAULT_GALLERY_FILES = [
  '1770724491236.jpg',
  '1770724504135.jpg',
  '1770724504230.jpg',
  '1770724512516.jpg',
  '1770724523734.jpg',
  '1770724523814.jpg',
  '1770724553533.jpg',
  '1770724553596.jpg',
  '1770724553656.jpg',
  '1770724554176.jpg',
  '1770724554235.jpg',
  '1770724554401.jpg',
  '1770724554449.jpg',
  '1770724554522.jpg',
  '1770724554573.jpg',
  '1770724554624.jpg',
  '1770724554699.jpg',
  '1770724554757.jpg',
  '1770724554817.jpg',
  '1770724554878.jpg',
  '1770724554949.jpg',
  '1770724555067.jpg',
  '1770724555276.jpg',
  '20250202_084850.jpg',
  '20250608_162605.jpg',
  '20250608_163300.jpg',
  '20251102_191315.jpg',
  '20260125_100051.jpg',
  '20260125_100102.jpg',
  '20260125_100108.jpg',
  '20260125_100306.jpg',
];

const DEFAULT_GALLERY_CAPTIONS = {
  '1770724491236.jpg': '시무식 시상식 기념사진',
  '1770724504135.jpg': '야간 운동 전 스트레칭',
  '1770724504230.jpg': '야간 운동 준비 스트레칭',
  '1770724512516.jpg': '훈련 후 간식 나눔',
  '1770724523734.jpg': '주말 경기 진행',
  '1770724523814.jpg': '훈련 전 스트레칭',
  '1770724553533.jpg': '모임 선물 증정',
  '1770724553596.jpg': '야외 모임 단체샷',
  '1770724553656.jpg': '야외 모임 단체샷 2',
  '1770724554176.jpg': '단체 셀카',
  '1770724554235.jpg': '단체 셀카 2',
  '1770724554401.jpg': '단체 셀카 3',
  '1770724554449.jpg': '단체 셀카 4',
  '1770724554522.jpg': '단체 셀카 5',
  '1770724554573.jpg': '단체 셀카 6',
  '1770724554624.jpg': '단체 셀카 7',
  '1770724554699.jpg': '단체 셀카 8',
  '1770724554757.jpg': '단체 셀카 9',
  '1770724554817.jpg': '단체 셀카 10',
  '1770724554878.jpg': '단체 셀카 11',
  '1770724554949.jpg': '단체 셀카 12',
  '1770724555067.jpg': '단체 셀카 13',
  '1770724555276.jpg': '단체 셀카 14',
  '20250202_084850.jpg': '동계 단체사진',
  '20250608_162605.jpg': '친목 식사',
  '20250608_163300.jpg': '친목 식사 인증샷',
  '20251102_191315.jpg': '가을 뒤풀이',
  '20260125_100051.jpg': '훈련 후 라면 준비',
  '20260125_100102.jpg': '훈련 후 라면 나눔',
  '20260125_100108.jpg': '훈련 후 라면 끓이는 중',
  '20260125_100306.jpg': '훈련 후 간식 시간',
};

const DEFAULT_BLOG_POSTS = [
  {
    id: 'post-2026-01',
    title: '2026년 새해 훈련 후 라면 파티',
    date: '2026-01-25',
    thumb: 'images/gallery/20260125_100051.jpg',
    excerpt: '새해 첫 훈련을 마치고 함께하는 따뜻한 라면 파티! 추운 겨울에도 열정 넘치는 회원들의 현장을 소개합니다.',
    content: '<p>2026년 새해 첫 훈련을 성공적으로 마쳤습니다!</p><p>영하의 날씨에도 불구하고 많은 회원들이 참석하여 열정적인 훈련을 펼쳤습니다. 조리체육공원의 싸늘한 공기를 가르며 함께 뛰는 것만으로도 충분히 즐거운 시간이었습니다.</p><p>훈련 후에는 회원들이 직접 준비한 라면을 함께 끓여 나누는 뒤풀이가 이어졌습니다. 추운 날씨에 땀 흘리고 먹는 따뜻한 라면 한 그릇의 맛은 정말 이루 말할 수 없었습니다.</p><p>새해에도 건강하게 함께 뛸 수 있어서 행복합니다. 2026년 한 해도 후곡생활축구회와 함께 좋은 추억 많이 만들어봐요!</p>',
    tags: ['훈련', '뒤풀이', '2026'],
  },
  {
    id: 'post-2025-11',
    title: '2025 가을 시즌 뒤풀이',
    date: '2025-11-02',
    thumb: 'images/gallery/20251102_191315.jpg',
    excerpt: '2025년 가을 시즌을 마치며 회원들과 함께한 즐거운 뒤풀이 현장을 소개합니다.',
    content: '<p>2025년 가을 시즌을 마무리하며 회원들과 함께 즐거운 뒤풀이를 가졌습니다.</p><p>올 한 해도 함께 뛰어준 모든 회원분들께 진심으로 감사드립니다. 승패를 떠나 함께 땀 흘리고, 함께 웃으며 쌓은 추억들이 무엇보다 소중합니다.</p><p>가을의 선선한 날씨만큼이나 기분 좋은 자리였습니다. 맛있는 음식과 시원한 음료를 나누며 서로의 안부를 묻고 이야기꽃을 피웠습니다.</p><p>겨울에도 건강하게 운동하며 2026년 시즌을 기대해봐요! 후곡 파이팅!</p>',
    tags: ['뒤풀이', '2025', '가을'],
  },
  {
    id: 'post-2025-06',
    title: '여름 친목 식사 모임',
    date: '2025-06-08',
    thumb: 'images/gallery/20250608_162605.jpg',
    excerpt: '6월의 따뜻한 날, 회원들과 함께한 친목 식사 모임 소식을 전합니다.',
    content: '<p>6월의 따사로운 날씨를 맞아 회원들과 함께 친목 식사 모임을 가졌습니다.</p><p>운동만큼이나 중요한 것이 바로 이런 친목의 시간이 아닐까요? 맛있는 음식과 함께 도란도란 이야기를 나누며 서로를 더 잘 알아가는 소중한 자리였습니다.</p><p>처음 참가하신 신규 회원분들도 함께해 주셔서 더욱 즐거웠습니다. 자리를 빛내주신 모든 분들께 감사드립니다.</p><p>앞으로도 이런 모임을 꾸준히 가져서 더욱 돈독한 팀워크를 쌓아나가겠습니다!</p>',
    tags: ['친목', '식사', '2025'],
  },
  {
    id: 'post-2025-02',
    title: '2025 동계 단체사진',
    date: '2025-02-02',
    thumb: 'images/gallery/20250202_084850.jpg',
    excerpt: '추운 겨울에도 함께 모인 후곡생활축구회 회원들의 열정적인 모습을 담았습니다.',
    content: '<p>한겨울의 추위도 후곡생활축구회 회원들의 열정을 막을 수는 없습니다!</p><p>2025년 겨울, 영하의 날씨에도 불구하고 많은 회원들이 참석하여 훈련을 진행했습니다. 추운 날씨에 몸을 움직이면 오히려 더욱 활력이 넘치는 것 같습니다.</p><p>훈련을 마치고 다 같이 단체사진을 찍었습니다. 추위에 빨개진 볼이지만 활짝 웃는 얼굴들이 너무 보기 좋습니다.</p><p>함께 해주신 모든 회원분들께 감사드리며, 건강한 몸과 마음으로 한 해를 열어나가겠습니다!</p>',
    tags: ['동계', '단체사진', '2025'],
  },
  {
    id: 'post-2025-01',
    title: '시무식 및 시상식',
    date: '2025-01-01',
    thumb: 'images/gallery/1770724491236.jpg',
    excerpt: '새해를 맞아 진행된 시무식과 시상식 현장을 소개합니다. 수고한 회원들을 격려하며 새 출발을 다짐했습니다.',
    content: '<p>새해를 맞아 후곡생활축구회 시무식 및 시상식이 성황리에 개최되었습니다.</p><p>지난 한 해 동안 꾸준히 참여해주신 모든 회원분들께 진심으로 감사의 말씀을 전합니다. 시상식에서는 성실하게 참여한 우수 회원들에게 감사패와 상품을 증정하였습니다.</p><p>매번 주말이면 함께 땀 흘리며 만든 추억들이 우리 클럽의 가장 큰 자산입니다. 새해에도 건강하게 함께 뛰며 즐거운 시간 만들어봐요!</p><p>후곡생활축구회 파이팅! 🔥</p>',
    tags: ['시무식', '시상식', '2025'],
  },
];

const DEFAULT_PHOTOS = DEFAULT_GALLERY_FILES.map((file) => {
  const dateCaption = formatDateCaption(file);
  const detail = DEFAULT_GALLERY_CAPTIONS[file];
  return {
    url: `images/gallery/${file}`,
    thumb: `images/gallery/thumbs/${file}`,
    caption: detail ? `${dateCaption} - ${detail}` : dateCaption,
  };
});

const blogHomeGrid = document.querySelector('#blog-home-grid');
const blogListGrid = document.querySelector('#blog-list-grid');
const blogPostContent = document.querySelector('#blog-post-content');

const loginForm = document.querySelector('#admin-login-form');
const memberForm = document.querySelector('#member-form');
const memberSubmitBtn = memberForm ? memberForm.querySelector('button[type="submit"]') : null;
const memberList = document.querySelector('#member-list');
const logoutBtn = document.querySelector('#admin-logout');
const logoutTopBtn = document.querySelector('#admin-logout-top');
const remainingEl = document.querySelector('#admin-logout-top');
const galleryGrid = document.querySelector('#gallery-grid');
const galleryPagination = document.querySelector('#gallery-pagination');
const galleryMoreBtn = document.querySelector('#gallery-more');
const scheduleDateEl = document.querySelector('#schedule-date');
const scheduleTimeEl = document.querySelector('#schedule-time');
const schedulePlaceEl = document.querySelector('#schedule-place');
const scheduleOpponentEl = document.querySelector('#schedule-opponent');
const photoForm = document.querySelector('#gallery-form');
const photoDropZone = document.querySelector('#photo-drop-zone');
const photoPreview = document.querySelector('#photo-preview');
const photoList = document.querySelector('#gallery-list');
const clearGalleryBtn = document.querySelector('#clear-gallery');
const clearBtn = document.querySelector('#clear-members');
const passwordForm = document.querySelector('#admin-password-form');
let editingMemberIndex = null;
const MEMBER_SUBMIT_DEFAULT = '회원 등록';
const MEMBER_SUBMIT_EDITING = '수정 완료';

const setMemberEditMode = (isEditing) => {
  if (!memberSubmitBtn) return;
  memberSubmitBtn.textContent = isEditing ? MEMBER_SUBMIT_EDITING : MEMBER_SUBMIT_DEFAULT;
};

const getSelectedPositions = () => {
  if (!memberForm) return [];
  return Array.from(memberForm.querySelectorAll('input[name="position"]:checked')).map(
    (input) => input.value,
  );
};

const setSelectedPositions = (positions) => {
  if (!memberForm) return;
  const normalized = new Set(
    (Array.isArray(positions) ? positions : String(positions || '').split(','))
      .map((value) => String(value).trim())
      .filter(Boolean),
  );
  memberForm.querySelectorAll('input[name="position"]').forEach((input) => {
    input.checked = normalized.has(input.value);
  });
};

const setAdminState = (loggedIn) => {
  localStorage.setItem(ADMIN_KEY, loggedIn ? 'true' : 'false');
  document.body.classList.toggle('admin-logged-in', loggedIn);
};

const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'true';

const isAdminLoginPage = () => {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path.endsWith('/admin.html') || path.endsWith('/admin');
};

const guardAdminNavLinks = () => {
  const adminLinks = document.querySelectorAll('.site-nav a[href^="admin-"]');
  if (!adminLinks.length) return;
  adminLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (isAdmin()) return;
      event.preventDefault();
      if (isAdminLoginPage()) {
        if (loginForm) {
          const firstInput = loginForm.querySelector('input');
          if (firstInput instanceof HTMLElement) {
            firstInput.focus();
          }
        }
        return;
      }
      window.location.href = 'admin.html';
    });
  });
};

const enforceAdminAccess = () => {
  if (!document.body.classList.contains('admin-page')) return;
  if (isAdmin()) return;
  if (isAdminLoginPage()) return;
  window.location.href = 'admin.html';
};

const setLastActive = () => {
  localStorage.setItem(ADMIN_LAST_ACTIVE_KEY, String(Date.now()));
};

const getLastActive = () => {
  const value = Number(localStorage.getItem(ADMIN_LAST_ACTIVE_KEY));
  return Number.isFinite(value) ? value : 0;
};

const getAdminPassword = () => localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN_PASS;

const setAdminPassword = (password) => {
  localStorage.setItem(ADMIN_PASS_KEY, password);
};

const loadMembers = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveMembers = (members) => {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
};

const loadPhotos = () => {
  try {
    return JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]');
  } catch {
    return [];
  }
};

const savePhotos = (photos) => {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
};

const clearStoredPhotos = () => {
  localStorage.removeItem(PHOTOS_KEY);
};

const renderMembers = () => {
  if (!memberList) return;
  const members = loadMembers();
  memberList.innerHTML = '';
  if (members.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = '등록된 회원이 없습니다.';
    memberList.appendChild(empty);
    return;
  }
  members.forEach((member, index) => {
    const item = document.createElement('li');
    item.className = 'member-item';
    item.innerHTML = `
      <div class="member-meta">
        <strong>${member.name}</strong>
        <span>연락처: ${member.phone}</span>
        <span>포지션: ${member.position}</span>
        <span>가입일: ${member.joined}</span>
      </div>
      <div class="member-actions">
        <button class="member-edit" type="button" data-index="${index}">수정</button>
        <button class="member-delete" type="button" data-index="${index}">삭제</button>
      </div>
    `;
    memberList.appendChild(item);
  });
};

const getGalleryItems = () => {
  const saved = loadPhotos();
  const merged = [];
  const seen = new Set();
  const addPhoto = (photo) => {
    if (!photo || !photo.url) return;
    if (seen.has(photo.url)) return;
    seen.add(photo.url);
    merged.push(photo);
  };
  saved.forEach(addPhoto);
  DEFAULT_PHOTOS.forEach(addPhoto);
  return merged.slice(0, MAX_GALLERY_ITEMS);
};

const galleryPageSize =
  Number(document.body?.dataset?.galleryPageSize) || GALLERY_PAGE_SIZE;
const galleryMode = document.body?.dataset?.galleryMode || (galleryPagination ? 'pagination' : 'more');

let galleryCurrentPage = 1;
let galleryVisibleCount = galleryPageSize;

const renderGalleryPagination = (total) => {
  if (!galleryPagination || galleryMode !== 'pagination') {
    if (galleryPagination) galleryPagination.innerHTML = '';
    return;
  }
  const totalPages = Math.max(1, Math.ceil(total / galleryPageSize));
  if (galleryCurrentPage > totalPages) {
    galleryCurrentPage = totalPages;
  }
  if (totalPages <= 1) {
    galleryPagination.innerHTML = '';
    return;
  }
  const buttons = [];
  const prevDisabled = galleryCurrentPage === 1 ? 'disabled' : '';
  const nextDisabled = galleryCurrentPage === totalPages ? 'disabled' : '';
  buttons.push(`<button type="button" class="gallery-page-btn" data-page="prev" ${prevDisabled}>이전</button>`);
  for (let page = 1; page <= totalPages; page += 1) {
    const active = page === galleryCurrentPage ? 'aria-current="page"' : '';
    buttons.push(
      `<button type="button" class="gallery-page-btn" data-page="${page}" ${active}>${page}</button>`,
    );
  }
  buttons.push(`<button type="button" class="gallery-page-btn" data-page="next" ${nextDisabled}>다음</button>`);
  galleryPagination.innerHTML = buttons.join('');
};

const updateGalleryMore = (total) => {
  if (!galleryMoreBtn || galleryMode !== 'more') {
    if (galleryMoreBtn) galleryMoreBtn.style.display = 'none';
    return;
  }
  if (total <= galleryPageSize || galleryVisibleCount >= total) {
    galleryMoreBtn.style.display = 'none';
    return;
  }
  galleryMoreBtn.style.display = 'inline-flex';
  galleryMoreBtn.textContent = `더보기 (${galleryVisibleCount}/${total})`;
};

const renderGallery = () => {
  if (!galleryGrid) return;
  const items = getGalleryItems();
  galleryGrid.innerHTML = '';
  let startIndex = 0;
  let endIndex = items.length;
  if (galleryMode === 'pagination') {
    startIndex = (galleryCurrentPage - 1) * galleryPageSize;
    endIndex = startIndex + galleryPageSize;
  } else if (galleryMode === 'more') {
    if (galleryVisibleCount > items.length) {
      galleryVisibleCount = Math.min(items.length, galleryPageSize);
    }
    endIndex = galleryVisibleCount;
  }
  items.forEach((photo, index) => {
    if (index < startIndex || index >= endIndex) return;
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.index = String(index);
    item.innerHTML = `
      <img src="${photo.thumb || photo.url}" alt="${photo.caption}" loading="lazy" />
      <span class="gallery-caption" data-index="${index}">${photo.caption}</span>
    `;
    galleryGrid.appendChild(item);
  });
  renderGalleryPagination(items.length);
  updateGalleryMore(items.length);
};

const formatBlogDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${year}년 ${month}월 ${day}일`;
};

const makeBlogCardHTML = (post) => `
  <img class="blog-card-thumb" src="${post.thumb}" alt="${post.title}" loading="lazy" />
  <div class="blog-card-body">
    <p class="blog-card-date">${formatBlogDate(post.date)}</p>
    <h3 class="blog-card-title">${post.title}</h3>
    <p class="blog-card-excerpt">${post.excerpt}</p>
    <div class="blog-card-tags">${post.tags.map((t) => `<span class="blog-tag">${t}</span>`).join('')}</div>
  </div>
`;

const renderHomeBlog = () => {
  if (!blogHomeGrid) return;
  const posts = DEFAULT_BLOG_POSTS.slice(0, 4);
  blogHomeGrid.innerHTML = '';
  posts.forEach((post) => {
    const card = document.createElement('a');
    card.className = 'blog-card';
    card.href = `blog-post.html?id=${post.id}`;
    card.innerHTML = makeBlogCardHTML(post);
    blogHomeGrid.appendChild(card);
  });
};

const renderBlogList = () => {
  if (!blogListGrid) return;
  blogListGrid.innerHTML = '';
  DEFAULT_BLOG_POSTS.forEach((post) => {
    const card = document.createElement('a');
    card.className = 'blog-card';
    card.href = `blog-post.html?id=${post.id}`;
    card.innerHTML = makeBlogCardHTML(post);
    blogListGrid.appendChild(card);
  });
};

const renderBlogPost = () => {
  if (!blogPostContent) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const post = DEFAULT_BLOG_POSTS.find((p) => p.id === id);
  if (!post) {
    blogPostContent.innerHTML = '<p>게시글을 찾을 수 없습니다. <a href="blog.html">블로그 목록으로 돌아가기</a></p>';
    return;
  }
  document.title = `${post.title} | 후곡생활축구회`;
  blogPostContent.innerHTML = `
    <img class="blog-post-hero" src="${post.thumb}" alt="${post.title}" />
    <div class="blog-post-header">
      <div class="blog-card-tags" style="margin-bottom:12px">${post.tags.map((t) => `<span class="blog-tag">${t}</span>`).join('')}</div>
      <h1 class="blog-post-title">${post.title}</h1>
      <div class="blog-post-meta"><span>${formatBlogDate(post.date)}</span></div>
    </div>
    <div class="blog-post-content">${post.content}</div>
    <div class="blog-post-nav">
      <a class="btn ghost blog-back" href="blog.html">← 블로그 목록으로</a>
    </div>
  `;
};

const renderGalleryAdmin = () => {
  if (!photoList) return;
  const photos = loadPhotos();
  photoList.innerHTML = '';
  if (photos.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = '등록된 사진이 없습니다.';
    photoList.appendChild(empty);
    return;
  }
  photos.forEach((photo, index) => {
    const item = document.createElement('li');
    item.className = 'gallery-admin-item';
    item.innerHTML = `
      <img class="gallery-admin-thumb" src="${photo.url}" alt="${photo.caption}" loading="lazy" />
      <div class="gallery-admin-meta">
        <strong>${photo.caption}</strong>
        <span>${photo.url.startsWith('data:') ? '업로드 이미지' : photo.url}</span>
      </div>
      <div class="gallery-admin-actions">
        <button class="gallery-admin-remove" type="button" data-index="${index}">삭제</button>
      </div>
    `;
    photoList.appendChild(item);
  });
};

const getRemainingMs = () => {
  const lastActive = getLastActive();
  return lastActive ? ADMIN_TIMEOUT_MS - (Date.now() - lastActive) : 0;
};

let remainingIntervalId;

const formatRemaining = (ms) => {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const updateRemainingUI = () => {
  if (!remainingEl) return;
  if (!isAdmin()) {
    remainingEl.textContent = '';
    remainingEl.style.display = 'none';
    return;
  }
  remainingEl.textContent = `로그아웃 (${formatRemaining(getRemainingMs())})`;
  remainingEl.style.display = 'inline-flex';
};

const startRemainingTicker = () => {
  if (!remainingEl) return;
  if (remainingIntervalId) {
    clearInterval(remainingIntervalId);
    remainingIntervalId = null;
  }
  updateRemainingUI();
  if (!isAdmin()) return;
  remainingIntervalId = setInterval(updateRemainingUI, 1000);
};

const updateAdminUI = () => {
  const loggedIn = isAdmin();
  setAdminState(loggedIn);
  const adminSection = document.querySelector('#admin-members');
  if (adminSection) {
    adminSection.style.display = loggedIn ? 'block' : 'none';
  }
  if (loginForm) {
    loginForm.style.display = loggedIn ? 'none' : 'block';
  }
  if (logoutTopBtn) {
    logoutTopBtn.style.display = loggedIn ? 'inline-flex' : 'none';
  }
  startRemainingTicker();
};

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const username = form.get('username');
    const password = form.get('password');
    if (username === ADMIN_USER && password === getAdminPassword()) {
      setAdminState(true);
      setLastActive();
      updateAdminUI();
      loginForm.reset();
      renderMembers();
      return;
    }
    alert('아이디 또는 비밀번호가 올바르지 않습니다.');
  });
}

if (memberForm) {
  memberForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!isAdmin()) {
      alert('관리자 로그인 후 등록 가능합니다.');
      return;
    }
    const form = new FormData(memberForm);
    const positions = getSelectedPositions();
    const member = {
      name: String(form.get('name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      position: positions.join(', '),
      joined: String(form.get('joined') || '').trim(),
    };
    if (!member.name || !member.phone || positions.length === 0 || !member.joined) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    const members = loadMembers();
    if (Number.isInteger(editingMemberIndex) && members[editingMemberIndex]) {
      members[editingMemberIndex] = member;
      editingMemberIndex = null;
      setMemberEditMode(false);
    } else {
      members.unshift(member);
    }
    saveMembers(members);
    memberForm.reset();
    renderMembers();
    setLastActive();
  });
}

if (memberList) {
  memberList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains('member-edit') && !target.classList.contains('member-delete')) {
      return;
    }
    if (!isAdmin()) {
      alert('관리자 로그인 후 사용 가능합니다.');
      return;
    }
    const index = Number(target.dataset.index);
    if (!Number.isInteger(index)) return;
    const members = loadMembers();
    const member = members[index];
    if (!member) return;

    if (target.classList.contains('member-delete')) {
      if (confirm('선택한 회원을 삭제할까요?')) {
        members.splice(index, 1);
        saveMembers(members);
        renderMembers();
        setLastActive();
      }
      return;
    }

    if (!memberForm) return;
    memberForm.name.value = member.name;
    memberForm.phone.value = member.phone;
    memberForm.joined.value = member.joined;
    setSelectedPositions(member.position);
    editingMemberIndex = index;
    setMemberEditMode(true);
    setLastActive();
  });
}

const formatDateCaptionInput = (dateValue) => {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-');
  if (!year || !month || !day) return '';
  return `${year}년 ${month}월 ${day}일`;
};

const guessDateFromFilename = (name) => {
  if (!name) return '';
  const match = String(name).match(/(\d{4})[._-]?(\d{2})[._-]?(\d{2})/);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
};

const setCaptionFromInputs = (dateInput, noteInput, captionInput) => {
  if (!dateInput || !noteInput || !captionInput) return;
  const dateText = formatDateCaptionInput(dateInput.value);
  const note = String(noteInput.value || '').trim();
  captionInput.value = dateText && note ? `${dateText} - ${note}` : '';
};

const updatePhotoPreview = (file) => {
  if (!photoPreview) return;
  if (!file) {
    photoPreview.innerHTML = '';
    photoPreview.classList.remove('active');
    return;
  }
  const url = URL.createObjectURL(file);
  photoPreview.innerHTML = `
    <img src="${url}" alt="선택한 사진 미리보기" />
    <div>
      <strong>${file.name}</strong>
      <div>${Math.round(file.size / 1024)} KB</div>
    </div>
  `;
  photoPreview.classList.add('active');
};

const getExifDate = async (file) => {
  if (!file || !window.exifr || typeof window.exifr.parse !== 'function') return null;
  try {
    const data = await window.exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate'] });
    const value = data?.DateTimeOriginal || data?.CreateDate;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

const applyDefaultDate = async (file, dateInput) => {
  if (!file || !dateInput) return;
  const exifDate = await getExifDate(file);
  if (exifDate) {
    const year = String(exifDate.getFullYear());
    const month = String(exifDate.getMonth() + 1).padStart(2, '0');
    const day = String(exifDate.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    return;
  }
  let value = guessDateFromFilename(file.name);
  if (!value && Number.isFinite(file.lastModified)) {
    const date = new Date(file.lastModified);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    value = `${year}-${month}-${day}`;
  }
  if (value) {
    dateInput.value = value;
  }
};

if (photoForm) {
  const fileInput = photoForm.querySelector('input[name="photoFile"]');
  const dateInput = photoForm.querySelector('input[name="photoDate"]');
  const noteInput = photoForm.querySelector('input[name="photoNote"]');
  const captionInput = photoForm.querySelector('input[name="caption"]');

  if (fileInput && dateInput && noteInput && captionInput) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      updatePhotoPreview(file || null);
      if (file) {
        await applyDefaultDate(file, dateInput);
        setCaptionFromInputs(dateInput, noteInput, captionInput);
      }
    });

    dateInput.addEventListener('input', () => {
      setCaptionFromInputs(dateInput, noteInput, captionInput);
    });

    noteInput.addEventListener('input', () => {
      setCaptionFromInputs(dateInput, noteInput, captionInput);
    });
  }

  if (photoDropZone && fileInput) {
    ['dragenter', 'dragover'].forEach((evt) => {
      photoDropZone.addEventListener(evt, (event) => {
        event.preventDefault();
        photoDropZone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach((evt) => {
      photoDropZone.addEventListener(evt, (event) => {
        event.preventDefault();
        photoDropZone.classList.remove('dragover');
      });
    });
    photoDropZone.addEventListener('drop', (event) => {
      const files = event.dataTransfer?.files;
      if (!files || !files.length) return;
      fileInput.files = files;
      fileInput.dispatchEvent(new Event('change'));
    });
  }

  photoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!isAdmin()) {
      alert('관리자 로그인 후 등록 가능합니다.');
      return;
    }
    const form = new FormData(photoForm);
    const file = form.get('photoFile');
    const caption = String(form.get('caption') || '').trim();
    if (!(file instanceof File) || file.size === 0 || !caption) {
      alert('사진 파일과 날짜/내용을 입력해 주세요.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 등록할 수 있습니다.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      const proceed = confirm('파일이 2MB를 초과합니다. 그래도 등록할까요?');
      if (!proceed) return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '').trim();
      if (!url) {
        alert('이미지 로딩에 실패했습니다.');
        return;
      }
      const photos = loadPhotos();
      photos.unshift({ url, caption });
      savePhotos(photos);
      photoForm.reset();
      updatePhotoPreview(null);
      if (captionInput) captionInput.value = '';
      renderGalleryAdmin();
      renderGallery();
      setLastActive();
    };
    reader.onerror = () => {
      alert('이미지 로딩에 실패했습니다.');
    };
    reader.readAsDataURL(file);
  });
}

if (photoList) {
  photoList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains('gallery-admin-remove')) return;
    if (!isAdmin()) {
      alert('관리자 로그인 후 사용 가능합니다.');
      return;
    }
    const index = Number(target.dataset.index);
    if (!Number.isInteger(index)) return;
    const photos = loadPhotos();
    photos.splice(index, 1);
    savePhotos(photos);
    renderGalleryAdmin();
    renderGallery();
    setLastActive();
  });
}

if (clearGalleryBtn) {
  clearGalleryBtn.addEventListener('click', () => {
    if (!isAdmin()) {
      alert('관리자 로그인 후 사용 가능합니다.');
      return;
    }
    if (confirm('갤러리 사진을 모두 삭제할까요?')) {
      savePhotos([]);
      renderGalleryAdmin();
      renderGallery();
      setLastActive();
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    setAdminState(false);
    updateAdminUI();
    if (document.body.classList.contains('admin-page')) {
      window.location.href = 'index.html';
    }
  });
}

if (logoutTopBtn) {
  logoutTopBtn.addEventListener('click', () => {
    setAdminState(false);
    updateAdminUI();
    if (document.body.classList.contains('admin-page')) {
      window.location.href = 'index.html';
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (!isAdmin()) {
      alert('관리자 로그인 후 사용 가능합니다.');
      return;
    }
    if (!confirm('회원 목록을 모두 초기화할까요?')) {
      return;
    }
    if (confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      saveMembers([]);
      renderMembers();
      editingMemberIndex = null;
      if (memberForm) {
        memberForm.reset();
      }
      setMemberEditMode(false);
    }
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!isAdmin()) {
      alert('관리자 로그인 후 변경 가능합니다.');
      return;
    }
    const form = new FormData(passwordForm);
    const currentPassword = String(form.get('currentPassword') || '').trim();
    const newPassword = String(form.get('newPassword') || '').trim();
    const confirmPassword = String(form.get('confirmPassword') || '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    if (currentPassword !== getAdminPassword()) {
      alert('현재 비밀번호가 올바르지 않습니다.');
      return;
    }
    if (newPassword.length < 4) {
      alert('새 비밀번호는 4자 이상으로 입력해 주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setAdminPassword(newPassword);
    passwordForm.reset();
    alert('비밀번호가 변경되었습니다.');
  });
}

clearStoredPhotos();
updateAdminUI();
renderMembers();
renderGallery();
renderGalleryAdmin();
renderHomeBlog();
renderBlogList();
renderBlogPost();
fetchWeeklySchedule();
guardAdminNavLinks();
enforceAdminAccess();

let galleryModal;
const ensureGalleryModal = () => {
  if (galleryModal) return galleryModal;
  const modal = document.createElement('div');
  modal.className = 'gallery-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="gallery-modal-backdrop" data-close="true"></div>
    <div class="gallery-modal-content" role="dialog" aria-modal="true">
      <button class="gallery-modal-close" type="button" aria-label="닫기" data-close="true">닫기</button>
      <img alt="" />
      <p class="gallery-modal-caption"></p>
    </div>
  `;
  document.body.appendChild(modal);
  galleryModal = modal;
  return modal;
};

const openGalleryModal = (photo) => {
  if (!photo) return;
  const modal = ensureGalleryModal();
  const image = modal.querySelector('img');
  const caption = modal.querySelector('.gallery-modal-caption');
  if (image) {
    image.src = photo.url;
    image.alt = photo.caption;
  }
  if (caption) {
    caption.textContent = photo.caption;
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
};

const closeGalleryModal = () => {
  if (!galleryModal) return;
  galleryModal.classList.remove('open');
  galleryModal.setAttribute('aria-hidden', 'true');
};

if (galleryGrid) {
  galleryGrid.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.classList.contains('gallery-caption')) {
      if (!isAdmin()) {
        alert('관리자 로그인 후 수정 가능합니다.');
        return;
      }
      const index = Number(target.dataset.index);
      if (!Number.isInteger(index)) return;
      const items = getGalleryItems();
      const current = items[index];
      if (!current) return;
      const nextCaption = prompt('캡션을 수정해 주세요.', current.caption);
      if (nextCaption === null) return;
      const trimmed = String(nextCaption).trim();
      if (!trimmed) {
        alert('캡션을 입력해 주세요.');
        return;
      }
      const photos = loadPhotos();
      if (photos.length === 0) {
        photos.push(...items.map((item) => ({ ...item })));
      }
      if (!photos[index]) return;
      photos[index].caption = trimmed;
      savePhotos(photos);
      renderGalleryAdmin();
      renderGallery();
      setLastActive();
      return;
    }
    const item = target.closest('.gallery-item');
    if (!item || !galleryGrid.contains(item)) return;
    const index = Number(item.dataset.index);
    if (!Number.isInteger(index)) return;
    const items = getGalleryItems();
    openGalleryModal(items[index]);
  });
}

if (galleryPagination) {
  galleryPagination.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('button[data-page]');
    if (!button || !(button instanceof HTMLButtonElement)) return;
    const value = button.dataset.page;
    if (!value) return;
    const items = getGalleryItems();
    const totalPages = Math.max(1, Math.ceil(items.length / galleryPageSize));
    if (value === 'prev') {
      galleryCurrentPage = Math.max(1, galleryCurrentPage - 1);
    } else if (value === 'next') {
      galleryCurrentPage = Math.min(totalPages, galleryCurrentPage + 1);
    } else {
      const page = Number(value);
      if (Number.isInteger(page)) {
        galleryCurrentPage = Math.min(totalPages, Math.max(1, page));
      }
    }
    renderGallery();
  });
}

if (galleryMoreBtn) {
  galleryMoreBtn.addEventListener('click', () => {
    if (galleryMode !== 'more') return;
    const items = getGalleryItems();
    galleryVisibleCount = Math.min(items.length, galleryVisibleCount + galleryPageSize);
    renderGallery();
  });
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!galleryModal) return;
  if (!galleryModal.classList.contains('open')) return;
  if (target.dataset.close === 'true') {
    closeGalleryModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  closeGalleryModal();
});

const logoutDueToTimeout = () => {
  setAdminState(false);
  updateAdminUI();
  alert('관리자 로그인 시간이 만료되어 로그아웃되었습니다.');
};

let warnTimeoutId;
let logoutTimeoutId;
let warnDismissedForLastActive = null;

const clearSessionTimers = () => {
  if (warnTimeoutId) {
    clearTimeout(warnTimeoutId);
    warnTimeoutId = null;
  }
  if (logoutTimeoutId) {
    clearTimeout(logoutTimeoutId);
    logoutTimeoutId = null;
  }
};

const scheduleSessionTimers = () => {
  clearSessionTimers();
  if (!isAdmin()) return;
  const remaining = getRemainingMs();
  if (remaining <= 0) {
    logoutDueToTimeout();
    return;
  }

  const warnIn = Math.max(0, remaining - ADMIN_WARN_MS);
  const lastActive = getLastActive();
  if (warnDismissedForLastActive !== lastActive) {
    warnTimeoutId = setTimeout(() => {
      if (!isAdmin()) return;
      const extend = confirm('로그인 만료가 2분 남았습니다. 연장하시겠습니까?');
      if (extend) {
        warnDismissedForLastActive = null;
        setLastActive();
        scheduleSessionTimers();
        return;
      }
      warnDismissedForLastActive = getLastActive();
    }, warnIn);
  }

  logoutTimeoutId = setTimeout(() => {
    if (!isAdmin()) return;
    logoutDueToTimeout();
  }, remaining);
};

const adminMain = document.querySelector('main');
const handleAdminActivity = (event) => {
  if (!isAdmin()) return;
  if (!document.body.classList.contains('admin-page')) return;
  if (!adminMain) return;
  const target = event?.target;
  if (!(target instanceof Element)) return;
  if (!adminMain.contains(target)) return;
  setLastActive();
  scheduleSessionTimers();
};

if (adminMain) {
  ['click', 'keydown', 'input', 'submit'].forEach((evt) => {
    adminMain.addEventListener(evt, handleAdminActivity);
  });
}

if (isAdmin()) {
  scheduleSessionTimers();
}

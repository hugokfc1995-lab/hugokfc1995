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

const DEFAULT_PHOTOS = DEFAULT_GALLERY_FILES.map((file) => {
  const dateCaption = formatDateCaption(file);
  const detail = DEFAULT_GALLERY_CAPTIONS[file];
  return {
    url: `images/gallery/${file}`,
    caption: detail ? `${dateCaption} - ${detail}` : dateCaption,
  };
});

const loginForm = document.querySelector('#admin-login-form');
const memberForm = document.querySelector('#member-form');
const memberSubmitBtn = memberForm ? memberForm.querySelector('button[type="submit"]') : null;
const memberList = document.querySelector('#member-list');
const logoutBtn = document.querySelector('#admin-logout');
const logoutTopBtn = document.querySelector('#admin-logout-top');
const remainingEl = document.querySelector('#admin-logout-top');
const galleryGrid = document.querySelector('#gallery-grid');
const galleryPagination = document.querySelector('#gallery-pagination');
const photoForm = document.querySelector('#gallery-form');
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

let galleryCurrentPage = 1;

const renderGalleryPagination = (total) => {
  if (!galleryPagination) return;
  const totalPages = Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE));
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

const renderGallery = () => {
  if (!galleryGrid) return;
  const items = getGalleryItems();
  galleryGrid.innerHTML = '';
  const startIndex = (galleryCurrentPage - 1) * GALLERY_PAGE_SIZE;
  const endIndex = startIndex + GALLERY_PAGE_SIZE;
  items.forEach((photo, index) => {
    if (index < startIndex || index >= endIndex) return;
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.index = String(index);
    item.innerHTML = `
      <img src="${photo.url}" alt="${photo.caption}" loading="lazy" />
      <span class="gallery-caption" data-index="${index}">${photo.caption}</span>
    `;
    galleryGrid.appendChild(item);
  });
  renderGalleryPagination(items.length);
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

if (photoForm) {
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
      alert('사진 파일과 캡션을 입력해 주세요.');
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
    const totalPages = Math.max(1, Math.ceil(items.length / GALLERY_PAGE_SIZE));
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
  warnTimeoutId = setTimeout(() => {
    if (!isAdmin()) return;
    const extend = confirm('로그인 만료가 2분 남았습니다. 연장하시겠습니까?');
    if (extend) {
      setLastActive();
      scheduleSessionTimers();
    }
  }, warnIn);

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

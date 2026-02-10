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
const MAX_GALLERY_ITEMS = 16;
const DEFAULT_PHOTOS = Array.from({ length: 16 }, (_, index) => ({
  url: `https://picsum.photos/seed/hugok-${index + 1}/800/600`,
  caption: `활동 스냅 ${index + 1}`,
}));

const loginForm = document.querySelector('#admin-login-form');
const memberForm = document.querySelector('#member-form');
const memberSubmitBtn = memberForm ? memberForm.querySelector('button[type="submit"]') : null;
const memberList = document.querySelector('#member-list');
const logoutBtn = document.querySelector('#admin-logout');
const logoutTopBtn = document.querySelector('#admin-logout-top');
const remainingEl = document.querySelector('#admin-logout-top');
const galleryGrid = document.querySelector('#gallery-grid');
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
  if (saved.length === 0) return DEFAULT_PHOTOS.slice(0, MAX_GALLERY_ITEMS);
  const merged = saved.slice(0, MAX_GALLERY_ITEMS);
  if (merged.length < MAX_GALLERY_ITEMS) {
    merged.push(...DEFAULT_PHOTOS.slice(0, MAX_GALLERY_ITEMS - merged.length));
  }
  return merged;
};

const renderGallery = () => {
  if (!galleryGrid) return;
  const items = getGalleryItems();
  galleryGrid.innerHTML = '';
  items.forEach((photo) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${photo.url}" alt="${photo.caption}" loading="lazy" />
      <span>${photo.caption}</span>
    `;
    galleryGrid.appendChild(item);
  });
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
        <span>${photo.url}</span>
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
    const url = String(form.get('photoUrl') || '').trim();
    const caption = String(form.get('caption') || '').trim();
    if (!url || !caption) {
      alert('사진 URL과 캡션을 입력해 주세요.');
      return;
    }
    const photos = loadPhotos();
    photos.unshift({ url, caption });
    savePhotos(photos);
    photoForm.reset();
    renderGalleryAdmin();
    renderGallery();
    setLastActive();
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
      window.location.href = '/index.html';
    }
  });
}

if (logoutTopBtn) {
  logoutTopBtn.addEventListener('click', () => {
    setAdminState(false);
    updateAdminUI();
    if (document.body.classList.contains('admin-page')) {
      window.location.href = '/index.html';
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

updateAdminUI();
renderMembers();
renderGallery();
renderGalleryAdmin();

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

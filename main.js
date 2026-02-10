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

const loginForm = document.querySelector('#admin-login-form');
const memberForm = document.querySelector('#member-form');
const memberList = document.querySelector('#member-list');
const logoutBtn = document.querySelector('#admin-logout');
const clearBtn = document.querySelector('#clear-members');
const passwordForm = document.querySelector('#admin-password-form');

const setAdminState = (loggedIn) => {
  localStorage.setItem(ADMIN_KEY, loggedIn ? 'true' : 'false');
  document.body.classList.toggle('admin-logged-in', loggedIn);
};

const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'true';

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
  members.forEach((member) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${member.name}</strong>
      <span>연락처: ${member.phone}</span>
      <span>포지션: ${member.position}</span>
      <span>가입일: ${member.joined}</span>
    `;
    memberList.appendChild(item);
  });
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
};

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const username = form.get('username');
    const password = form.get('password');
    if (username === ADMIN_USER && password === getAdminPassword()) {
      setAdminState(true);
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
    const member = {
      name: String(form.get('name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      position: String(form.get('position') || '').trim(),
      joined: String(form.get('joined') || '').trim(),
    };
    if (!member.name || !member.phone || !member.position || !member.joined) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    const members = loadMembers();
    members.unshift(member);
    saveMembers(members);
    memberForm.reset();
    renderMembers();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    setAdminState(false);
    updateAdminUI();
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (!isAdmin()) {
      alert('관리자 로그인 후 사용 가능합니다.');
      return;
    }
    if (confirm('회원 목록을 모두 초기화할까요?')) {
      saveMembers([]);
      renderMembers();
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

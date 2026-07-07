(function () {
  const backendBase = 'https://emrs-dornalaa.onrender.com';
  const apiBase = `${backendBase}/api`;
  const classKey = document.body.dataset.classKey;

  const titleEl = document.getElementById('resultTitle');
  const subtitleEl = document.getElementById('resultSubtitle');
  const toppersBody = document.getElementById('toppersBody');
  const meritBody = document.getElementById('meritBody');
  const studentsBody = document.getElementById('studentsBody');
  const statusEl = document.getElementById('resultStatus');

  const studentForm = document.getElementById('studentResultForm');
  const studentResultWrap = document.getElementById('studentResultWrap');

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeUrl(url) {
    if (!url) return '';
    const value = String(url);
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    if (value.startsWith('/')) return `${backendBase}${value}`;
    return `${backendBase}/uploads/${value.replace(/^\/+/, '')}`;
  }

  function renderPeopleTable(bodyEl, rows, type) {
    if (!rows.length) {
      bodyEl.innerHTML = `<tr><td colspan="4">No ${type} published.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = rows.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(item.name || '')}</td>
        <td>${esc(item.rank || '')}</td>
        <td>${esc(item.marks || '')}</td>
      </tr>
    `).join('');
  }

  function renderStudentsTable(rows) {
    if (!studentsBody) return;
    if (!rows.length) {
      studentsBody.innerHTML = '<tr><td colspan="6">No student entries uploaded.</td></tr>';
      return;
    }

    studentsBody.innerHTML = rows.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(item.name || '')}</td>
        <td>${esc(item.roll_no || '')}</td>
        <td>${esc(item.dob || '')}</td>
        <td>${esc(item.marks || '')}</td>
        <td>${esc(item.percentage || '')}</td>
      </tr>
    `).join('');
  }

  async function loadResultPage() {
    const clearTables = () => {
      toppersBody.innerHTML = '<tr><td colspan="4">No toppers published.</td></tr>';
      meritBody.innerHTML = '<tr><td colspan="4">No merit list published.</td></tr>';
      if (studentsBody) {
        studentsBody.innerHTML = '<tr><td colspan="6">No student entries uploaded.</td></tr>';
      }
    };

    try {
      const res = await fetch(`${apiBase}/results/public/${classKey}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        statusEl.textContent = data.detail || 'Result is not available.';
        statusEl.classList.remove('d-none');
        clearTables();
        return;
      }

      const data = await res.json();
      titleEl.textContent = data.title || titleEl.textContent;
      subtitleEl.textContent = data.subtitle || subtitleEl.textContent;
      renderPeopleTable(toppersBody, Array.isArray(data.toppers) ? data.toppers : [], 'toppers');
      renderPeopleTable(meritBody, Array.isArray(data.merit_list) ? data.merit_list : [], 'merit list');
      renderStudentsTable(Array.isArray(data.students) ? data.students : []);
    } catch (error) {
      statusEl.textContent = 'Unable to load result details right now.';
      statusEl.classList.remove('d-none');
      clearTables();
    }
  }

  function renderStudentResult(student, className) {
    studentResultWrap.innerHTML = `
      <div class="card mt-3">
        <div class="card-body">
          <h5 class="card-title mb-3">Individual Result</h5>
          <table class="table table-bordered table-sm mb-3">
            <tr><th>Name</th><td>${esc(student.name)}</td></tr>
            <tr><th>Roll Number</th><td>${esc(student.roll_no)}</td></tr>
            <tr><th>Class</th><td>${esc(student.class_name || className)}</td></tr>
            <tr><th>Date of Birth</th><td>${esc(student.dob)}</td></tr>
            <tr><th>Marks</th><td>${esc(student.marks)}</td></tr>
            <tr><th>Percentage</th><td>${esc(student.percentage)}</td></tr>
          </table>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" onclick="window.print()">Print</button>
            <button class="btn btn-sm btn-outline-secondary" id="downloadIndividualBtn">Download</button>
          </div>
        </div>
      </div>
    `;

    const dlBtn = document.getElementById('downloadIndividualBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        const lines = [
          `Name: ${student.name}`,
          `Roll Number: ${student.roll_no}`,
          `Class: ${student.class_name || className}`,
          `Date of Birth: ${student.dob}`,
          `Marks: ${student.marks}`,
          `Percentage: ${student.percentage}`,
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `result-${student.roll_no || 'student'}.txt`;
        link.click();
      });
    }
  }

  if (studentForm) {
    studentForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const rollNo = document.getElementById('studentRollNo').value.trim();
      const dob = document.getElementById('studentDob').value;
      studentResultWrap.innerHTML = '';
      if (!rollNo || !dob) return;

      try {
        const url = `${apiBase}/results/public/${classKey}/student?roll_no=${encodeURIComponent(rollNo)}&dob=${encodeURIComponent(dob)}`;
        const res = await fetch(url);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          studentResultWrap.innerHTML = `<div class="alert alert-warning mt-3">${esc(payload.detail || 'No result found.')}</div>`;
          return;
        }
        const data = await res.json();
        renderStudentResult(data.student || {}, data.class_name || '');
      } catch (error) {
        studentResultWrap.innerHTML = '<div class="alert alert-danger mt-3">Unable to fetch student result.</div>';
      }
    });
  }

  loadResultPage();
})();

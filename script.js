'use strict';

/* =========================================================
   1. SAMPLE JOB DATA
   The jobs are stored as a JSON string, just like API data.
   ========================================================= */
const jobsJson = JSON.stringify([
  {
    id: 'job-1',
    title: 'Responsive Website Redesign',
    company: 'Northstar Studio',
    category: 'Web Design',
    budget: 650,
    skills: ['HTML', 'CSS', 'Responsive Design', 'Figma'],
    description: 'Redesign a small business website across desktop, tablet and mobile. Deliver a clickable Figma prototype and a clean responsive build.'
  },
  {
    id: 'job-2',
    title: 'SEO Blog Writer',
    company: 'BrightWords Media',
    category: 'Content Writing',
    budget: 320,
    skills: ['Content Writing', 'SEO', 'Research', 'Grammar'],
    description: 'Write four 1,000-word blog posts about personal finance. Include keyword research, a clear outline and basic on-page SEO.'
  },
  {
    id: 'job-3',
    title: 'Product Data Entry Specialist',
    company: 'DataNest Solutions',
    category: 'Data Entry',
    budget: 180,
    skills: ['Data Entry', 'Excel', 'Attention to Detail', 'Typing'],
    description: 'Enter and clean 500 product records in a spreadsheet. Verify prices, categories and images, and flag missing information.'
  },
  {
    id: 'job-4',
    title: 'Social Media Design Pack',
    company: 'PixelHouse',
    category: 'Graphic Design',
    budget: 280,
    skills: ['Graphic Design', 'Photoshop', 'Canva', 'Branding'],
    description: 'Create a set of 12 on-brand social media templates for a local cafe, including post and story layouts.'
  },
  {
    id: 'job-5',
    title: 'Flutter Mobile App Prototype',
    company: 'AppOrbit Labs',
    category: 'App Development',
    budget: 1200,
    skills: ['Flutter', 'Dart', 'UI Design', 'API Integration'],
    description: 'Build a two-screen Flutter prototype for a habit tracker. Connect a simple REST API and provide a short handover document.'
  },
  {
    id: 'job-6',
    title: 'YouTube Video Editor',
    company: 'CreatorCraft',
    category: 'Video Editing',
    budget: 400,
    skills: ['Video Editing', 'Premiere Pro', 'Storytelling', 'Color Grading'],
    description: 'Edit three eight-minute YouTube videos for a tech channel. Add captions, simple motion graphics, sound balancing and colour correction.'
  },
  {
    id: 'job-7',
    title: 'Social Media Campaign Manager',
    company: 'GrowLoop Agency',
    category: 'Digital Marketing',
    budget: 550,
    skills: ['Digital Marketing', 'Social Media', 'Analytics', 'Content Strategy'],
    description: 'Plan and run a two-week Instagram campaign for a fitness studio. Provide a content calendar, post copy and a short performance report.'
  },
  {
    id: 'job-8',
    title: 'Landing Page Developer',
    company: 'LaunchPad Digital',
    category: 'Web Development',
    budget: 700,
    skills: ['JavaScript', 'HTML', 'CSS', 'Web Development'],
    description: 'Develop a responsive landing page from an existing design. Add a pricing toggle, a contact form and basic scroll animations without frameworks.'
  },
  {
    id: 'job-9',
    title: 'Technical Documentation Writer',
    company: 'CloudMint',
    category: 'Content Writing',
    budget: 480,
    skills: ['Technical Writing', 'Research', 'Markdown', 'Editing'],
    description: 'Rewrite an API onboarding guide for new developers. Organise the content clearly, update code examples and improve the setup instructions.'
  },
  {
    id: 'job-10',
    title: 'Mobile App UX Audit',
    company: 'Bluebird Health',
    category: 'UI/UX Design',
    budget: 520,
    skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
    description: 'Review a wellbeing app onboarding and dashboard. Identify usability issues, run a small user test and deliver prioritised Figma recommendations.'
  }
]);

/* =========================================================
   2. CONSTANTS, STATE AND ELEMENT CACHE
   ========================================================= */
const STORAGE_KEYS = {
  profile: 'skillbridge-profile',
  savedJobs: 'skillbridge-saved-jobs',
  postedJobs: 'skillbridge-posted-jobs',
  lastSearch: 'skillbridge-last-search'
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^[0-9+\s()-]{7,15}$/;

let allJobs = [];
let jobsLoaded = false;
let userProfile = readStorage(STORAGE_KEYS.profile, null);
let savedJobIds = readStorage(STORAGE_KEYS.savedJobs, []);
let postedJobs = readStorage(STORAGE_KEYS.postedJobs, []);

// Make sure older or broken storage values do not crash the page.
if (!Array.isArray(savedJobIds)) {
  savedJobIds = [];
}

if (!Array.isArray(postedJobs)) {
  postedJobs = [];
}

const elements = {
  jobSearch: document.getElementById('job-search'),
  suggestions: document.getElementById('search-suggestions'),
  categoryFilter: document.getElementById('category-filter'),
  jobsStatus: document.getElementById('jobs-status'),
  jobsError: document.getElementById('jobs-error'),
  jobCount: document.getElementById('job-count'),
  jobList: document.getElementById('job-list'),
  profileForm: document.getElementById('profile-form'),
  profileName: document.getElementById('profile-name'),
  profileEmail: document.getElementById('profile-email'),
  profilePhone: document.getElementById('profile-phone'),
  profileExperience: document.getElementById('profile-experience'),
  profileSkills: document.getElementById('profile-skills'),
  profileCategory: document.getElementById('profile-category'),
  profileBio: document.getElementById('profile-bio'),
  profileSummary: document.getElementById('profile-summary'),
  recommendationList: document.getElementById('recommendation-list'),
  recommendationIntro: document.getElementById('recommendation-intro'),
  matchSummary: document.getElementById('match-summary'),
  comparisonBody: document.getElementById('comparison-body'),
  postJobForm: document.getElementById('post-job-form'),
  postTitle: document.getElementById('post-title'),
  postCompany: document.getElementById('post-company'),
  postCategory: document.getElementById('post-category'),
  postBudget: document.getElementById('post-budget'),
  postSkills: document.getElementById('post-skills'),
  postDescription: document.getElementById('post-description'),
  toastContainer: document.getElementById('toast-container')
};

/* =========================================================
   3. JOB CLASS AND MATCHING LOGIC
   ========================================================= */
class Job {
  constructor(jobData) {
    this.id = jobData.id;
    this.title = jobData.title;
    this.company = jobData.company;
    this.category = jobData.category;
    this.budget = Number(jobData.budget) || 0;
    this.skills = Array.isArray(jobData.skills) ? jobData.skills : [];
    this.description = jobData.description;
    this.posted = Boolean(jobData.posted);
  }

  // Compare the job skills with the freelancer skills.
  getMatch(userSkills = []) {
    const cleanUserSkills = userSkills.map((skill) => skill.trim().toLowerCase());

    const matchedSkills = this.skills.filter((skill) =>
      cleanUserSkills.includes(skill.trim().toLowerCase())
    );

    const missingSkills = this.skills.filter((skill) =>
      !cleanUserSkills.includes(skill.trim().toLowerCase())
    );

    const percentage = this.skills.length === 0
      ? 0
      : Math.round((matchedSkills.length / this.skills.length) * 100);

    return { percentage, matchedSkills, missingSkills };
  }

  formatBudget() {
    return `$${this.budget.toLocaleString('en-US')}`;
  }
}

/* =========================================================
   4. STORAGE HELPERS
   ========================================================= */
function readStorage(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue === null ? fallback : JSON.parse(storedValue);
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    showToast('Your browser could not save this data.', 'error');
    return false;
  }
}

function readSession(key, fallback) {
  try {
    return sessionStorage.getItem(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function saveLastSearch(term) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.lastSearch, term);
  } catch (error) {
    // The page still works if session storage is blocked.
  }
}

function getProfileSkills() {
  return Array.isArray(userProfile?.skills) ? userProfile.skills : [];
}

/* =========================================================
   5. LOAD JOBS (simulated async fetch)
   ========================================================= */
function fetchSampleJobs() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const parsedJobs = JSON.parse(jobsJson);

        if (!Array.isArray(parsedJobs) || parsedJobs.length === 0) {
          throw new Error('No jobs were found.');
        }

        resolve(parsedJobs);
      } catch (error) {
        reject(error);
      }
    }, 700);
  });
}

async function loadJobs() {
  elements.jobsStatus.hidden = false;
  elements.jobsStatus.innerHTML = '<span class="loading-spinner" aria-hidden="true"></span> Loading sample jobs...';
  elements.jobsError.hidden = true;
  elements.jobCount.textContent = '';

  try {
    const jobData = await fetchSampleJobs();
    const sampleJobs = jobData.map((jobItem) => new Job(jobItem));

    // Read posted jobs again so the page stays in sync if storage changed.
    postedJobs = readStorage(STORAGE_KEYS.postedJobs, []);
    if (!Array.isArray(postedJobs)) {
      postedJobs = [];
    }

    const savedPosts = postedJobs.map((jobItem) => new Job({ ...jobItem, posted: true }));
    allJobs = [...savedPosts, ...sampleJobs];
    jobsLoaded = true;

    renderJobs();
    renderRecommendations();
  } catch (error) {
    jobsLoaded = false;
    elements.jobsError.hidden = false;
    elements.jobsError.textContent = 'Sorry, the job list could not be loaded. Please refresh the page and try again.';
    elements.jobCount.textContent = '';
    elements.jobList.innerHTML = `
      <div class="empty-state">
        <h3>Jobs unavailable</h3>
        <p>The sample jobs could not be loaded right now.</p>
      </div>
    `;
    showToast('The job list could not be loaded.', 'error');
  } finally {
    elements.jobsStatus.hidden = true;
  }
}

/* =========================================================
   6. RENDER JOB CARDS
   ========================================================= */
function escapeHTML(value) {
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return String(value ?? '').replace(/[&<>"']/g, (character) => replacements[character]);
}

function createJobCard(job, profileSkills) {
  const { title, company, category, skills, description, posted } = job;
  const match = job.getMatch(profileSkills);
  const hasProfile = profileSkills.length > 0;
  const isSaved = savedJobIds.includes(job.id);

  const skillTags = skills.map((skill) => {
    const isMatched = hasProfile && match.matchedSkills.includes(skill);
    return `<li class="skill-tag${isMatched ? ' matched' : ''}">${escapeHTML(skill)}</li>`;
  }).join('');

  const matchMarkup = hasProfile
    ? `<div class="job-card-match"><span>Smart Match</span><strong>${match.percentage}%</strong></div>`
    : '<div class="job-card-match"><span>Smart Match</span><a href="#profile">Add skills to see your score</a></div>';

  return `
    <article class="job-card" data-job-id="${escapeHTML(job.id)}">
      <div class="job-card-top">
        <div class="job-card-tags">
          <span class="category-tag">${escapeHTML(category)}</span>
          ${posted ? '<span class="posted-badge">Posted by you</span>' : ''}
        </div>
        <span class="budget-tag">${job.formatBudget()}</span>
      </div>
      <h3>${escapeHTML(title)}</h3>
      <p class="job-company">${escapeHTML(company)}</p>
      <p class="job-description">${escapeHTML(description)}</p>
      <ul class="skill-list" aria-label="Required skills">${skillTags}</ul>
      ${matchMarkup}
      <div class="job-card-actions">
        <button class="btn btn-small btn-ghost" type="button" data-action="save" aria-pressed="${isSaved}">
          ${isSaved ? 'Saved' : 'Save job'}
        </button>
        <button class="btn btn-small btn-primary" type="button" data-action="apply">Apply</button>
      </div>
    </article>
  `;
}

function renderJobs() {
  if (!jobsLoaded) {
    return;
  }

  const searchTerm = elements.jobSearch.value.trim().toLowerCase();
  const selectedCategory = elements.categoryFilter.value;
  const profileSkills = getProfileSkills();

  const filteredJobs = allJobs.filter((job) => {
    const searchableText = `${job.title} ${job.company} ${job.category} ${job.skills.join(' ')} ${job.description}`.toLowerCase();
    const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // If a profile exists, show the best matches first.
  if (profileSkills.length > 0) {
    filteredJobs.sort((jobA, jobB) => {
      return jobB.getMatch(profileSkills).percentage - jobA.getMatch(profileSkills).percentage;
    });
  }

  const searchNote = searchTerm ? ` for "${elements.jobSearch.value.trim()}"` : '';
  const categoryNote = selectedCategory !== 'All' ? ` in ${selectedCategory}` : '';
  elements.jobCount.textContent = `${filteredJobs.length} job${filteredJobs.length === 1 ? '' : 's'} found${searchNote}${categoryNote}.`;

  if (filteredJobs.length === 0) {
    elements.jobList.innerHTML = `
      <div class="empty-state">
        <h3>No jobs found</h3>
        <p>Try a different keyword or choose “All categories”.</p>
      </div>
    `;
    return;
  }

  elements.jobList.innerHTML = filteredJobs
    .map((job) => createJobCard(job, profileSkills))
    .join('');
}

/* =========================================================
   7. SAVE AND APPLY ACTIONS (event delegation)
   ========================================================= */
function toggleSavedJob(job) {
  const isSaved = savedJobIds.includes(job.id);

  if (isSaved) {
    savedJobIds = savedJobIds.filter((savedId) => savedId !== job.id);
    showToast(`Removed “${job.title}” from saved jobs.`, 'info');
  } else {
    savedJobIds.push(job.id);
    showToast(`Saved “${job.title}” for later.`, 'success');
  }

  writeStorage(STORAGE_KEYS.savedJobs, savedJobIds);
  renderJobs();
}

function applyToJob(job) {
  const greeting = userProfile?.name
    ? `Thanks, ${userProfile.name.split(' ')[0]}!`
    : 'Application noted!';

  showToast(`${greeting} Your interest in “${job.title}” at ${job.company} is recorded. This demo does not send real applications.`, 'success');
}

function handleJobBoardClick(event) {
  const actionButton = event.target.closest('button[data-action]');

  if (!actionButton) {
    return;
  }

  const jobCard = actionButton.closest('.job-card');
  const jobId = jobCard?.dataset.jobId;
  const selectedJob = allJobs.find((job) => job.id === jobId);

  if (!selectedJob) {
    return;
  }

  if (actionButton.dataset.action === 'save') {
    toggleSavedJob(selectedJob);
  }

  if (actionButton.dataset.action === 'apply') {
    applyToJob(selectedJob);
  }
}

/* =========================================================
   8. SEARCH, AUTO-SUGGESTIONS AND DEBOUNCE
   ========================================================= */
function debounce(callback, delay) {
  let timerId;

  return function debouncedFunction(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => callback(...args), delay);
  };
}

function hideSuggestions() {
  elements.suggestions.hidden = true;
  elements.suggestions.innerHTML = '';
  elements.jobSearch.setAttribute('aria-expanded', 'false');
}

function updateSuggestions() {
  const term = elements.jobSearch.value.trim().toLowerCase();

  if (!jobsLoaded || term.length < 2) {
    hideSuggestions();
    return;
  }

  const suggestions = [];

  allJobs.forEach((job) => {
    const candidates = [job.title, job.company, ...job.skills];

    candidates.forEach((candidate) => {
      const alreadyAdded = suggestions.some((item) =>
        item.toLowerCase() === candidate.toLowerCase()
      );

      if (candidate.toLowerCase().includes(term) && !alreadyAdded && suggestions.length < 6) {
        suggestions.push(candidate);
      }
    });
  });

  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }

  elements.suggestions.innerHTML = suggestions.map((suggestion) => `
    <li>
      <button class="suggestion-item" type="button" data-suggestion="true">
        ${escapeHTML(suggestion)}
      </button>
    </li>
  `).join('');

  elements.suggestions.hidden = false;
  elements.jobSearch.setAttribute('aria-expanded', 'true');
}

const handleSearchInput = debounce(() => {
  renderJobs();
  updateSuggestions();
}, 300);

function chooseSuggestion(event) {
  const suggestionButton = event.target.closest('button[data-suggestion]');

  if (!suggestionButton) {
    return;
  }

  elements.jobSearch.value = suggestionButton.textContent.trim();
  saveLastSearch(elements.jobSearch.value);
  hideSuggestions();
  renderJobs();
  elements.jobSearch.focus();
}

/* =========================================================
   9. PROFILE FORM VALIDATION AND SAVING
   ========================================================= */
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorBox = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  if (errorBox) {
    errorBox.textContent = message;
  }
}

function clearFormErrors(form) {
  form.querySelectorAll('.field-error').forEach((errorBox) => {
    errorBox.textContent = '';
  });

  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.setAttribute('aria-invalid', 'false');
  });
}

function focusFirstError(fieldId) {
  if (fieldId === 'profile-availability') {
    elements.profileForm.querySelector('input[name="availability"]')?.focus();
    return;
  }

  document.getElementById(fieldId)?.focus();
}

function splitSkills(value) {
  const skills = value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  return [...new Set(skills)];
}

function handleProfileSubmit(event) {
  event.preventDefault();
  clearFormErrors(elements.profileForm);

  const name = elements.profileName.value.trim();
  const email = elements.profileEmail.value.trim();
  const phone = elements.profilePhone.value.trim();
  const experienceValue = elements.profileExperience.value.trim();
  const experience = Number(experienceValue);
  const skills = splitSkills(elements.profileSkills.value);
  const preferredCategory = elements.profileCategory.value;
  const bio = elements.profileBio.value.trim();
  const availabilityField = elements.profileForm.querySelector('input[name="availability"]:checked');
  const availability = availabilityField?.value || '';
  const phoneDigits = phone.replace(/\D/g, '');
  const errors = {};

  if (name.length < 2) {
    errors['profile-name'] = 'Enter your full name (at least 2 characters).';
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors['profile-email'] = 'Enter a valid email address, like name@example.com.';
  }

  if (!PHONE_PATTERN.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors['profile-phone'] = 'Use 7 to 15 digits. Spaces, +, - and brackets are allowed.';
  }

  if (experienceValue === '' || Number.isNaN(experience) || experience < 0 || experience > 40) {
    errors['profile-experience'] = 'Enter experience between 0 and 40 years.';
  }

  if (skills.length === 0) {
    errors['profile-skills'] = 'Add at least one skill, separated by commas.';
  }

  if (!preferredCategory) {
    errors['profile-category'] = 'Choose your preferred category.';
  }

  if (!availability) {
    errors['profile-availability'] = 'Choose your availability.';
  }

  if (bio.length < 20) {
    errors['profile-bio'] = 'Write at least 20 characters about yourself.';
  }

  const errorFields = Object.keys(errors);

  if (errorFields.length > 0) {
    Object.entries(errors).forEach(([fieldId, message]) => {
      setFieldError(fieldId, message);
    });

    focusFirstError(errorFields[0]);
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  userProfile = {
    name,
    email,
    phone,
    experience,
    skills,
    category: preferredCategory,
    availability,
    bio
  };

  writeStorage(STORAGE_KEYS.profile, userProfile);
  elements.profileSkills.value = skills.join(', ');
  showProfileSummary();
  renderJobs();
  renderRecommendations();
  showToast(`Profile saved, ${name.split(' ')[0]}. Your Smart Match results are ready.`, 'success');
}

function restoreProfileForm() {
  if (!userProfile) {
    return;
  }

  elements.profileName.value = userProfile.name || '';
  elements.profileEmail.value = userProfile.email || '';
  elements.profilePhone.value = userProfile.phone || '';
  elements.profileExperience.value = userProfile.experience ?? '';
  elements.profileSkills.value = Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : '';
  elements.profileCategory.value = userProfile.category || '';
  elements.profileBio.value = userProfile.bio || '';

  elements.profileForm.querySelectorAll('input[name="availability"]').forEach((radio) => {
    radio.checked = radio.value === userProfile.availability;
  });
}

function showProfileSummary() {
  if (!userProfile?.name) {
    elements.profileSummary.innerHTML = `
      <span class="summary-label">Profile status</span>
      <p>No profile saved yet. Add your details to unlock your matches.</p>
    `;
    return;
  }

  const skills = Array.isArray(userProfile.skills) ? userProfile.skills : [];
  const experienceText = `${userProfile.experience} year${Number(userProfile.experience) === 1 ? '' : 's'}`;
  const skillTags = skills.map((skill) => `<span class="summary-skill">${escapeHTML(skill)}</span>`).join('');

  elements.profileSummary.innerHTML = `
    <span class="summary-label">Profile status</span>
    <p class="summary-name">${escapeHTML(userProfile.name)}</p>
    <p>${escapeHTML(experienceText)} experience · ${escapeHTML(userProfile.category)}</p>
    <p>${escapeHTML(userProfile.availability)}</p>
    <div class="summary-skills">${skillTags}</div>
  `;
}

function clearSingleFieldError(event) {
  if (event.target.id) {
    setFieldError(event.target.id, '');
  }

  if (event.target.name === 'availability') {
    setFieldError('profile-availability', '');
  }
}

/* =========================================================
   10. RECOMMENDATIONS AND COMPARISON TABLE
   ========================================================= */
function createRecommendationCard(job, match, index) {
  const matchedText = match.matchedSkills.length
    ? match.matchedSkills.map((skill) => escapeHTML(skill)).join(', ')
    : 'None yet';

  const missingText = match.missingSkills.length
    ? match.missingSkills.map((skill) => escapeHTML(skill)).join(', ')
    : 'None - you match every required skill.';

  const rankText = index === 0 ? 'Top recommendation' : `Rank #${index + 1}`;

  return `
    <article class="recommendation-card">
      <div class="recommendation-top">
        <div>
          <span class="category-tag">${escapeHTML(job.category)}</span>
          <h3>${escapeHTML(job.title)}</h3>
          <p class="recommendation-meta">${escapeHTML(job.company)} · ${job.formatBudget()} · ${rankText}</p>
        </div>
        <span class="match-badge">${match.percentage}% match</span>
      </div>
      <div class="match-bar" role="progressbar" aria-label="Smart Match score for ${escapeHTML(job.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${match.percentage}">
        <span class="match-fill" style="--match: ${match.percentage}%"></span>
      </div>
      <p class="match-detail">${match.matchedSkills.length} of ${job.skills.length} required skills matched</p>
      <p class="skill-match-line">
        <span class="match-dot matched-dot" aria-hidden="true"></span>
        <span><strong>Matched:</strong> ${matchedText}</span>
      </p>
      <p class="skill-match-line">
        <span class="match-dot missing-dot" aria-hidden="true"></span>
        <span><strong>To learn:</strong> ${missingText}</span>
      </p>
    </article>
  `;
}

function renderComparison(topRecommendations) {
  elements.comparisonBody.innerHTML = topRecommendations.map(({ job, match }, index) => {
    const missingText = match.missingSkills.length
      ? match.missingSkills.map((skill) => escapeHTML(skill)).join(', ')
      : 'None - all skills matched';

    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHTML(job.title)}</strong></td>
        <td>${escapeHTML(job.company)}</td>
        <td>${job.formatBudget()}</td>
        <td><span class="table-match">${match.percentage}%</span></td>
        <td>${missingText}</td>
      </tr>
    `;
  }).join('');
}

function renderRecommendations() {
  if (!jobsLoaded) {
    return;
  }

  const profileSkills = getProfileSkills();
  const profileName = userProfile?.name || 'your profile';

  if (profileSkills.length === 0) {
    elements.recommendationIntro.textContent = 'Save your profile to see jobs ranked by your personal skill match.';
    elements.matchSummary.textContent = '';
    elements.recommendationList.innerHTML = `
      <div class="empty-state">
        <h3>Your matches will appear here</h3>
        <p>Add your skills in the profile form above and Smart Match will rank these jobs for you.</p>
        <a class="btn btn-primary btn-small" href="#profile">Create my profile</a>
      </div>
    `;
    elements.comparisonBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">Save your profile to compare your top three matches.</td>
      </tr>
    `;
    return;
  }

  const scoredJobs = allJobs
    .map((job) => ({ job, match: job.getMatch(profileSkills) }))
    .filter((item) => item.match.percentage > 0)
    .sort((itemA, itemB) => {
      return itemB.match.percentage - itemA.match.percentage
        || itemB.match.matchedSkills.length - itemA.match.matchedSkills.length;
    });

  if (scoredJobs.length === 0) {
    elements.recommendationIntro.textContent = `No jobs match your current skills, ${profileName}.`;
    elements.matchSummary.textContent = '';
    elements.recommendationList.innerHTML = `
      <div class="empty-state">
        <h3>No matching jobs yet</h3>
        <p>Try adding skills that appear in the listings, such as HTML, CSS, Figma, SEO or Excel.</p>
        <a class="btn btn-primary btn-small" href="#jobs">Browse all jobs</a>
      </div>
    `;
    elements.comparisonBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">No matches to compare yet. Add more relevant skills and save again.</td>
      </tr>
    `;
    return;
  }

  const topRecommendations = scoredJobs.slice(0, 6);
  const topThree = topRecommendations.slice(0, 3);

  const averageScore = Math.round(
    topThree.reduce((total, item) => total + item.match.percentage, 0) / topThree.length
  );

  elements.recommendationIntro.textContent = `Ranked for ${profileName} using ${profileSkills.length} skill${profileSkills.length === 1 ? '' : 's'} from your profile.`;
  elements.matchSummary.textContent = `Your best match is ${topThree[0].match.percentage}%. The average of your top ${topThree.length} matches is ${averageScore}%.`;

  elements.recommendationList.innerHTML = topRecommendations
    .map(({ job, match }, index) => createRecommendationCard(job, match, index))
    .join('');

  renderComparison(topThree);
}

/* =========================================================
   11. POST A JOB FORM
   ========================================================= */
function handlePostJobSubmit(event) {
  event.preventDefault();
  clearFormErrors(elements.postJobForm);

  const title = elements.postTitle.value.trim();
  const company = elements.postCompany.value.trim();
  const category = elements.postCategory.value;
  const budgetValue = elements.postBudget.value.trim();
  const budget = Number(budgetValue);
  const skills = splitSkills(elements.postSkills.value);
  const description = elements.postDescription.value.trim();
  const errors = {};

  if (title.length < 5) {
    errors['post-title'] = 'Give the job a title of at least 5 characters.';
  }

  if (company.length < 2) {
    errors['post-company'] = 'Enter the company name.';
  }

  if (!category) {
    errors['post-category'] = 'Choose a job category.';
  }

  if (budgetValue === '' || Number.isNaN(budget) || budget < 100 || budget > 100000) {
    errors['post-budget'] = 'Enter a budget between $100 and $100,000.';
  }

  if (skills.length === 0) {
    errors['post-skills'] = 'Add at least one required skill.';
  }

  if (description.length < 20) {
    errors['post-description'] = 'Write at least 20 characters describing the job.';
  }

  const errorFields = Object.keys(errors);

  if (errorFields.length > 0) {
    Object.entries(errors).forEach(([fieldId, message]) => {
      setFieldError(fieldId, message);
    });

    document.getElementById(errorFields[0])?.focus();
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  const newJobData = {
    id: `posted-${Date.now()}`,
    title,
    company,
    category,
    budget,
    skills,
    description,
    posted: true
  };

  postedJobs = [newJobData, ...postedJobs];
  writeStorage(STORAGE_KEYS.postedJobs, postedJobs);

  allJobs = [new Job(newJobData), ...allJobs];

  elements.postJobForm.reset();
  clearFormErrors(elements.postJobForm);
  elements.categoryFilter.value = 'All';
  elements.jobSearch.value = '';
  saveLastSearch('');
  renderJobs();
  renderRecommendations();
  showToast(`Job posted: “${title}”. It is now visible in the job list.`, 'success');
}

/* =========================================================
   12. TOAST NOTIFICATIONS
   ========================================================= */
function showToast(message, type = 'success') {
  while (elements.toastContainer.children.length >= 3) {
    elements.toastContainer.firstElementChild.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-dot" aria-hidden="true"></span>
    <span>${escapeHTML(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* =========================================================
   13. EVENT LISTENERS AND APP START
   ========================================================= */
function setupEventListeners() {
  elements.jobList.addEventListener('click', handleJobBoardClick);

  elements.jobSearch.addEventListener('input', () => {
    saveLastSearch(elements.jobSearch.value);

    if (elements.jobSearch.value.trim().length < 2) {
      hideSuggestions();
    }

    handleSearchInput();
  });

  elements.jobSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideSuggestions();
    }

    if (event.key === 'Enter' && !elements.suggestions.hidden) {
      event.preventDefault();
      elements.suggestions.querySelector('button[data-suggestion]')?.click();
    }
  });

  elements.suggestions.addEventListener('click', chooseSuggestion);

  elements.categoryFilter.addEventListener('change', () => {
    hideSuggestions();
    renderJobs();
  });

  elements.profileForm.addEventListener('submit', handleProfileSubmit);
  elements.profileForm.addEventListener('input', clearSingleFieldError);
  elements.profileForm.addEventListener('change', clearSingleFieldError);

  elements.postJobForm.addEventListener('submit', handlePostJobSubmit);
  elements.postJobForm.addEventListener('input', clearSingleFieldError);
  elements.postJobForm.addEventListener('change', clearSingleFieldError);

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-field')) {
      hideSuggestions();
    }
  });
}

function initializeApp() {
  restoreProfileForm();
  showProfileSummary();

  const lastSearch = readSession(STORAGE_KEYS.lastSearch, '');
  if (lastSearch) {
    elements.jobSearch.value = lastSearch;
  }

  setupEventListeners();
  loadJobs();
}

initializeApp();

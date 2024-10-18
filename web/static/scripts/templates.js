// Global variable to store template data
let templates = [
  {
    id: "template-id-123",
    name: "Sample Template",
    description: "This is a sample template.",
    state: 0,
    grant: {
      allowed_combinations: "Some combination rules"
    }
  },
  {
    id: "template-id-456",
    name: "Another Template",
    description: "This is another sample template.",
    state: 1,
    grant: {
      allowed_combinations: "Different combination rules"
    }
  }
];

// Function to create a single card
function createCard(template) {
  const stateText = template.state === 0 ? "ON" : template.state === 1 ? "OFF" : "REPORT";
  return `
    <div class="card">
      <div class="info-icon">
        <img src="/static/assets/i.svg" class="icon">
      </div>
      <h2 class="card-title">${template.name}</h2>
      <p class="card-info">ID: ${template.id}</p>
      <p class="card-info">State: ${stateText}</p>
      <p class="card-info">Description: ${template.description}</p>
    </div>
  `;
}

// Function to create the "Add New" card
function createAddNewCard() {
  return `
    <div id="add-new-card" class="add-new-card">
      <div class="add-new-icon">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="add-new-text">Add New Template</span>
      </div>
    </div>
  `;
}

// Function to generate the entire grid
function generateCardGrid(templates) {
  const cardsHtml = templates.map(template => createCard(template)).join('');
  const addNewCardHtml = createAddNewCard();
  
  return `
    <div id="main-content" class="container">
      <h1 class="text-4xl font-bold text-blue-500 mb-6">Template Grid</h1>
      <div class="card-grid">
        ${cardsHtml}
        ${addNewCardHtml}
      </div>
    </div>
  `;
}

// Function to create edit/create popup
function createEditPopup(template = {}) {
  const isNewTemplate = Object.keys(template).length === 0;
  const title = isNewTemplate ? "Add New Template" : "Edit Template";

  const popupHtml = `
    <div id="edit-popup" class="popup">
      <div class="popup-content">
        <div class="popup-header">
          <h2 class="popup-title">${title}</h2>
          <button id="close-popup" class="close-button">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="pretty-view" class="popup-form">
          <form id="edit-form">
            <div class="form-group">
              <label for="id" class="form-label">ID:</label>
              <input type="text" id="id" name="id" value="${template.id || ''}" class="form-input" required ${isNewTemplate ? '' : 'readonly'}>
            </div>
            <div class="form-group">
              <label for="name" class="form-label">Name:</label>
              <input type="text" id="name" name="name" value="${template.name || ''}" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="description" class="form-label">Description:</label>
              <textarea id="description" name="description" class="form-input" rows="3">${template.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="state" class="form-label">State:</label>
              <select id="state" name="state" class="form-input" required>
                <option value="0" ${template.state === 0 ? 'selected' : ''}>ON</option>
                <option value="1" ${template.state === 1 ? 'selected' : ''}>OFF</option>
                <option value="2" ${template.state === 2 ? 'selected' : ''}>REPORT</option>
              </select>
            </div>
            <div class="form-group">
              <label for="allowed_combinations" class="form-label">Allowed Combinations:</label>
              <textarea id="allowed_combinations" name="allowed_combinations" class="form-input" rows="3">${template.grant?.allowed_combinations || ''}</textarea>
            </div>
          </form>
        </div>
        <div id="json-view" class="hidden popup-form">
          <textarea id="json-edit" class="form-input h-full">${JSON.stringify(template, null, 2)}</textarea>
        </div>
        <div class="popup-footer">
          <div class="relative group">
            <button id="swap-view" class="icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>
          <div class="flex items-center space-x-2">
            ${isNewTemplate ? '' : `
            <div class="relative group">
              <button id="delete-entry" class="icon-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            `}
            <div class="relative group">
              <button id="commit-changes" class="icon-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="popup-overlay"></div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', popupHtml);

  const editForm = document.getElementById('edit-form');
  const jsonEdit = document.getElementById('json-edit');
  const swapViewButton = document.getElementById('swap-view');
  const commitChangesButton = document.getElementById('commit-changes');

  function updateFormFromJson() {
    try {
      const jsonData = JSON.parse(jsonEdit.value);
      for (const [key, value] of Object.entries(jsonData)) {
        const input = editForm.elements[key];
        if (input) {
          if (key === 'grant') {
            editForm.elements['allowed_combinations'].value = value.allowed_combinations;
          } else {
            input.value = value;
          }
        }
      }
      jsonEdit.classList.remove('border-red-500', 'bg-red-100');
      swapViewButton.disabled = false;
      commitChangesButton.disabled = false;
      swapViewButton.querySelector('.icon').classList.remove('icon-disabled');
      commitChangesButton.querySelector('.icon').classList.remove('icon-disabled');
    } catch (error) {
      jsonEdit.classList.add('border-red-500', 'bg-red-100');
      swapViewButton.disabled = true;
      commitChangesButton.disabled = true;
      swapViewButton.querySelector('.icon').classList.add('icon-disabled');
      commitChangesButton.querySelector('.icon').classList.add('icon-disabled');
    }
  }

  function updateJsonFromForm() {
    const formData = new FormData(editForm);
    const jsonData = Object.fromEntries(formData.entries());
    jsonData.state = parseInt(jsonData.state, 10);
    jsonData.grant = {
      allowed_combinations: jsonData.allowed_combinations
    };
    delete jsonData.allowed_combinations;
    jsonEdit.value = JSON.stringify(jsonData, null, 2);
  }

  editForm.addEventListener('input', updateJsonFromForm);
  jsonEdit.addEventListener('input', updateFormFromJson);

  swapViewButton.addEventListener('click', () => {
    const prettyView = document.getElementById('pretty-view');
    const jsonView = document.getElementById('json-view');
    prettyView.classList.toggle('hidden');
    jsonView.classList.toggle('hidden');
    if (!jsonView.classList.contains('hidden')) {
      updateJsonFromForm();
    } else {
      updateFormFromJson();
    }
  });

  document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('edit-popup').remove();
    toggleBlur(false);
  });

  if (!isNewTemplate) {
    document.getElementById('delete-entry').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this template?')) {
        const index = templates.findIndex(t => t.id === template.id);
        if (index !== -1) {
          templates.splice(index, 1);
          refreshGrid();
          document.getElementById('edit-popup').remove();
          toggleBlur(false);
        }
      }
    });
  }

  commitChangesButton.addEventListener('click', () => {
    const formData = new FormData(editForm);
    const updatedTemplate = Object.fromEntries(formData.entries());
    updatedTemplate.state = parseInt(updatedTemplate.state, 10);
    updatedTemplate.grant = {
      allowed_combinations: updatedTemplate.allowed_combinations
    };
    delete updatedTemplate.allowed_combinations;
    
    if (isNewTemplate) {
      templates.push(updatedTemplate);
    } else {
      const index = templates.findIndex(t => t.id === template.id);
      if (index !== -1) {
        templates[index] = updatedTemplate;
      }
    }
    
    refreshGrid();
    document.getElementById('edit-popup').remove();
    toggleBlur(false);
  });
}

// Function to toggle blur
function toggleBlur(shouldBlur) {
  const elementsToBlur = [
    document.querySelector('nav'),
    document.getElementById('main-content')
  ];

  elementsToBlur.forEach(element => {
    if (element) {
      if (shouldBlur) {
        element.classList.add('blur-sm');
      } else {
        element.classList.remove('blur-sm');
      }
    }
  });
}

// Function to refresh the grid
function refreshGrid() {
  const gridHtml = generateCardGrid(templates);
  document.getElementById('content-container').innerHTML = gridHtml;
  addEventListeners();
}

// Function to add all event listeners
function addEventListeners() {
  const infoIcons = document.querySelectorAll('.info-icon');
  infoIcons.forEach((icon, index) => {
    icon.addEventListener('click', () => {
      const template = templates[index];
      createEditPopup(template);
      toggleBlur(true);
    });
  });

  const addNewCard = document.getElementById('add-new-card');
  addNewCard.addEventListener('click', () => {
    createEditPopup();
    toggleBlur(true);
  });
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  refreshGrid();
});
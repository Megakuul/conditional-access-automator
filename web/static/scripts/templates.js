let templates = null;

// Fetch the data from the endpoint
fetch('/api/fetch_conditional_access', {
  method: 'GET',
  credentials: 'include' // Include cookies in the request
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  return response.json();
})
.then(data => {
  // The 'templates' field appears to be a stringified JSON, so we need to parse it
  if (typeof data.templates === 'string') {
    try {
      templates = JSON.parse(data.templates); // Parse the stringified JSON
    } catch (e) {
      console.error('Failed to parse templates:', e);
      return;
    }
  } else {
    templates = data.templates;
  }

  // Wrap templates into an array if it's not already an array
  if (!Array.isArray(templates)) {
    templates = [templates];
  }

  // Now you can safely use array methods
  templates.forEach(template => {
    if (template.encodedData) {
      let base64Url = template.encodedData;
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      let decodedData = atob(base64);
      template.decodedData = decodedData;
    }
  });

  console.log('Templates with decoded data:', templates);
  
  // Now that 'templates' has data, call 'refreshGrid' to update the UI
  refreshGrid();
})
.catch(error => {
  console.error('There was a problem with the fetch operation:', error);
});




// Function to create a single card
function createCard(template) {
  const stateText = template.state === 0 ? "ON" : template.state === 1 ? "OFF" : "REPORT";
  const actionText = template.policy && template.policy.action ? "Allow" : "Deny";
  return `
    <div class="card">
      <div class="info-icon">
        <img src="/static/assets/i.svg" class="icon">
      </div>
      <h2 class="card-title">${template.name}</h2>
      <p class="card-info">ID: ${template.id}</p>
      <p class="card-info">State: ${stateText}</p>
      <p class="card-info">Description: ${template.description}</p>
      <p class="card-info">Policy Action${actionText}</p>
    </div>
  `;
}

// Function to create the "Add New" card
function createAddNewCard() {
  return `
    <div id="add-new-card" class="add-new-card">
      <div class="add-new-icon">
        <svg xmlns="http://www.w3.org/2000/svg" class="add-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const policyAction = template.policy && template.policy.action ? template.policy.action : true;

  const entities = template.policy?.entities || [];
  const resources = template.policy?.resources || [];
  const conditions = template.policy?.conditions || [];

  const entitiesHtml = entities.map((entity, index) => createEntityFormGroup(entity, index)).join('');
  const resourcesHtml = resources.map((resource, index) => createResourceFormGroup(resource, index)).join('');
  const conditionsHtml = conditions.map((condition, index) => createConditionFormGroup(condition, index)).join('');

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
          <form id="edit-form" class="form-grid">
            <!-- Existing form fields -->
            <div class="form-group">
              <label for="id" class="form-label">ID</label>
              <input type="text" id="id" name="id" value="${template.id || ''}" class="form-input" required ${isNewTemplate ? '' : 'readonly'}>
            </div>
            <div class="form-group">
              <label for="name" class="form-label">Name</label>
              <input type="text" id="name" name="name" value="${template.name || ''}" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="state" class="form-label">State</label>
              <select id="state" name="state" class="form-input" required>
                <option value="0" ${template.state === 0 ? 'selected' : ''}>ON</option>
                <option value="1" ${template.state === 1 ? 'selected' : ''}>OFF</option>
                <option value="2" ${template.state === 2 ? 'selected' : ''}>REPORT</option>
              </select>
            </div>
            <div class="form-group">
              <label for="description" class="form-label">Description</label>
              <input id="description" name="description" class="form-input" value="${template.description || ''}">
            </div>
            <div class="form-group">
              <label for="allowed_combinations" class="form-label">Allowed Combinations</label>
              <input id="allowed_combinations" name="allowed_combinations" class="form-input" value="${template.grant?.allowed_combinations || ''}">
            </div>
            <!-- Policy Action Slider -->
            <div class="form-group">
              <label class="form-label">Policy Action</label>
              <div class="slider-container dummy-container">
                <label class="form-label hidden">${policyAction ? 'Allow' : 'Deny'}</label>
                <label class="switch">
                  <input type="checkbox" id="action" name="action" ${policyAction ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <!-- Entities Section -->
            <div class="form-group full-width">
              <label class="form-section">Entities</label>
              <div id="entities-container">
                ${entitiesHtml}
              </div>
              ${createAddEntryButton('entity')}
            </div>
            <!-- Resources Section -->
            <div class="form-group full-width">
              <label class="form-section">Resources</label>
              <div id="resources-container">
                ${resourcesHtml}
              </div>
              ${createAddEntryButton('resource')}
            </div>
            <!-- Conditions Section -->
            <div class="form-group full-width">
              <label class="form-section">Conditions</label>
              <div id="conditions-container">
                ${conditionsHtml}
              </div>
              ${createAddEntryButton('condition')}
            </div>
          </form>
        </div>
        <div id="json-view" class="hidden popup-form">
          <textarea id="json-edit" class="form-input h-full">${JSON.stringify(template, null, 2)}</textarea>
        </div>
        <div class="popup-footer">
          <div class="relative group">
            <button id="swap-view" class="icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

  // Function to create the "Add Entry" buttons
  function createAddEntryButton(type) {
    return `
      <div id="add-${type}-button" class="add-entry-card">
        <div class="add-entry-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="add-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    `;
  }

  // Function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Functions to create dynamic form groups for entities, resources, and conditions
  function createEntityFormGroup(entity = {}, index) {
    const includeChecked = entity.include ? 'checked' : '';
    return `
      <div class="entity-group" data-index="${index}">
        <div class="entity-group-inner">
          <div class="slider-container">
            <label class="form-label">Include:</label>
            <label class="switch">
              <input type="checkbox" name="entities[${index}][include]" ${includeChecked}>
              <span class="slider"></span>
            </label>
            <button type="button" class="remove-entity-button remove-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mt-4 trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0
                  0116.138 21H7.862a2 2 0
                  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1
                  0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="entity-details">
            <div class="form-group">
              <label class="form-label">Entity Type:</label>
              <select name="entities[${index}][entity_type]" class="form-input">
                <option value="0" ${entity.entity_type === 0 ? 'selected' : ''}>USER</option>
                <option value="1" ${entity.entity_type === 1 ? 'selected' : ''}>GROUP</option>
                <option value="2" ${entity.entity_type === 2 ? 'selected' : ''}>ROLE</option>
              </select>
            </div>
            <div class="form-group">
              <input type="text" name="entities[${index}][name]" value="${entity.name || ''}" class="form-input">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function createResourceFormGroup(resource = {}, index) {
    const includeChecked = resource.include ? 'checked' : '';
    return `
      <div class="resource-group" data-index="${index}">
        <div class="resource-group-inner">
          <div class="slider-container">
            <label class="form-label">Include:</label>
            <label class="switch">
              <input type="checkbox" name="resources[${index}][include]" ${includeChecked}>
              <span class="slider"></span>
            </label>
            <button type="button" class="remove-resource-button remove-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mt-4 trash-icon trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0
                  0116.138 21H7.862a2 2 0
                  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1
                  0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="resource-details">
            <div class="form-group">
              <label class="form-label">Resource Type:</label>
              <select name="resources[${index}][resource_type]" class="form-input">
                <option value="0" ${resource.resource_type === 0 ? 'selected' : ''}>APP</option>
                <!-- Add more resource types if needed -->
              </select>
            </div>
            <div class="form-group">
              <input type="text" name="resources[${index}][name]" value="${resource.name || ''}" class="form-input">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function createConditionFormGroup(condition = {}, index) {
    const includeChecked = condition.include ? 'checked' : '';
    return `
      <div class="condition-group" data-index="${index}">
        <div class="condition-group-inner">
          <div class="slider-container">
            <label class="form-label">Include:</label>
            <label class="switch">
              <input type="checkbox" name="conditions[${index}][include]" ${includeChecked}>
              <span class="slider"></span>
            </label>
            <button type="button" class="remove-condition-button remove-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mt-4 trash-icon trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0
                  0116.138 21H7.862a2 2 0
                  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1
                  0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="condition-details">
            <div class="form-group">
              <label class="form-label">Condition Type:</label>
              <select name="conditions[${index}][condition_type]" class="form-input">
                <option value="0" ${condition.condition_type === 0 ? 'selected' : ''}>PLATFORM</option>
                <option value="1" ${condition.condition_type === 1 ? 'selected' : ''}>LOCATION</option>
                <option value="2" ${condition.condition_type === 2 ? 'selected' : ''}>CLIENT_APP</option>
              </select>
            </div>
            <div class="form-group">
              <input type="text" name="conditions[${index}][name]" value="${condition.name || ''}" class="form-input">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const editForm = document.getElementById('edit-form');
  const jsonEdit = document.getElementById('json-edit');
  const swapViewButton = document.getElementById('swap-view');
  const commitChangesButton = document.getElementById('commit-changes');

  function updateFormFromJson() {
    try {
      const jsonData = JSON.parse(jsonEdit.value);
      // Update main form fields
      editForm.elements['id'].value = jsonData.id || '';
      editForm.elements['name'].value = jsonData.name || '';
      editForm.elements['state'].value = jsonData.state || '0';
      editForm.elements['description'].value = jsonData.description || '';
      editForm.elements['allowed_combinations'].value = jsonData.grant?.allowed_combinations || '';
      editForm.elements['action'].checked = jsonData.policy?.action;

      // Update the Policy Action label
      const actionLabel = editForm.querySelector('.form-group .slider-container .form-label');
      actionLabel.textContent = jsonData.policy?.action ? 'Allow' : 'Deny';

      // Clear and update entities
      const entitiesContainer = document.getElementById('entities-container');
      entitiesContainer.innerHTML = '';
      jsonData.policy?.entities?.forEach((entity, index) => {
        entitiesContainer.insertAdjacentHTML('beforeend', createEntityFormGroup(entity, index));
      });

      // Clear and update resources
      const resourcesContainer = document.getElementById('resources-container');
      resourcesContainer.innerHTML = '';
      jsonData.policy?.resources?.forEach((resource, index) => {
        resourcesContainer.insertAdjacentHTML('beforeend', createResourceFormGroup(resource, index));
      });

      // Clear and update conditions
      const conditionsContainer = document.getElementById('conditions-container');
      conditionsContainer.innerHTML = '';
      jsonData.policy?.conditions?.forEach((condition, index) => {
        conditionsContainer.insertAdjacentHTML('beforeend', createConditionFormGroup(condition, index));
      });

      // Re-attach event listeners
      attachDynamicSectionEventListeners();

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
    const jsonData = {};

    jsonData.id = formData.get('id');
    jsonData.name = formData.get('name');
    jsonData.state = parseInt(formData.get('state'), 10);
    jsonData.description = formData.get('description');
    jsonData.grant = {
      allowed_combinations: formData.get('allowed_combinations')
    };
    jsonData.policy = {
      action: formData.get('action') === 'on',
      entities: [],
      resources: [],
      conditions: []
    };

    // Update the Policy Action label
    const actionLabel = editForm.querySelector('.form-group .slider-container .form-label');
    actionLabel.textContent = jsonData.policy.action ? 'Allow' : 'Deny';

    // Process entities
    const entityGroups = editForm.querySelectorAll('.entity-group');
    entityGroups.forEach((group) => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`entities[${index}][include]`) === 'on';
      const entity_type = parseInt(formData.get(`entities[${index}][entity_type]`), 10);
      const name = formData.get(`entities[${index}][name]`);

      jsonData.policy.entities.push({
        include,
        entity_type,
        name
      });
    });

    // Process resources
    const resourceGroups = editForm.querySelectorAll('.resource-group');
    resourceGroups.forEach((group) => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`resources[${index}][include]`) === 'on';
      const resource_type = parseInt(formData.get(`resources[${index}][resource_type]`), 10);
      const name = formData.get(`resources[${index}][name]`);

      jsonData.policy.resources.push({
        include,
        resource_type,
        name
      });
    });

    // Process conditions
    const conditionGroups = editForm.querySelectorAll('.condition-group');
    conditionGroups.forEach((group) => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`conditions[${index}][include]`) === 'on';
      const condition_type = parseInt(formData.get(`conditions[${index}][condition_type]`), 10);
      const name = formData.get(`conditions[${index}][name]`);

      jsonData.policy.conditions.push({
        include,
        condition_type,
        name
      });
    });

    jsonEdit.value = JSON.stringify(jsonData, null, 2);
  }

  editForm.addEventListener('input', updateJsonFromForm);
  jsonEdit.addEventListener('input', updateFormFromJson);

  // Update Policy Action label on change
  const actionCheckbox = editForm.elements['action'];
  actionCheckbox.addEventListener('change', () => {
    const actionLabel = editForm.querySelector('.form-group .slider-container .form-label');
    actionLabel.textContent = actionCheckbox.checked ? 'Allow' : 'Deny';
  });

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
    const updatedTemplate = {};

    updatedTemplate.id = formData.get('id');
    updatedTemplate.name = formData.get('name');
    updatedTemplate.state = parseInt(formData.get('state'), 10);
    updatedTemplate.description = formData.get('description');
    updatedTemplate.grant = {
      allowed_combinations: formData.get('allowed_combinations')
    };
    updatedTemplate.policy = {
      action: formData.get('action') === 'on',
      entities: [],
      resources: [],
      conditions: []
    };

    // Process entities
    const entityGroups = editForm.querySelectorAll('.entity-group');
    entityGroups.forEach(group => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`entities[${index}][include]`) === 'on';
      const entity_type = parseInt(formData.get(`entities[${index}][entity_type]`), 10);
      const name = formData.get(`entities[${index}][name]`);

      updatedTemplate.policy.entities.push({
        include,
        entity_type,
        name
      });
    });

    // Process resources
    const resourceGroups = editForm.querySelectorAll('.resource-group');
    resourceGroups.forEach(group => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`resources[${index}][include]`) === 'on';
      const resource_type = parseInt(formData.get(`resources[${index}][resource_type]`), 10);
      const name = formData.get(`resources[${index}][name]`);

      updatedTemplate.policy.resources.push({
        include,
        resource_type,
        name
      });
    });

    // Process conditions
    const conditionGroups = editForm.querySelectorAll('.condition-group');
    conditionGroups.forEach(group => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`conditions[${index}][include]`) === 'on';
      const condition_type = parseInt(formData.get(`conditions[${index}][condition_type]`), 10);
      const name = formData.get(`conditions[${index}][name]`);

      updatedTemplate.policy.conditions.push({
        include,
        condition_type,
        name
      });
    });

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

  // Attach event listeners for adding/removing dynamic sections
  function attachDynamicSectionEventListeners() {
    // Entities
    const addEntityButton = document.getElementById('add-entity-button');
    addEntityButton.addEventListener('click', onAddEntityButtonClick);

    // Resources
    const addResourceButton = document.getElementById('add-resource-button');
    addResourceButton.addEventListener('click', onAddResourceButtonClick);

    // Conditions
    const addConditionButton = document.getElementById('add-condition-button');
    addConditionButton.addEventListener('click', onAddConditionButtonClick);

    // Attach remove button event listeners using event delegation
    const entitiesContainer = document.getElementById('entities-container');
    entitiesContainer.addEventListener('click', onEntityContainerClick);

    const resourcesContainer = document.getElementById('resources-container');
    resourcesContainer.addEventListener('click', onResourceContainerClick);

    const conditionsContainer = document.getElementById('conditions-container');
    conditionsContainer.addEventListener('click', onConditionContainerClick);
  }

  // Define the event handler functions
  function onAddEntityButtonClick() {
    const entitiesContainer = document.getElementById('entities-container');
    const index = entitiesContainer.querySelectorAll('.entity-group').length;
    entitiesContainer.insertAdjacentHTML('beforeend', createEntityFormGroup({}, index));
    updateJsonFromForm();
  }

  function onAddResourceButtonClick() {
    const resourcesContainer = document.getElementById('resources-container');
    const index = resourcesContainer.querySelectorAll('.resource-group').length;
    resourcesContainer.insertAdjacentHTML('beforeend', createResourceFormGroup({}, index));
    updateJsonFromForm();
  }

  function onAddConditionButtonClick() {
    const conditionsContainer = document.getElementById('conditions-container');
    const index = conditionsContainer.querySelectorAll('.condition-group').length;
    conditionsContainer.insertAdjacentHTML('beforeend', createConditionFormGroup({}, index));
    updateJsonFromForm();
  }

  // Event delegation for remove buttons
  function onEntityContainerClick(e) {
    if (e.target.closest('.remove-entity-button')) {
      e.target.closest('.entity-group').remove();
      updateJsonFromForm();
    }
  }

  function onResourceContainerClick(e) {
    if (e.target.closest('.remove-resource-button')) {
      e.target.closest('.resource-group').remove();
      updateJsonFromForm();
    }
  }

  function onConditionContainerClick(e) {
    if (e.target.closest('.remove-condition-button')) {
      e.target.closest('.condition-group').remove();
      updateJsonFromForm();
    }
  }

  attachDynamicSectionEventListeners();
  updateJsonFromForm();
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

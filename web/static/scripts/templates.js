// Enumerations for action conditions and condition types
const ACTION_CONDITION_ENUM = {
  0: 'MFA',
  1: 'COMPLIANT_CLIENT',
  2: 'DOMAINJOINED_CLIENT',
  3: 'APPROVED_APP',
  4: 'COMPLIANT_APP',
  5: 'PASSWORDCHANGE',
};

const CONDITION_TYPE_ENUM = {
  0: 'PLATFORM',
  1: 'LOCATION',
  2: 'CLIENT_APP',
};

// Reverse mappings for easier lookups
const ACTION_CONDITION_VALUES = Object.entries(ACTION_CONDITION_ENUM).map(([key, value]) => ({
  value: parseInt(key),
  label: value,
}));

const CONDITION_TYPE_VALUES = Object.entries(CONDITION_TYPE_ENUM).map(([key, value]) => ({
  value: parseInt(key),
  label: value,
}));

let templates = [];

// Define the example templates with updated 'state' values
const exampleTemplates = [
  {
    "id": "12345678-90ab-cdef-1234-567890abcdef",
    "name": "CA001-MFA-Outside-NamedLocations-NormalUsers",
    "state": 2,
    "description": "MFA for normal users outside of specified Named Locations",
    "policy": {
      "action": true,
      "action_condition": {
        "chain_operator": "AND",
        "conditions": [1]
      },
      "entities": [
        {
          "include": true,
          "type": 0,
          "name": "normal-users-group-id"
        }
      ],
      "resources": [
        {
          "include": true,
          "type": 0,
          "name": "All"
        }
      ],
      "conditions": [
        {
          "include": false,
          "type": 2,
          "name": "named-locations-id"
        }
      ]
    }
  },
  {
    "id": "abcdef12-3456-7890-abcd-ef1234567890",
    "name": "CA002-GeoBlock-GlobalAdmins-Switzerland",
    "state": "enabledForReportingButNotEnforced",
    "description": "Block Global Administrators outside of Switzerland",
    "policy": {
      "action": false,
      "action_condition": {
        "chain_operator": "AND",
        "conditions": [1]
      },
      "entities": [
        {
          "include": true,
          "type": 0,
          "name": "global-admin-group-id"
        }
      ],
      "resources": [
        {
          "include": true,
          "type": 0,
          "name": "All"
        }
      ],
      "conditions": [
        {
          "include": false,
          "type": 2,
          "name": "Switzerland"
        }
      ]
    }
  },
  {
    "id": "56789012-3456-abcd-ef12-34567890abcd",
    "name": "CA003-GeoBlock-NormalUsers-SpecifiedCountries",
    "state": "enabledForReportingButNotEnforced",
    "description": "Block normal users outside of Liechtenstein, Austria, France, Switzerland, Germany",
    "policy": {
      "action": false,
      "action_condition": {
        "chain_operator": "AND",
        "conditions": [1]
      },
      "entities": [
        {
          "include": true,
          "type": 0,
          "name": "normal-users-group-id"
        }
      ],
      "resources": [
        {
          "include": true,
          "type": 0,
          "name": "All"
        }
      ],
      "conditions": [
        {
          "include": false,
          "type": 2,
          "name": ["Liechtenstein", "Austria", "France", "Switzerland", "Germany"]
        }
      ]
    }
  },
  {
    "id": "7890abcd-1234-5678-90ef-1234567890ab",
    "name": "CA004-Block-LegacyAuthentication",
    "state": "enabledForReportingButNotEnforced",
    "description": "Block legacy authentication for all users",
    "policy": {
      "action": false,
      "action_condition": {
        "chain_operator": "AND",
        "conditions": [1]
      },
      "entities": [
        {
          "include": true,
          "type": 0,
          "name": "AllUsers"
        }
      ],
      "resources": [
        {
          "include": true,
          "type": 0,
          "name": "All"
        }
      ],
      "conditions": [
        {
          "include": true,
          "type": 0,
          "name": "legacy-authentication"
        }
      ]
    }
  },
  {
    "id": "90123456-7890-abcd-ef12-34567890abcd",
    "name": "CA005-MFA-Registration-Outside-NamedLocations",
    "state": "enabledForReportingButNotEnforced",
    "description": "MFA for registration of MFA methods outside of specified Named Locations",
    "policy": {
      "action": true,
      "action_condition": {
        "chain_operator": "AND",
        "conditions": [1]
      },
      "entities": [
        {
          "include": true,
          "type": 0,
          "name": "AllUsers"
        }
      ],
      "resources": [
        {
          "include": true,
          "type": 0,
          "name": "MFA-Registration"
        }
      ],
      "conditions": [
        {
          "include": false,
          "type": 2,
          "name": "named-locations-id"
        }
      ]
    }
  }
];

// Fetch the data from the endpoint
fetch('/api/fetch_conditional_access', {
  method: 'GET',
  credentials: 'include' // Include cookies in the request
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    console.log('Response with encoded data:', response);
    return response.json();
  })
  .then(data => {
    // Parse 'templates' if it's a stringified JSON
    if (typeof data.templates === 'string') {
      try {
        templates = JSON.parse(data.templates);
      } catch (e) {
        console.error('Failed to parse templates:', e);
        return;
      }
    } else {
      templates = data.templates;
    }

    // Ensure 'templates' is an array
    if (!Array.isArray(templates)) {
      templates = [templates];
    }

    // Since 'templates' is an array of encoded strings, decode each one
    templates = templates.map((encodedString, index) => {
      let base64Url = encodedString;
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Ensure the base64 string is properly padded
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      try {
        // Decode base64 to binary string
        let binaryString = atob(base64);

        // Convert binary string to bytes
        let len = binaryString.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Decode UTF-8 bytes to string
        let decodedDataStr = new TextDecoder('utf-8').decode(bytes);

        // Parse decoded data as JSON
        let decodedData = JSON.parse(decodedDataStr);
        return decodedData;
      } catch (e) {
        console.error('Failed to decode base64 or parse JSON at index', index, e);
        return null;
      }
    });

    console.log('Templates with decoded data:', templates);

    // Now that 'templates' has data, call 'refreshGrid' to update the UI
    refreshGrid();
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });

// Define the functions to be called
function processTemplate(templateJson) {
  console.log('Processing template:', templateJson);

  fetch('/api/apply', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(templateJson)
  })
  .then(response => response.json())
  .then(templateJson => console.log(templateJson))
  .catch(error => console.error('Error:', error));
}

function deleteTemplateById(id) {
  // Implement your logic here
  console.log('Deleting template with ID:', id);
  // For example, you might send a delete request to a server


      // Prepare the payload with the template ID
      const payload = {
        template_id: id
    };

    // Make a POST request to the API endpoint
    fetch('/api/destroy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin', // This ensures cookies (such as access_token) are sent with the request
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                console.error('Error:', error);
                throw new Error(error.message || 'Error occurred');
            });
        }
        return response.json(); // Parse the JSON response
    })
    .then(data => {
        console.log('Success:', data); // Handle the successful response
    })
    .catch(error => {
        console.error('Request failed:', error); // Handle errors
    });


}

// Function to create a single card
function createCard(template) {
  const stateTextMap = {
    "enabled": "ON",
    "disabled": "OFF",
    "enabledForReportingButNotEnforced": "REPORT"
  };
  const stateText = stateTextMap[template.state] || "UNKNOWN";
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
      <p class="card-info">Policy Action: ${actionText}</p>
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

// Function to create the "Add Example" card
function createAddExampleCard() {
  return `
    <div id="add-example-card" class="add-new-card">
      <div class="add-new-icon">
        <svg xmlns="http://www.w3.org/2000/svg" class="add-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <!-- Icon for examples -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m0-16l-4 4m4-4l4 4" />
        </svg>
        <span class="add-new-text">Add Example Template</span>
      </div>
    </div>
  `;
}

// Function to generate the entire grid
function generateCardGrid(templates) {
  const cardsHtml = templates.map(template => createCard(template)).join('');
  const addNewCardHtml = createAddNewCard();
  const addExampleCardHtml = createAddExampleCard();

  return `
    <div id="main-content" class="container">
      <div class="card-grid">
        ${cardsHtml}
        ${addNewCardHtml}
        ${addExampleCardHtml}
      </div>
    </div>
  `;
}

// Function to create example selection popup
function createExampleSelectionPopup() {
  const popupHtml = `
    <div id="example-selection-popup" class="popup fixed inset-0 flex items-center justify-center z-50">
      <div class="popup-content bg-white rounded-lg shadow-lg w-1/2 max-w-3xl p-6">
        <div class="popup-header flex justify-between items-center mb-4">
          <h2 class="popup-title text-xl font-semibold">Select an Example Template</h2>
          <button id="close-example-popup" class="close-button text-gray-600 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <!-- Close icon -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="popup-form overflow-auto max-h-96">
          <ul class="example-list">
            ${exampleTemplates.map((template, index) => `
              <li class="example-item p-4 border-b hover:bg-gray-100 cursor-pointer" data-index="${index}">
                <h3 class="text-lg font-medium">${template.name}</h3>
                <p class="text-gray-600">${template.description}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
      <div class="popup-overlay fixed inset-0 bg-black opacity-50"></div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popupHtml);
  toggleBlur(true);

  // Event listeners for closing the popup and selecting an example
  document.getElementById('close-example-popup').addEventListener('click', () => {
    document.getElementById('example-selection-popup').remove();
    toggleBlur(false);
  });

  document.querySelectorAll('.example-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.getAttribute('data-index'), 10);
      const selectedTemplate = exampleTemplates[index];
      document.getElementById('example-selection-popup').remove();
      createEditPopup(selectedTemplate);
    });
  });
}

// Function to create edit/create popup
function createEditPopup(template = {}) {
  const isNewTemplate = Object.keys(template).length === 0;
  const title = isNewTemplate ? "Add New Template" : "Edit Template";
  const policyAction = template.policy && template.policy.action ? template.policy.action : false;

  const entities = template.policy?.entities || [];
  const resources = template.policy?.resources || [];
  let conditions = template.policy?.conditions || [];

  const actionCondition = template.policy?.action_condition || {};
  const selectedConditions = actionCondition.conditions || [];
  const chainOperator = actionCondition.chain_operator || 'AND';

  // If creating a new template, add the default condition
  if (isNewTemplate) {
    conditions.push({
      include: true,
      type: 2, // CLIENT_APP
      name: 'all'
    });
  }

  const entitiesHtml = entities.map((entity, index) => createEntityFormGroup(entity, index)).join('');
  const resourcesHtml = resources.map((resource, index) => createResourceFormGroup(resource, index)).join('');
  const conditionsHtml = conditions.map((condition, index) => createConditionFormGroup(condition, index)).join('');

  const popupHtml = `
    <div id="edit-popup" class="popup fixed inset-0 flex items-center justify-center z-50">
      <div class="popup-content bg-white rounded-lg shadow-lg w-3/4 max-w-4xl p-6 overflow-y-auto max-h-screen">
        <div class="popup-header flex justify-between items-center mb-4">
          <h2 class="popup-title text-xl font-semibold">${title}</h2>
          <button id="close-popup" class="close-button text-gray-600 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <!-- Close icon -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="pretty-view" class="popup-form">
          <form id="edit-form" class="form-grid grid grid-cols-1 gap-4">
            <!-- Existing form fields -->
            <div class="form-group">
              <label for="id" class="form-label block text-sm font-medium text-gray-700">ID</label>
              <input type="text" id="id" name="id" value="${template.id || ''}" class="form-input mt-1 block w-full" required ${isNewTemplate ? '' : 'readonly'}>
            </div>
            <div class="form-group">
              <label for="name" class="form-label block text-sm font-medium text-gray-700">Name</label>
              <input type="text" id="name" name="name" value="${template.name || ''}" class="form-input mt-1 block w-full" required>
            </div>
            <div class="form-group">
              <label for="state" class="form-label block text-sm font-medium text-gray-700">State</label>
              <select id="state" name="state" class="form-input mt-1 block w-full" required>
                <option value="enabled" ${template.state === "enabled" ? 'selected' : ''}>ON</option>
                <option value="disabled" ${template.state === "disabled" ? 'selected' : ''}>OFF</option>
                <option value="enabledForReportingButNotEnforced" ${template.state === "enabledForReportingButNotEnforced" ? 'selected' : ''}>REPORT</option>
              </select>
            </div>
            <div class="form-group">
              <label for="description" class="form-label block text-sm font-medium text-gray-700">Description</label>
              <input id="description" name="description" class="form-input mt-1 block w-full" value="${template.description || ''}">
            </div>
            <!-- Policy Action Slider -->
            <div class="form-group">
              <label class="form-label block text-sm font-medium text-gray-700">Allow Policy Action</label>
              <div class="slider-container flex items-center">
                <label class="form-label mr-2">${policyAction ? 'Allow' : 'Deny'}</label>
                <label class="switch relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" id="action" name="action" ${policyAction ? 'checked' : ''} class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
            <!-- Action Conditions and Chain Operator (Visible only when Allow Policy Action is enabled) -->
            <div id="action-conditions-section" class="${policyAction ? '' : 'hidden'}">
              <div class="form-group">
                <label for="chain_operator" class="form-label block text-sm font-medium text-gray-700">Chain Operator</label>
                <select id="chain_operator" name="chain_operator" class="form-input mt-1 block w-full">
                  <option value="AND" ${chainOperator === 'AND' ? 'selected' : ''}>AND</option>
                  <option value="OR" ${chainOperator === 'OR' ? 'selected' : ''}>OR</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label class="form-section block text-sm font-medium text-gray-700">Action Conditions</label>
                <div id="action-conditions-container" class="mt-2">
                  ${createActionConditionsCheckboxes(selectedConditions)}
                </div>
              </div>
            </div>
            <!-- Entities Section -->
            <div class="form-group full-width">
              <label class="form-section block text-sm font-medium text-gray-700">Entities</label>
              <div id="entities-container">
                ${entitiesHtml}
              </div>
              ${createAddEntryButton('entity')}
            </div>
            <!-- Resources Section -->
            <div class="form-group full-width">
              <label class="form-section block text-sm font-medium text-gray-700">Resources</label>
              <div id="resources-container">
                ${resourcesHtml}
              </div>
              ${createAddEntryButton('resource')}
            </div>
            <!-- Conditions Section -->
            <div class="form-group full-width">
              <label class="form-section block text-sm font-medium text-gray-700">Conditions</label>
              <div id="conditions-container">
                ${conditionsHtml}
              </div>
              ${createAddEntryButton('condition')}
            </div>
          </form>
        </div>
        <div id="json-view" class="hidden popup-form">
          <textarea id="json-edit" class="form-input h-full w-full p-2 border rounded">${JSON.stringify(template, null, 2)}</textarea>
        </div>
        <div class="popup-footer flex justify-between mt-4">
          <div class="flex items-center space-x-2">
            <div class="relative group">
              <button id="swap-view" class="icon-button p-2 bg-gray-200 rounded hover:bg-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <!-- Icon for swapping views -->
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>
            <div class="relative group">
              <button id="download-template" class="icon-button p-2 bg-gray-200 rounded hover:bg-gray-300">
                <!-- Use the provided download icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <!-- New Download icon -->
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <div id="download-menu" class="download-menu hidden absolute bg-white border rounded mt-2 right-0 shadow-lg">
                <button data-format="json" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">JSON</button>
                <button data-format="yaml" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">YAML</button>
                <button data-format="xml" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">XML</button>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            ${isNewTemplate ? '' : `
            <div class="relative group">
              <button id="delete-entry" class="icon-button p-2 bg-red-200 rounded hover:bg-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <!-- Trash icon -->
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0
                  0116.138 21H7.862a2 2 0
                  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1
                  0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            `}
            <div class="relative group">
              <button id="commit-changes" class="icon-button p-2 bg-green-200 rounded hover:bg-green-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <!-- Check icon -->
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="popup-overlay fixed inset-0 bg-black opacity-50"></div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', popupHtml);
  toggleBlur(true);

  // Function to create checkboxes for action conditions
  function createActionConditionsCheckboxes(selectedConditions) {
    return ACTION_CONDITION_VALUES.map(condition => {
      const isChecked = selectedConditions.includes(condition.value) ? 'checked' : '';
      return `
        <label class="checkbox-container inline-flex items-center mt-2">
          <input type="checkbox" name="action_conditions" value="${condition.value}" ${isChecked} class="form-checkbox h-4 w-4 text-blue-600">
          <span class="ml-2 text-gray-700">${condition.label}</span>
        </label>
      `;
    }).join('');
  }

  // Function to create the "Add Entry" buttons
  function createAddEntryButton(type) {
    return `
      <div id="add-${type}-button" class="add-entry-card flex items-center justify-center mt-4 p-4 border border-dashed rounded cursor-pointer hover:bg-gray-100">
        <div class="add-entry-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 add-icon text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span class="ml-2 text-gray-600">Add ${type.charAt(0).toUpperCase() + type.slice(1)}</span>
      </div>
    `;
  }

  // Functions to create dynamic form groups for entities, resources, and conditions
  function createEntityFormGroup(entity = {}, index) {
    const includeChecked = entity.include ? 'checked' : '';
    return `
      <div class="entity-group border p-4 rounded mt-4" data-index="${index}">
        <div class="entity-group-inner">
          <div class="slider-container flex items-center justify-between">
            <div class="flex items-center">
              <label class="form-label mr-2">Include:</label>
              <label class="switch relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="entities[${index}][include]" ${includeChecked} class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer">
                <span class="slider round"></span>
              </label>
            </div>
            <button type="button" class="remove-entity-button remove-button text-red-600 hover:text-red-800">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <!-- Trash icon -->
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0
                  0116.138 21H7.862a2 2 0
                  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1
                  0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="entity-details mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label block text-sm font-medium text-gray-700">Entity Type:</label>
              <select name="entities[${index}][entity_type]" class="form-input mt-1 block w-full">
                <option value="0" ${entity.type === 0 ? 'selected' : ''}>USER</option>
                <option value="1" ${entity.type === 1 ? 'selected' : ''}>GROUP</option>
                <option value="2" ${entity.type === 2 ? 'selected' : ''}>ROLE</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label block text-sm font-medium text-gray-700">Name:</label>
              <input placeholder="Name" type="text" name="entities[${index}][name]" value="${entity.name || ''}" class="form-input mt-1 block w-full">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function createResourceFormGroup(resource = {}, index) {
    const includeChecked = resource.include ? 'checked' : '';
    return `
      <div class="resource-group border p-4 rounded mt-4" data-index="${index}">
        <div class="resource-group-inner">
          <div class="slider-container flex items-center justify-between">
            <div class="flex items-center">
              <label class="form-label mr-2">Include:</label>
              <label class="switch relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="resources[${index}][include]" ${includeChecked} class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer">
                <span class="slider round"></span>
              </label>
            </div>
            <button type="button" class="remove-resource-button remove-button text-red-600 hover:text-red-800">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <!-- Trash icon -->
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0
                  0116.138 21H7.862a2 2 0
                  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1
                  0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="resource-details mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label block text-sm font-medium text-gray-700">Resource Type:</label>
              <select name="resources[${index}][resource_type]" class="form-input mt-1 block w-full">
                <option value="0" ${resource.type === 0 ? 'selected' : ''}>APP</option>
                <!-- Add more resource types if needed -->
              </select>
            </div>
            <div class="form-group">
              <label class="form-label block text-sm font-medium text-gray-700">Name:</label>
              <input placeholder="Name" type="text" name="resources[${index}][name]" value="${resource.name || ''}" class="form-input mt-1 block w-full">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function createConditionFormGroup(condition = {}, index) {
    const includeChecked = condition.include ? 'checked' : '';
    return `
      <div class="condition-group border p-4 rounded mt-4" data-index="${index}">
        <div class="condition-group-inner">
          <div class="slider-container flex items-center justify-between">
            <div class="flex items-center">
              <label class="form-label mr-2">Include:</label>
              <label class="switch relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="conditions[${index}][include]" ${includeChecked} class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer">
                <span class="slider round"></span>
              </label>
            </div>
            <button type="button" class="remove-condition-button remove-button text-red-600 hover:text-red-800">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <!-- Trash icon -->
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0
                  0116.138 21H7.862a2 2 0
                  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1
                  0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="condition-details mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label block text-sm font-medium text-gray-700">Condition Type:</label>
              <select name="conditions[${index}][condition_type]" class="form-input mt-1 block w-full">
                ${CONDITION_TYPE_VALUES.map(ct => `
                  <option value="${ct.value}" ${condition.type === ct.value ? 'selected' : ''}>${ct.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label block text-sm font-medium text-gray-700">Name:</label>
              <input placeholder="Name" type="text" name="conditions[${index}][name]" value="${condition.name || ''}" class="form-input mt-1 block w-full">
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
      editForm.elements['state'].value = jsonData.state || 'disabled';
      editForm.elements['description'].value = jsonData.description || '';
      editForm.elements['action'].checked = jsonData.policy?.action;

      // Update the Policy Action label
      const actionLabel = editForm.querySelector('.form-group .slider-container .form-label');
      actionLabel.textContent = jsonData.policy?.action ? 'Allow' : 'Deny';

      // Show/hide action conditions section
      const actionConditionsSection = document.getElementById('action-conditions-section');
      if (jsonData.policy?.action) {
        actionConditionsSection.classList.remove('hidden');
      } else {
        actionConditionsSection.classList.add('hidden');
      }

      // Update chain operator
      editForm.elements['chain_operator'].value = jsonData.policy?.action_condition?.chain_operator || 'AND';

      // Update action conditions checkboxes
      const selectedConditions = jsonData.policy?.action_condition?.conditions || [];
      const actionConditionsContainer = document.getElementById('action-conditions-container');
      actionConditionsContainer.innerHTML = createActionConditionsCheckboxes(selectedConditions);

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
    jsonData.state = formData.get('state') || 'disabled';
    jsonData.description = formData.get('description');
    jsonData.policy = {
      action: formData.get('action') === 'on',
      action_condition: {
        chain_operator: formData.get('chain_operator') || 'AND',
        conditions: []
      },
      entities: [],
      resources: [],
      conditions: []
    };

    // Update the Policy Action label
    const actionLabel = editForm.querySelector('.form-group .slider-container .form-label');
    actionLabel.textContent = jsonData.policy.action ? 'Allow' : 'Deny';

    // Show/hide action conditions section
    const actionConditionsSection = document.getElementById('action-conditions-section');
    if (jsonData.policy.action) {
      actionConditionsSection.classList.remove('hidden');
    } else {
      actionConditionsSection.classList.add('hidden');
    }

    // Process action conditions if policy action is allowed
    if (jsonData.policy.action) {
      const checkedConditions = Array.from(editForm.querySelectorAll('input[name="action_conditions"]:checked'))
        .map(input => parseInt(input.value, 10));
      jsonData.policy.action_condition.conditions = checkedConditions;
      jsonData.policy.action_condition.chain_operator = formData.get('chain_operator') || 'AND';
    } else {
      jsonData.policy.action_condition = null;
    }

    // Process entities
    const entityGroups = editForm.querySelectorAll('.entity-group');
    entityGroups.forEach((group) => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`entities[${index}][include]`) === 'on';
      const entity_type = parseInt(formData.get(`entities[${index}][entity_type]`), 10);
      const name = formData.get(`entities[${index}][name]`);

      jsonData.policy.entities.push({
        include,
        type: entity_type,
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
        type: resource_type,
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
        type: condition_type,
        name
      });
    });

    jsonEdit.value = JSON.stringify(jsonData, null, 2);
  }

  editForm.addEventListener('input', updateJsonFromForm);
  jsonEdit.addEventListener('input', updateFormFromJson);

  // Update Policy Action label and show/hide action conditions on change
  const actionCheckbox = editForm.elements['action'];
  actionCheckbox.addEventListener('change', () => {
    const actionLabel = editForm.querySelector('.form-group .slider-container .form-label');
    actionLabel.textContent = actionCheckbox.checked ? 'Allow' : 'Deny';
    const actionConditionsSection = document.getElementById('action-conditions-section');
    if (actionCheckbox.checked) {
      actionConditionsSection.classList.remove('hidden');
    } else {
      actionConditionsSection.classList.add('hidden');
    }
    updateJsonFromForm();
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
        // Call the function with the ID as a parameter
        deleteTemplateById(template.id);

        // Existing code to remove the template and refresh the grid
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
    updatedTemplate.state = formData.get('state') || 'disabled';
    updatedTemplate.description = formData.get('description');
    updatedTemplate.policy = {
      action: formData.get('action') === 'on',
      action_condition: {
        chain_operator: formData.get('chain_operator') || 'AND',
        conditions: []
      },
      entities: [],
      resources: [],
      conditions: []
    };

    // Process action conditions if policy action is allowed
    if (updatedTemplate.policy.action) {
      const checkedConditions = Array.from(editForm.querySelectorAll('input[name="action_conditions"]:checked'))
        .map(input => parseInt(input.value, 10));
      updatedTemplate.policy.action_condition.conditions = checkedConditions;
      updatedTemplate.policy.action_condition.chain_operator = formData.get('chain_operator') || 'AND';
    } else {
      updatedTemplate.policy.action_condition = null;
    }

    // Process entities
    const entityGroups = editForm.querySelectorAll('.entity-group');
    entityGroups.forEach(group => {
      const index = group.getAttribute('data-index');
      const include = formData.get(`entities[${index}][include]`) === 'on';
      const entity_type = parseInt(formData.get(`entities[${index}][entity_type]`), 10);
      const name = formData.get(`entities[${index}][name]`);

      updatedTemplate.policy.entities.push({
        include,
        type: entity_type,
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
        type: resource_type,
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
        type: condition_type,
        name
      });
    });

    // Call the function with the JSON as a parameter
    processTemplate(updatedTemplate);

    // Existing code to update templates array and refresh the grid
    if (isNewTemplate || templates.findIndex(t => t.id === updatedTemplate.id) === -1) {
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

  // Download button functionality
  const downloadTemplateButton = document.getElementById('download-template');
  const downloadMenu = document.getElementById('download-menu');

  downloadTemplateButton.addEventListener('click', (event) => {
    event.stopPropagation();
    downloadMenu.classList.toggle('hidden');
  });

  // Close the download menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!downloadTemplateButton.contains(event.target) && !downloadMenu.contains(event.target)) {
      downloadMenu.classList.add('hidden');
    }
  });

  // Add event listeners to the menu buttons
  downloadMenu.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const format = button.getAttribute('data-format');
      downloadTemplate(format);
      downloadMenu.classList.add('hidden');
    });
  });

  function downloadTemplate(format) {
    let jsonData;
    try {
      jsonData = JSON.parse(jsonEdit.value);
    } catch (e) {
      alert('Invalid JSON data. Cannot download.');
      return;
    }

    let content = '';
    let filename = jsonData.id || 'template';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(jsonData, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'yaml':
        // Convert jsonData to YAML
        content = jsonToYaml(jsonData);
        filename += '.yaml';
        mimeType = 'application/x-yaml';
        break;
      case 'xml':
        // Convert jsonData to XML
        content = jsonToXml(jsonData);
        filename += '.xml';
        mimeType = 'application/xml';
        break;
      default:
        alert('Unsupported format');
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Simple JSON to YAML converter
  function jsonToYaml(obj) {
    function convert(obj, indent) {
      let yaml = '';
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            yaml += `${' '.repeat(indent)}${key}:\n${convert(value, indent + 2)}`;
          } else {
            yaml += `${' '.repeat(indent)}${key}: ${value}\n`;
          }
        }
      }
      return yaml;
    }
    return convert(obj, 0);
  }

  // Simple JSON to XML converter
  function jsonToXml(obj) {
    function convert(obj) {
      let xml = '';
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            xml += `<${key}>${convert(value)}</${key}>`;
          } else {
            xml += `<${key}>${value}</${key}>`;
          }
        }
      }
      return xml;
    }
    return `<root>${convert(obj)}</root>`;
  }

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
    });
  });

  const addNewCard = document.getElementById('add-new-card');
  addNewCard.addEventListener('click', () => {
    createEditPopup();
  });

  const addExampleCard = document.getElementById('add-example-card');
  addExampleCard.addEventListener('click', () => {
    createExampleSelectionPopup();
  });
}

// Initial call to set up event listeners
refreshGrid();

// Function to create a single card
function createCard(person) {
  return `
    <div class="bg-white shadow-md rounded-lg p-6 relative">
      <div class="absolute top-5 right-5 cursor-pointer">
        <img src="/static/assets/i.svg" class="h-6 w-6 text-blue-500 icon">
      </div>
      <h2 class="text-xl font-semibold mb-2">${person.name}</h2>
      <p class="text-gray-600">${person.jobTitle}</p>
      <p class="text-gray-600">Age: ${person.age}</p>
      <p class="text-gray-600">Location: ${person.location}</p>
    </div>
  `;
}

// Function to create the "Add New" card
function createAddNewCard() {
  return `
    <div id="add-new-card" class="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors duration-300">
      <div class="text-gray-400 hover:text-gray-600 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-sm font-medium">Add New</span>
      </div>
    </div>
  `;
}

// Function to generate the entire grid
function generateCardGrid(people) {
  const cardsHtml = people.map(person => createCard(person)).join('');
  const addNewCardHtml = createAddNewCard();
  
  return `
    <div id="main-content" class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-blue-500 mb-6">Card Grid</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${cardsHtml}
        ${addNewCardHtml}
      </div>
    </div>
  `;
}

// Function to create edit/create popup
function createEditPopup(person = {}) {
  const isNewPerson = Object.keys(person).length === 0;
  const title = isNewPerson ? "Add New Person" : "Edit Person";

  return `
    <div id="edit-popup" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg w-full max-w-2xl h-3/4 relative z-10 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-3xl font-bold">${title}</h2>
          <button id="close-popup" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="pretty-view" class="flex-grow overflow-auto">
          <form id="edit-form">
            <div class="mb-4">
              <label for="name" class="block text-gray-700 text-sm font-bold mb-2">Name:</label>
              <input type="text" id="name" name="name" value="${person.name || ''}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
            </div>
            <div class="mb-4">
              <label for="jobTitle" class="block text-gray-700 text-sm font-bold mb-2">Job Title:</label>
              <input type="text" id="jobTitle" name="jobTitle" value="${person.jobTitle || ''}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
            </div>
            <div class="mb-4">
              <label for="age" class="block text-gray-700 text-sm font-bold mb-2">Age:</label>
              <input type="number" id="age" name="age" value="${person.age || ''}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
            </div>
            <div class="mb-4">
              <label for="location" class="block text-gray-700 text-sm font-bold mb-2">Location:</label>
              <input type="text" id="location" name="location" value="${person.location || ''}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
            </div>
            <div class="mb-4">
              <label for="bio" class="block text-gray-700 text-sm font-bold mb-2">Bio:</label>
              <textarea id="bio" name="bio" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" rows="3">${person.bio || ''}</textarea>
            </div>
          </form>
        </div>
        <div id="json-view" class="hidden flex-grow overflow-auto">
          <textarea id="json-edit" class="w-full h-full p-4 font-mono text-sm">${JSON.stringify(person, null, 2)}</textarea>
        </div>
        <div class="flex justify-between items-center mt-4">
          <div class="relative group">
            <button id="swap-view" class="text-blue-500 hover:text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Switch View
            </div>
          </div>
          <div class="flex items-center space-x-2">
            ${isNewPerson ? '' : `
            <div class="relative group">
              <button id="delete-entry" class="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon trash-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Delete Entry
              </div>
            </div>
            `}
            <div class="relative group">
              <button id="commit-changes" class="text-green-500 hover:text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Commit Changes
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="fixed inset-0 bg-black opacity-50"></div>
    </div>
  `;
}

// Example usage
let people = [
  { name: "John Doe", jobTitle: "Software Engineer", age: 28, location: "New York, NY", bio: "Passionate about web development and AI." },
  { name: "Jane Smith", jobTitle: "Product Manager", age: 32, location: "San Francisco, CA", bio: "Experienced in leading cross-functional teams." },
  { name: "Bob Johnson", jobTitle: "UX Designer", age: 35, location: "London, UK", bio: "Creating intuitive and beautiful user experiences." },
];

// Generate the HTML
let gridHtml = generateCardGrid(people);

// Insert the generated HTML into the DOM
document.getElementById('content-container').innerHTML = gridHtml;

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
  gridHtml = generateCardGrid(people);
  document.getElementById('content-container').innerHTML = gridHtml;
  addEventListeners();
}

// Function to handle form submission
function handleFormSubmit(index) {
  const form = document.getElementById('edit-form');
  const formData = new FormData(form);
  const updatedPerson = Object.fromEntries(formData.entries());
  updatedPerson.age = parseInt(updatedPerson.age, 10);
  
  if (index === undefined) {
    people.push(updatedPerson);
  } else {
    people[index] = updatedPerson;
  }
  
  refreshGrid();
  document.getElementById('edit-popup').remove();
  toggleBlur(false);
}

// Function to handle entry deletion
function handleDelete(index) {
  if (confirm('Are you sure you want to delete this entry?')) {
    people.splice(index, 1);
    refreshGrid();
    document.getElementById('edit-popup').remove();
    toggleBlur(false);
  }
}

// Function to add all event listeners
function addEventListeners() {
  const infoIcons = document.querySelectorAll('.icon');
  infoIcons.forEach((icon, index) => {
    icon.addEventListener('click', () => {
      const person = people[index];
      const popupHtml = createEditPopup(person);
      document.body.insertAdjacentHTML('beforeend', popupHtml);
      
      toggleBlur(true);
      
      document.getElementById('close-popup').addEventListener('click', () => {
        document.getElementById('edit-popup').remove();
        toggleBlur(false);
      });

      document.getElementById('swap-view').addEventListener('click', () => {
        const prettyView = document.getElementById('pretty-view');
        const jsonView = document.getElementById('json-view');
        prettyView.classList.toggle('hidden');
        jsonView.classList.toggle('hidden');
      });

      document.getElementById('commit-changes').addEventListener('click', () => handleFormSubmit(index));

      const deleteButton = document.getElementById('delete-entry');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => handleDelete(index));
      }
    });
  });


  const addNewCard = document.getElementById('add-new-card');
  addNewCard.addEventListener('click', () => {
    const popupHtml = createEditPopup();
    document.body.insertAdjacentHTML('beforeend', popupHtml);
    
    toggleBlur(true);
    
    document.getElementById('close-popup').addEventListener('click', () => {
      document.getElementById('edit-popup').remove();
      toggleBlur(false);
    });

    document.getElementById('swap-view').addEventListener('click', () => {
      const prettyView = document.getElementById('pretty-view');
      const jsonView = document.getElementById('json-view');
      prettyView.classList.toggle('hidden');
      jsonView.classList.toggle('hidden');
    });

    document.getElementById('commit-changes').addEventListener('click', () => handleFormSubmit());
  });
}

// Initial addition of event listeners
document.addEventListener('DOMContentLoaded', addEventListeners);
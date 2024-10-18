// Function to create a single card
function createCard(person) {
    return `
      <div class="bg-white shadow-md rounded-lg p-6 relative">
        <div class="absolute top-2 right-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <line x1="12" y1="16" x2="12" y2="12" stroke-width="2" />
            <line x1="12" y1="8" x2="12" y2="8" stroke-width="2" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold mb-2">${person.name}</h2>
        <p class="text-gray-600">${person.jobTitle}</p>
        <p class="text-gray-600">Age: ${person.age}</p>
        <p class="text-gray-600">Location: ${person.location}</p>
      </div>
    `;
  }
  
  // Function to generate the entire grid
  function generateCardGrid(people) {
    const cardsHtml = people.map(person => createCard(person)).join('');
    
    return `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-blue-500 mb-6">Card Grid</h1>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${cardsHtml}
        </div>
      </div>
    `;
  }
  
  // Example usage
  const people = [
    { name: "John Doe", jobTitle: "Software Engineer", age: 28, location: "New York, NY" },
    { name: "Jane Smith", jobTitle: "Product Manager", age: 32, location: "San Francisco, CA" },
    { name: "Bob Johnson", jobTitle: "UX Designer", age: 35, location: "London, UK" },
    // Add more people as needed
  ];
  
  // Generate the HTML
  const gridHtml = generateCardGrid(people);
  
  // Insert the generated HTML into the DOM
  document.getElementById('content-container').innerHTML = gridHtml;
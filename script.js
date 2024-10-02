const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const continueSearchButton = document.getElementById('continueSearch');

let currentPage = 1;
let currentSearchTerm = '';

searchButton.addEventListener('click', () => performSearch(true));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch(true);
    }
});
continueSearchButton.addEventListener('click', () => performSearch(false));

function performSearch(newSearch) {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        if (newSearch) {
            currentPage = 1;
            currentSearchTerm = searchTerm;
        } else {
            currentPage++;
        }
        searchiNaturalist(currentSearchTerm, currentPage);
    }
}

async function searchiNaturalist(term, page) {
    showLoading(true);
    if (page === 1) {
        resultsDiv.classList.add("hidden");
        resultsDiv.innerHTML = "";
    }
    const apiUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(term)}&per_page=5&page=${page}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        displayResults(data.results, page === 1);
        continueSearchButton.classList.remove('hidden');
    } catch (error) {
        console.error("Error fetching data:", error);
        resultsDiv.innerHTML += "<p>Error fetching data from iNaturalist. Please try again later.</p>";
        resultsDiv.classList.remove("hidden");
    } finally {
        showLoading(false);
    }
}

function displayResults(results, clearPrevious) {
    if (clearPrevious) {
        resultsDiv.innerHTML = "";
    }
    resultsDiv.classList.remove("hidden");

    if (results.length === 0) {
        resultsDiv.innerHTML += "<p>No results found.</p>";
        continueSearchButton.classList.add('hidden');
        return;
    }

    results.forEach(result => {
        const commonName = result.preferred_common_name || 'No common name';
        const scientificName = result.name;
        const photoUrl = result.default_photo?.medium_url || 'https://via.placeholder.com/200x200?text=No+Image';

        const speciesDiv = document.createElement('div');
        speciesDiv.classList.add('species');
        speciesDiv.innerHTML = `
            <img src="${photoUrl}" alt="${commonName}" crossorigin="anonymous">
            <div class="species-info">
                <h3>${commonName}</h3>
                <p><em>${scientificName}</em></p>
                <button class="download-btn">Download Postcard</button>
            </div>
        `;

        speciesDiv.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            createPostcard(commonName, scientificName, photoUrl);
        });

        resultsDiv.appendChild(speciesDiv);
    });
}

function createPostcard(commonName, scientificName, imageUrl) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.crossOrigin = 'anonymous';
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height + 50; // Add space for text
        ctx.drawImage(img, 0, 0);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'black';
        ctx.fillText(commonName, 10, img.height + 25);
        ctx.fillText(scientificName, 10, img.height + 45);

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${commonName}.png`;
        link.click();
    };

    img.src = photoUrl;


}


function showLoading(isLoading) {
    loadingDiv.classList.toggle('hidden', !isLoading);
    searchButton.disabled = isLoading;
    continueSearchButton.disabled = isLoading;
}
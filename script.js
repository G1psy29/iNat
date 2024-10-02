// DOM elements
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const continueSearchButton = document.getElementById('continueSearch');
const customSelect = document.querySelector('.custom-select');
const selectSelected = customSelect ? customSelect.querySelector('.select-selected') : null;
const selectItems = customSelect ? customSelect.querySelector('.select-items') : null;

// Variables
let currentPage = 1;
let currentSearchTerm = '';
let currentRankLevel = 0;
let lastRequestTime = 0;

// Error checking
if (!searchInput || !searchButton || !resultsDiv || !loadingDiv || !continueSearchButton || !customSelect || !selectSelected || !selectItems) {
    console.error('One or more required DOM elements are missing');
}

// Custom dropdown functionality
if (selectSelected && selectItems) {
    selectSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        selectItems.classList.toggle('select-hide');
        this.classList.toggle('select-arrow-active');
    });

    selectItems.addEventListener('click', function(e) {
        if (e.target.tagName === 'DIV') {
            selectSelected.innerHTML = e.target.innerHTML;
            currentRankLevel = parseInt(e.target.getAttribute('data-value'));
            this.classList.add('select-hide');
        }
    });

    document.addEventListener('click', function() {
        selectItems.classList.add('select-hide');
        selectSelected.classList.remove('select-arrow-active');
    });
}

// Event listeners
if (searchButton) {
    searchButton.addEventListener('click', () => performSearch(true));
}

if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(true);
        }
    });
}

if (continueSearchButton) {
    continueSearchButton.addEventListener('click', () => performSearch(false));
}

function performSearch(newSearch) {
    if (!searchInput) return;
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        if (newSearch) {
            currentPage = 1;
            currentSearchTerm = searchTerm;
            if (resultsDiv) resultsDiv.innerHTML = "";
        } else {
            currentPage++;
        }
        searchiNaturalist(currentSearchTerm, currentRankLevel, currentPage);
    }
}

async function searchiNaturalist(term, rankLevel, page) {
    if (!loadingDiv || !continueSearchButton || !resultsDiv) return;

    showLoading(true);
    let apiUrl = new URL('https://api.inaturalist.org/v1/taxa');
    let params = new URLSearchParams({
        q: term,
        per_page: 5,
        page: page,
        quality_grade: 'research',
        identifications: 'any'
    });

    if (rankLevel > 0) {
        params.append('rank_level', rankLevel);
    }

    apiUrl.search = params.toString();

    // Implement rate limiting
    const now = Date.now();
    const timeToWait = Math.max(0, 1000 - (now - lastRequestTime));
    await new Promise(resolve => setTimeout(resolve, timeToWait));
    lastRequestTime = Date.now();

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'iNaturalistExplorer/1.0 (https://github.com/G1psy29/iNat)'
            }
        });
        if (!response.ok) {
            if (response.status === 503) {
                throw new Error('iNaturalist API is currently unavailable. Please try again later.');
            }
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        displayResults(data.results, page === 1);
        continueSearchButton.classList.toggle('hidden', data.results.length === 0);
    } catch (error) {
        console.error("Error fetching data:", error);
        resultsDiv.innerHTML += `<p>${error.message}</p>`;
        resultsDiv.classList.remove("hidden");
    } finally {
        showLoading(false);
    }
}

function displayResults(results, clearPrevious) {
    if (!resultsDiv) return;

    if (clearPrevious) {
        resultsDiv.innerHTML = "";
    }
    resultsDiv.classList.remove("hidden");

    if (results.length === 0) {
        resultsDiv.innerHTML += "<p>No results found.</p>";
        if (continueSearchButton) continueSearchButton.classList.add('hidden');
        return;
    }

    results.forEach(result => {
        const commonName = result.preferred_common_name || 'No common name';
        const scientificName = result.name;
        const photoUrl = result.default_photo?.medium_url || 'https://via.placeholder.com/200x200?text=No+Image';
        const rank = result.rank || 'Unknown rank';

        const speciesDiv = document.createElement('div');
        speciesDiv.classList.add('species');
        speciesDiv.innerHTML = `
            <img src="${photoUrl}" alt="${commonName}" crossorigin="anonymous">
            <div class="species-info">
                <h3>${commonName}</h3>
                <p><em>${scientificName}</em></p>
                <p>Rank: ${rank}</p>
                <button class="download-btn">Download Postcard</button>
            </div>
        `;

        speciesDiv.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            createPostcard(commonName, scientificName, photoUrl, rank);
        });

        resultsDiv.appendChild(speciesDiv);
    });
}

function showLoading(isLoading) {
    if (loadingDiv) loadingDiv.classList.toggle('hidden', !isLoading);
    if (searchButton) searchButton.disabled = isLoading;
    if (continueSearchButton) continueSearchButton.disabled = isLoading;
}

// The createPostcard function remains unchanged

function createPostcard(commonName, scientificName, imageUrl) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        canvas.width = 600;
        canvas.height = 400;
        
        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw image
        const aspectRatio = image.width / image.height;
        let drawWidth = canvas.width * 0.7;
        let drawHeight = drawWidth / aspectRatio;
        if (drawHeight > canvas.height * 0.7) {
            drawHeight = canvas.height * 0.7;
            drawWidth = drawHeight * aspectRatio;
        }
        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        
        // Add a subtle shadow to the image
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, drawWidth, drawHeight);
        ctx.drawImage(image, x, y, drawWidth, drawHeight);
        ctx.shadowColor = 'transparent';
        
        // Draw text
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 28px Roboto, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(commonName, canvas.width / 2, canvas.height - 350);
        ctx.font = 'italic 20px Roboto, Arial';
        ctx.fillText(scientificName, canvas.width / 2, canvas.height - 30);
        
        // Create download link
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${commonName.replace(/\s+/g, '_')}_postcard.png`;
        link.href = dataUrl;
        link.click();
    };
    image.src = imageUrl;
}

function showLoading(isLoading) {
    loadingDiv.classList.toggle('hidden', !isLoading);
    searchButton.disabled = isLoading;
    continueSearchButton.disabled = isLoading;
}
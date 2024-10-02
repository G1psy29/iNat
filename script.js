document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const continueSearchButton = document.getElementById('continueSearch');

    if (!searchInput || !categoryFilter || !searchButton || !resultsDiv || !loadingDiv || !continueSearchButton) {
        console.error('One or more required elements are missing from the DOM');
        return;
    }

    let currentPage = 1;
    let currentSearchTerm = '';
    let currentRankLevel = '';
    let lastRequestTime = 0;

    searchButton.addEventListener('click', () => performSearch(true));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(true);
        }
    });
    continueSearchButton.addEventListener('click', () => performSearch(false));

    function performSearch(newSearch) {
        const searchTerm = searchInput.value.trim();
        const rankLevel = categoryFilter.value;
        if (searchTerm) {
            if (newSearch) {
                currentPage = 1;
                currentSearchTerm = searchTerm;
                currentRankLevel = rankLevel;
                resultsDiv.innerHTML = "";
            } else {
                currentPage++;
            }
            searchiNaturalist(currentSearchTerm, currentRankLevel, currentPage);
        }
    }

    async function searchiNaturalist(term, rankLevel, page) {
        showLoading(true);
        let apiUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(term)}&per_page=5&page=${page}`;
        
        if (rankLevel) {
            apiUrl += `&rank_level=${encodeURIComponent(rankLevel)}`;
        }

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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayResults(data.results, page === 1);
            continueSearchButton.classList.toggle('hidden', data.results.length === 0);
        } catch (error) {
            console.error("Error fetching data:", error);
            resultsDiv.innerHTML += `<p>Error: ${error.message}</p>`;
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
            const rank = result.rank || 'Unknown rank';

            const speciesDiv = document.createElement('div');
            speciesDiv.classList.add('species');
            speciesDiv.innerHTML = `
                <img src="${photoUrl}" alt="${commonName}" crossorigin="anonymous">
                <div class="species-info">
                    <h3>${commonName}</h3>
                    <p><em>${scientificName}</em></p>
                    <p class="rank">Rank: ${rank}</p>
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

    function createPostcard(commonName, scientificName, imageUrl, rank) {
        // Implement postcard creation logic here
        console.log('Creating postcard for:', commonName, scientificName, rank);
    }

    function showLoading(isLoading) {
        loadingDiv.classList.toggle('hidden', !isLoading);
        searchButton.disabled = isLoading;
        continueSearchButton.disabled = isLoading;
    }
});
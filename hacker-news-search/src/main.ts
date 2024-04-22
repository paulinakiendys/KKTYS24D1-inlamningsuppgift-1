import { search } from "./api";
import "./assets/scss/app.scss";
import { AxiosError } from "axios";
import { SearchResult } from "./types/searchResult.types";

const searchFormEl = document.querySelector<HTMLFormElement>("#search-form")!;
const searchInputEl =
  document.querySelector<HTMLInputElement>("#search-input")!;
const submitButtonEl =
  document.querySelector<HTMLButtonElement>("#submit-button")!;
const searchResultsWrapperEl = document.querySelector<HTMLDivElement>(
  "#search-results-wrapper"
)!;
const loadingSpinnerEl =
  document.querySelector<HTMLDivElement>("#loading-spinner")!;

const searchParams = new URLSearchParams(window.location.search);

let endpoint = "/search";
let query = searchParams.get("query");
let tags = "story";
let page = searchParams.get("page") || 0;
let numericFilters = searchParams.get("numericFilters") || "points>0";
let searchResult: SearchResult | null = null;

if (numericFilters === "created_at_i>0") {
  endpoint = "/search_by_date";
}

const handleError = (err: unknown) => {
  if (err instanceof AxiosError) {
    alert("Network error, response code was: " + err.message);
  } else if (err instanceof Error) {
    alert("Something went wrong: " + err.message);
  } else {
    alert("Something went wrong.");
  }
};

const init = async () => {
  if (!query) {
    return;
  }

  try {
    loadingSpinnerEl.hidden = false;
    page = Number(page);
    searchResult = await search(endpoint, {
      query,
      tags,
      page,
      numericFilters,
    });
    renderSearchResult();
  } catch (error) {
    handleError(error);
  } finally {
    loadingSpinnerEl.hidden = true;
  }
};

const renderSearchResult = () => {
  if (searchResult) {
    searchResultsWrapperEl.innerHTML = `
      <div class="d-flex justify-content-between align-items-end mb-3">
        <p class="mb-1">Showing results for ${searchResult.query}...</p>
        <div class="form-floating">
          <select class="form-select" id="sort" aria-label="Sort by select">
            <option value="points>0" ${
              numericFilters === "points>0" ? "selected" : ""
            }>Points</option>
            <option value="created_at_i>0" ${
              numericFilters === "created_at_i>0" ? "selected" : ""
            }>Created at</option>
          </select>
          <label for="sort">Sort by</label>
        </div>
      </div>
  
      <div class="list-group mb-3">
        ${searchResult.hits
          .map(
            (hit) => `
              <a href="${
                hit.url
              }" class="list-group-item list-group-item-action" target="_blank">
                <h5 class="mb-1">${hit.title}</h5>
                <small class="text-muted">${hit.points} points by ${
              hit.author
            } at ${new Date(hit.created_at_i * 1000).toLocaleString()}</small>
              </a>
            `
          )
          .join("")}
      </div>
  
      <div class="d-flex justify-content-between align-items-center">
        <button class="btn btn-primary action-prev" ${
          searchResult.page === 0 ? "disabled" : ""
        }>Prev</button>
        <span>${searchResult.page + 1}</span>
        <button class="btn btn-primary action-next" ${
          searchResult.page + 1 >= searchResult.nbPages ? "disabled" : ""
        }>Next</button>
      </div>`;
  }
};

const updateSearchResults = async () => {
  if (!query) {
    return;
  }
  try {
    loadingSpinnerEl.hidden = false;
    searchResultsWrapperEl.innerHTML = "";
    page = Number(page);
    searchResult = await search(endpoint, {
      query,
      tags,
      page,
      numericFilters,
    });
    renderSearchResult();
  } catch (error) {
    handleError(error);
  } finally {
    loadingSpinnerEl.hidden = true;
  }
};

const handleSortChange = async (target: HTMLSelectElement) => {
  numericFilters = target.value;
  searchParams.set("numericFilters", numericFilters);

  if (numericFilters === "points>0") {
    endpoint = "/search";
  } else if (numericFilters === "created_at_i>0") {
    endpoint = "/search_by_date";
  }

  window.history.replaceState(
    {},
    "",
    `${window.location.origin}${endpoint}?${searchParams.toString()}`
  );

  await updateSearchResults();
};

const handlePaginationClick = async (action: string) => {
  if (action === "prev") {
    page = Number(page) - 1;
  } else if (action === "next") {
    page = Number(page) + 1;
  }
  searchParams.set("page", page.toString());
  window.history.replaceState(
    {},
    "",
    `${window.location.origin}${
      window.location.pathname
    }?${searchParams.toString()}`
  );
  await updateSearchResults();
};

searchInputEl.addEventListener("input", () => {
  submitButtonEl.disabled = !searchInputEl.value.trim().length;
});

searchResultsWrapperEl.addEventListener("change", async (e) => {
  if (!query) {
    return;
  }

  const target = e.target as HTMLSelectElement;
  if (target.id === "sort") {
    await handleSortChange(target);
  }
});

searchResultsWrapperEl.addEventListener("click", async (e) => {
  if (!query) {
    return;
  }

  const target = e.target as HTMLElement;

  if (target.classList.contains("action-prev")) {
    await handlePaginationClick("prev");
  }

  if (target.classList.contains("action-next")) {
    await handlePaginationClick("next");
  }
});

searchFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  query = searchInputEl.value.trim();

  if (!query) {
    return;
  }

  page = 0;
  searchParams.set("query", query);
  searchParams.set("tags", tags);
  searchParams.set("page", page.toString());
  searchParams.set("numericFilters", numericFilters);
  window.history.replaceState(
    {},
    "",
    `${window.location.origin}${endpoint}?${searchParams.toString()}`
  );

  await updateSearchResults();

  searchInputEl.value = "";
});

init();

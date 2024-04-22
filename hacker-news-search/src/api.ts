import axios from "axios";
import { SearchResult } from "./types/searchResult.types";

export type Params = {
  query: string;
  tags: string;
  page: number;
  numericFilters: string;
};

axios.defaults.baseURL = "https://hn.algolia.com/api/v1";

const get = async <Payload, Return>(endpoint: string, params: Payload) => {
  const response = await axios.get<Return>(endpoint, { params });
  return response.data;
};

export const search = async (endpoint: string, params: Params) => {
  return get<Params, SearchResult>(endpoint, params);
};

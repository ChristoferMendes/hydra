import { useEffect, useState } from "react";
import { omit } from "lodash-es";

export interface Filters {
  readyToPlay: boolean;
  sorts: {
    createdAt: boolean;
  };
}

type Filter = keyof Omit<Filters, "sorts">;

const baseFilters: Filters = {
  readyToPlay: false,
  sorts: {
    createdAt: true,
  },
};

const siderBarFiltersKey = "sidebarFilters";

export function useSidebarFilters() {
  function getFilters() {
    const storedFilters = window.localStorage.getItem(siderBarFiltersKey);

    if (storedFilters) {
      return JSON.parse(storedFilters);
    }

    return baseFilters;
  }

  const [filters, setFilters] = useState<Filters>(getFilters());

  function updateLocalStorage() {
    window.localStorage.setItem(siderBarFiltersKey, JSON.stringify(filters));
  }

  function toggleFilter(filter: Filter) {
    setFilters((prevFilters) => ({
      ...omit(baseFilters, "sorts"),
      sorts: prevFilters.sorts,
      [filter]: !prevFilters[filter],
    }));
  }

  function toggleSort(sort: keyof Filters["sorts"]) {
    setFilters((prevFilters) => ({
      ...prevFilters,
      sorts: {
        ...prevFilters.sorts,
        [sort]: !prevFilters.sorts[sort],
      },
    }));
  }

  useEffect(() => {
    updateLocalStorage();
  }, [filters]);

  return {
    toggleFilter,
    toggleSort,
    filters,
  };
}

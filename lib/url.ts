interface FormUrlQueryParams {
  pathname: string;
  params: string;
  key: string;
  value: string;
}

interface RemoveKeysFromUrlQueryParams {
  pathname: string;
  params: string;
  keysToRemove: string[];
}

const buildUrl = (pathname: string, searchParams: URLSearchParams) => {
  const queryString = searchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
};

export const formUrlQuery = ({
  pathname,
  params,
  key,
  value,
}: FormUrlQueryParams) => {
  const searchParams = new URLSearchParams(params);
  searchParams.set(key, value);

  return buildUrl(pathname, searchParams);
};

export const removeKeysFromUrlQuery = ({
  pathname,
  params,
  keysToRemove,
}: RemoveKeysFromUrlQueryParams) => {
  const searchParams = new URLSearchParams(params);
  keysToRemove.forEach((key) => searchParams.delete(key));

  return buildUrl(pathname, searchParams);
};

// The current query string minus ?page=, for when a search or filter
// changes: page 3 of the old results means nothing for the new ones
export const withoutPage = (searchParams: URLSearchParams) => {
  const params = new URLSearchParams(searchParams);
  params.delete("page");
  return params.toString();
};

type SearchParamValue = string | string[] | undefined;

// Repeated params (`?a=1&a=2`) arrive as an array; use the first value
export const getFirstParam = (value: SearchParamValue) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

// "3" -> 3. Anything else ("abc", "-1", "2.5") -> undefined, so the
// default is used instead of the page failing validation.
export const toPositiveInt = (value: string) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
};

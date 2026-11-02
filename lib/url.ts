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

async function request(url, options = {}) {
  const { method = "GET", data, headers = {}, ...rest } = options;

  // const token = window.localStorage.getItem("token");
  const setting = JSON.parse(window.localStorage.getItem("setting"));

  const API_URL = setting?.server.trim("/");

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      // Authorization: `Bearer ${token}`,
    },
    ...rest,
  };

  // // Authorization
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }

  // Body
  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${url}`, config);

  // Coba ambil response JSON
  let result;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  // Error HTTP
  if (!response.ok) {
    const error = new Error(result?.message || `HTTP Error ${response.status}`);

    error.status = response.status;
    error.response = result;

    throw error;
  }

  return result;
}

// GET
function get(url, options = {}) {
  return request(url, {
    ...options,
    method: "GET",
  });
}

// POST
function post(url, data, options = {}) {
  return request(url, {
    ...options,
    method: "POST",
    data,
  });
}

// PUT
function put(url, data, options = {}) {
  return request(url, {
    ...options,
    method: "PUT",
    data,
  });
}

// PATCH
function patch(url, data, options = {}) {
  return request(url, {
    ...options,
    method: "PATCH",
    data,
  });
}

// DELETE
function del(url, options = {}) {
  return request(url, {
    ...options,
    method: "DELETE",
  });
}

const api = {
  request,
  get,
  post,
  put,
  patch,
  delete: del,
};

export default api;

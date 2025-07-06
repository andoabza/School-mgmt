import api from "../axiosConfig";

const loginUser = async (data) => {
  try {
    const response = await api.post('/auth/login', data);

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || 'Invalid credentials');
    }

    if (!response.data?.token) {
      throw new Error('Authentication failed: No token received');
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      // Extract error message from response
      throw new Error(
        error.response.data?.message ||
        `Login failed (${error.response.status})`
      );
    } else if (error.request) {
      throw new Error('Network error - no response from server');
    } else {
      throw new Error(error.message || 'Login request failed');
    }
  }
};

const getUser = async () => {
    try {
        const response = await api.get('/auth/me');
        if (response.status !== 200) {
            throw new Error('Failed to fetch user data');
        }
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
            error.message ||
            'Failed to fetch user data'
        );
    }
};

export { loginUser, getUser };
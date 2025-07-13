import api from "../axiosConfig";

const loginUser = async (data) => {
    const response = await api.post('/users/login', data);
    return response.data;
    
};

const getUser = async () => {
    try {
        const response = await api.get('/users/me');
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
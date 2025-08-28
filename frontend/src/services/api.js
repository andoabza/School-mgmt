import api from "../axiosConfig";

export const gradesAPI = async ({studentId, classId}) => {
    const res = await api.get(`grades/student/${studentId}?classId=${classId}`);
    return res.data;
}
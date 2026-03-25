import api from "./axios";

export const getUnits = async () => {
  const res = await api.get("/api/admin/units");
  return res.data;
};
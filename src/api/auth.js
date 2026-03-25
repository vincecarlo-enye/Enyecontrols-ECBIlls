import api from "./axios";

export const login = async (email, password) => {
  await api.get("/sanctum/csrf-cookie");

  const res = await api.post("/api/login", {
    email,
    password,
  });

  return res.data;
};
import { apiRequest } from "../lib/api/client";

const API_PREFIX = "/api/v1";

const toBackendRole = (role) => {
  if (role === "Table Manager") {
    return "USER";
  }

  if (role === "Super Admin") {
    return "SUPER_ADMIN";
  }

  return String(role || "ADMIN").toUpperCase().replace(/\s+/g, "_");
};

const fromBackendRole = (role) => {
  if (role === "TABLE_MANAGER") {
    return "Table Manager";
  }

  if (role === "SUPER_ADMIN") {
    return "Super Admin";
  }

  if (role === "ADMIN") {
    return "Admin";
  }

  if (role === "USER") {
    return "Table Manager";
  }

  return role;
};

export const login = (payload) =>
  apiRequest(`${API_PREFIX}/auth/login`, {
    method: "POST",
    body: {
      username: payload.user?.trim() || payload.username?.trim() || "",
      password: payload.password || "",
    },
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => {
    const user = response?.user || response;

    return {
    token: null,
    user: {
      id: user.id,
      name: user.username,
      email: user.email,
      contact: user.phone,
      role: fromBackendRole(user.role),
      branchId: user.branchId,
      active: user.active,
    },
  };
  });

export const signUp = (payload) =>
  apiRequest(`${API_PREFIX}/users/addUser`, {
    method: "POST",
    params: {
      createdByUserId: payload.createdByUserId ?? undefined,
    },
    body: {
      username: payload.username,
      password: payload.password,
      role: payload.role,
      branchId: payload.branchId,
      active: payload.active,
      email: payload.email,
      phone: payload.phone,
    },
    headers: {
      "Content-Type": "application/json",
    },
  }).then((user) => ({
    user: {
      id: user.id,
      name: user.username,
      email: user.email,
      contact: user.phone,
      role: fromBackendRole(user.role),
      branchId: user.branchId,
      active: user.active,
    },
  }));

export const requestPasswordReset = (payload) =>
  apiRequest(`${API_PREFIX}/auth/request-otp`, {
    method: "POST",
    params: {
      username: payload.username,
    },
  });

export const verifyOtp = async () => ({ verified: true });

export const resetPassword = (payload) =>
  apiRequest(`${API_PREFIX}/auth/change-password`, {
    method: "POST",
    params: {
      username: payload.username,
      otp: payload.otp,
      newPassword: payload.password,
    },
  });

export const getUserById = (id) =>
  apiRequest(`${API_PREFIX}/users/getUserById`, {
    params: { id },
  }).then((user) => ({
    id: user.id,
    name: user.username,
    email: user.email,
    contact: user.phone,
    role: fromBackendRole(user.role),
    branchId: user.branchId,
    active: user.active,
  }));

export const updateUserProfile = (id, payload) =>
  apiRequest(`${API_PREFIX}/users/updateUserById`, {
    method: "PATCH",
    params: { id },
    body: {
      username: payload.username,
      password: payload.password || "",
      role: toBackendRole(payload.role),
      branchId: payload.branchId ?? null,
      active: payload.active ?? true,
      email: payload.email,
      phone: payload.contact,
    },
    headers: {
      "Content-Type": "application/json",
    },
  }).then((user) => ({
    id: user.id,
    name: user.username,
    email: user.email,
    contact: user.phone,
    role: fromBackendRole(user.role),
    branchId: user.branchId,
    active: user.active,
  }));

export const mapSignUpPayload = (payload) => ({
  username: payload.username,
  password: payload.password,
  role: toBackendRole(payload.role),
  branchId: payload.branchId ?? null,
  createdByUserId: payload.createdByUserId ?? null,
  active: true,
  email: payload.email,
  phone: payload.contact,
});

export const getBranchChoices = () =>
  apiRequest(`${API_PREFIX}/branches/getAllBranches`).then((branches) =>
    branches.map((branch) => ({
      id: branch.id,
      label: [branch.barangay, branch.municipality, branch.province].filter(Boolean).join(", ") || `Branch ${branch.id}`,
      active: Boolean(branch.active),
    }))
  );
